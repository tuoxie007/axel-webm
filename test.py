#!/usr/bin/python

import subprocess, os

INCOMMING = 'incomming'
url = 'http://mirrors.sohu.com/FreeBSD/ISO-IMAGES-amd64/8.2/CHECKSUM.MD5'
output = 'CHECKSUM.MD5'
maxspeed = 100
args = ["./axel", "-a", "-n 1" "-s %s" % maxspeed, url]
axel_process = subprocess.Popen(args, shell=False, stdout=subprocess.PIPE)
#print './axel -a -n 1 -s 100 %s' % url

#print axel_process.communicate()
while 1:
  line = axel_process.stdout.readline()
  print line,
  if not line:
    break

print 'terminated'
