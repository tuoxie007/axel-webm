import logging as log
import os, shutil, subprocess, time, urlparse
import db

DEFAULT_THREAD_SIZE=5
INCOMMING="incomming"
DOWNLOAD="download"

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
            elif action == 'sort':
                ids = data["ids"]
                ret = self.sort(ids)
            else:
                raise APIError(APIError.ERROR_REQUEST_DATA_INVALID)
            
            if ret is None:
                return dict(success=True)
            return dict(success=True, result=ret)
        except KeyError:
            import traceback; traceback.print_exc()
            raise APIError(APIError.ERROR_REQUEST_DATA_INVALID)
        except APIError, e:
            return dict(success=False, errno=e.errno, errmsg=e.message)
        except Exception, e:
            # TODO log error
            import traceback; traceback.print_exc()
            return dict(success=False, errno=0, errmsg="unkown error, please check out the log")

    def create(self, options):
        url = options["url"]
        output = options["output"] if options.has_key("output") else \
            os.path.basename(urlparse.urlparse(url)[2])
        state = 1 if options.has_key("immediately") and options["immediately"] else 3
        thsize = options["thsize"] if options.has_key("thsize") else DEFAULT_THREAD_SIZE
        maxspeed = options["maxspeed"] if options.has_key("maxspeed") else 0
        headers = options["headers"] if options.has_key("headers") else ""

        tid = db.insert_task(url=url, output=output, state=state, thsize=thsize, maxspeed=maxspeed, headers=headers)

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

          args = ["../axel", "-a", "-n %s" % thsize, "-s %s" % maxspeed, url, "--output=%s" % output]
          for header in headers.splitlines():
              args.append("--header='%s'" % header)
          axel_process = subprocess.Popen(args, shell=False, stdout=subprocess.PIPE, cwd=INCOMMING)

          last_update_time = 0
          while 1:
              tasks = db.select_tasks(id=tid)
              if tasks:
                  task = tasks[0]
                  state = task["state"]
                  if state == STATE_DOWNLOADING:
                      axel_process.stdout.settimeout(1)
                      try:
                          line = axel_process.stdout.readline().strip()
                          if line.startswith(":"):
# compute time interval
                              done, total, thdone, speed, left, update_time = line[1:].split("|")
                              db.update_tasks(tid, done=int(done), total=int(total), thdone=thdone, speed=int(speed), left=int(left))
                              this_update_time = time.time()
                              if this_update_time - last_update_time < 1:
                                  last_update_time = this_update_time
                                  continue
                              else:
                                  last_update_time = this_update_time
                              if done == total:
                                  db.update_tasks(tid, state=STATE_COMPLETED)
                                  break
                              continue
                          elif line.startswith("HTTP/1."):
                              db.update_tasks(tid, state=STATE_ERROR, errmsg=line)
                              break
                      except IOError: # TODO timeout
                          speed = task['speed'] / 2
                          left = task['left'] * 2 + 1
                          db.update_tasks(tid, speed=int(speed), left=int(left))
                          continue
                      except:
                          continue
                      axel_process.poll()
                      returncode = process.returncode
                      if returncode is not None:
                          # axel completed
                          if returncode:
                              db.update_tasks(tid, state=STATE_ERROR, errmsg="Error, axel exit with code: %s" % returncode)
                          break
                  break
              axel_process.terminate()
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
