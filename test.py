#!/usr/bin/python

import subprocess, os

force_download = True

INCOMMING = 'incomming'
url = 'http://mirrors.sohu.com/ubuntu/project/ubuntu-archive-keyring.gpg'
output = 'ubuntu-archive-keyring.gpg'
maxspeed = 1000

output_file = os.path.join(INCOMMING, output)
if os.path.exists(output_file) and not os.path.exists(output_file + '.st'):
  if force_download:
    os.remove(output_file)
  else:
    print 'file completed already, skip download'
    exit()

args = ["../axel", "-a", "-n", "1", "-s", str(maxspeed), "-o", output, "-H", "User-Agent: Axel", url]
axel_process = subprocess.Popen(args, shell=False, stdout=subprocess.PIPE, cwd=INCOMMING)

#print axel_process.communicate()
while 1:
  line = axel_process.stdout.readline()
  print line,
  if not line:
    print 'None'
    break

print axel_process.returncode

print 'terminated'
