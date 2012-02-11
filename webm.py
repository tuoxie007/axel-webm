#!/usr/bin/env python
# -*- coding: utf-8 -*-

import web, logging as log, pprint, json, db
from api import *
import traceback

f=pprint.pformat

files = {}

class Router(object):
    def POST(self, uri):
        if uri == 'api':
            try:
                print web.data()
                json_data = json.loads(web.data())
            except Exception, e:
                traceback.print_exc()
                raise web.badrequest()
            
            try:
                return API().serve(json_data)
            except Exception, e:
                traceback.print_exc()
                raise web.internalerror(e.message)
        else:
            raise web.notfound()
    
    def GET(self, uri):
        dirs = uri.split('/')
        if dirs[0] == '':
            filename = 'index.html'
        elif dirs[0] in ['js', 'css', 'img', 'favicon.ico']:
            filename = uri
        else:
            raise web.notfound()
        
        try:
            with open(filename) as staticfile:
                filecontent = staticfile.read()
                files[filename] = filecontent
                return filecontent
        except IOError, e:
            if e.errno == 2:
                raise web.notfound()
        return
        if files.has_key(filename):
            return files[filename]
        else:
            try:
                with open(filename) as staticfile:
                    filecontent = staticfile.read()
                    files[filename] = filecontent
                    return filecontent
            except IOError, e:
                if e.errno == 2:
                    raise web.notfound()

urls = (
    "/(.*)", Router
)

app = web.application(urls, globals())

log.basicConfig(level=log.DEBUG, filename='/tmp/log2')
if __name__ == "__main__":
    try:
      db.select_tasks(id=1)
    except:
      db.reset_database()
    API().download_more()
    app.run()
    
