import logging as log
import os, shutil, subprocess, time, urlparse, json
import db

DEFAULT_THREAD_SIZE=5
INCOMMING="incomming"
DOWNLOADS="downloads"

STATE_WAITING=1
STATE_DOWNLOADING=2
STATE_PAUSED=3
STATE_COMPLETED=4
STATE_ERROR=5

class APIError(Exception):
    ERROR_REQUEST_DATA_INVALID = 11
    
    messages = {
        ERROR_REQUEST_DATA_INVALID: 'request data invalid',
    }
    
    def __init__(self, code):
        self.errno = code
        self.message = self.messages[code]

class API(object):
    def __init__(self, curdir='.'):
        self.workdir = os.path.abspath(curdir)
    
    def serve(self, data):
        try:
            action = data['action']
            if action == 'tasks':
                options = data["options"] if data.has_key("options") else {}
                ret = self.tasks(options)
            elif action == 'pause':
                ids = data["ids"]
                ret = self.pause(ids)
            elif action == 'remove':
                ids = data["ids"]
                ret = self.remove(ids)
            elif action == 'create':
                options = data["options"]
                ret = self.create(options)
            elif action == 'resume':
                ids = data["ids"]
                for tid in ids:
                    ret = self.create(None, tid)
            elif action == 'sort':
                ids = data["ids"]
                ret = self.sort(ids)
            elif action == 'maxspeed':
                tid = data["tid"]
                ret = self.maxspeed(tid);
            elif action == "config":
                conf = data["config"]
                ret = self.config(conf)
            else:
                raise APIError(APIError.ERROR_REQUEST_DATA_INVALID)
            
            if ret is None:
                return dict(success=True)
            return json.dumps(dict(success=True, result=ret))
        except KeyError:
            import traceback; traceback.print_exc()
            raise APIError(APIError.ERROR_REQUEST_DATA_INVALID)
        except APIError, e:
            return dict(success=False, errno=e.errno, errmsg=e.message)
        except Exception, e:
            # TODO log error
            import traceback; traceback.print_exc()
            return dict(success=False, errno=0, errmsg="unkown error, please check out the log")

    def create(self, options, tid=0):
        if not options:
            tasks = db.select_tasks(id=tid)
            if tasks:
                task = tasks[0]
                url = task["url"]
                output = task["output"]
                state = STATE_DOWNLOADING
                thsize = task["thsize"]
                maxspeed = task["maxspeed"]
                headers = task["headers"]
                subdir = task["subdir"]
                db.update_tasks(tid, state=STATE_DOWNLOADING)
            else:
                return
        else:
            url = options["url"]
            output = options["output"] if options.has_key("output") else \
                os.path.basename(urlparse.urlparse(url)[2])
            if not options.has_key("immediately") or options["immediately"]: state = STATE_DOWNLOADING
            else: state = STATE_PAUSED
            thsize = options["thsize"] if options.has_key("thsize") else DEFAULT_THREAD_SIZE
            maxspeed = options["maxspeed"] if options.has_key("maxspeed") else 0
            headers = options["headers"] if options.has_key("headers") else ""
            subdir = options["subdir"] if options.has_key("subdir") else ""

            tid = db.insert_task(url=url, output=output, state=state, thsize=thsize, maxspeed=maxspeed, headers=headers)

            if state == STATE_PAUSED:
                return

        #create axel task
        pid = os.fork()
        if pid: # old process
            return # as 200 OK
        else: # sub process
            force_download = True

            output_file = os.path.join(INCOMMING, output)
            if os.path.exists(output_file) and not os.path.exists(output_file + '.st'):
              if force_download:
                os.remove(output_file)
              else:
                print 'file completed already, skip download'
                exit()

            args = ["../axel", "-a", "-n", str(thsize), "-s", str(maxspeed), "-o", output]
            for header in headers.splitlines():
                args.append("-H", header)
            args.append(url)
            log.debug(' '.join(args))
            axel_process = subprocess.Popen(args, shell=False, stdout=subprocess.PIPE, cwd=INCOMMING)

            last_update_time = 0
            while 1:
                tasks = db.select_tasks(id=tid)
                if tasks:
                    task = tasks[0]
                    state = task["state"]
                    if state == STATE_DOWNLOADING:
                        line = axel_process.stdout.readline().strip()
                        log.debug(line)
                        try:
                            if line.startswith(":"):
                                done, total, thdone, speed, left, update_time = line[1:].split("|")
                                db.update_tasks(tid, done=int(done), total=int(total), thdone=thdone, speed=int(float((speed))), left=int(float(left)))
                                if done == total:
                                    #completed
                                    db.update_tasks(tid, state=STATE_COMPLETED)
                                    os.system("mkdir -p %s" % os.path.join(DOWNLOADS, subdir))
                                    os.rename(output_file, os.path.join(DOWNLOADS, subdir, output))
                                    break
                                this_update_time = time.time()
                                if this_update_time - last_update_time < 1:
                                    last_update_time = this_update_time
                                    continue
                                else:
                                    db.update_tasks(tid, speed=speed)
                                    last_update_time = this_update_time
                                continue
                            elif line.startswith("HTTP/1."):
                                db.update_tasks(tid, state=STATE_ERROR, errmsg=line)
                                break
                        except Exception, e:
                            import traceback
                            traceback.print_exc()
                            db.update_tasks(tid, state=STATE_ERROR, errmsg="Error, axel exit with code: %s" % e)
                            try:
                                axel_process.terminate()
                            except:
                                pass
                            return
                    else:
                        #paused
                        axel_process.terminate()
                        try:
                            os.remove(output_file)
                        except:
                            pass
                        try:
                            os.remove(output_file + ".st")
                        except:
                            pass
                        return
                else:
                    #deleted
                    axel_process.terminate()
                    try:
                        os.remove(output_file)
                    except:
                        pass
                    try:
                        os.remove(output_file + ".st")
                    except:
                        pass
                    return
                axel_process.poll()
                returncode = axel_process.returncode
                if returncode is not None:
                    # axel completed
                    if returncode:
                        db.update_tasks(tid, state=STATE_ERROR, errmsg="Error, axel exit with code: %s" % returncode)
    def tasks(self, options):
        return db.select_tasks(**options)

    def pause(self, ids):
        db.update_tasks(ids, **{'state': 3})

    def remove(self, ids):
        db.delete_tasks(ids)

    def sort(self, ids):
        orders = []
        for order in range(len(ids)):
            db.update_tasks(ids[order], **{'order':order}) 

    def maxspeed(self, tid):
        return 0
        with open('conf', 'rb') as configfile:
            content = configfile.read()
            conf = json.loads(content)
            if not conf.has_key('total_maxspeed'):
                return 0
            total_max = conf['total_maxspeed']
            if not total_max:
                return 0
            tasks = db.select_tasks(state="!=5")
            total_speed = 0
            for task in tasks:
                if task['id'] == tid:
                    continue
                speed = task['speed']
                if speed:
                    total_speed += task['speed']
            if total_speed > total_max:
                return 1
            else:
                return total_max - total_speed
    
    def config(self, conf):
        try:
            dict_conf = json.loads(conf)
            conf = json.dumps()
        except:
            raise APIError(ERROR_REQUEST_DATA_INVALID)
        with open('conf', 'wb') as configfile:
            configfile.write(conf)

