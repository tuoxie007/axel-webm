#!/usr/bin/env python

import os, web, sys, logging
import db

web.config.debug = False

urls = (
    '/', Home,
    '/webm
 )

app = web.application(urls, globals())

if __name__ == '__main__':
  app.run()
