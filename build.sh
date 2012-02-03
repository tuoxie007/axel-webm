#!/bin/bash

rm -rf build
mkdir build
cd build
echo 'unarcive the axel src tarball'
tar xf ../axel-2.4.tar.bz2
axel=axel-2.4
diff $axel/text.c ../text.c > ../text.c.patch
diff $axel/axel.c ../axel.c > ../axel.c.patch
diff $axel/conf.c ../conf.c > ../conf.c.patch
diff $axel/conf.h ../conf.h > ../conf.h.patch
patch $axel/text.c ../text.c.patch
patch $axel/axel.c ../axel.c.patch
patch $axel/conf.c ../conf.c.patch
patch $axel/conf.h ../conf.h.patch
cd $axel/
export CFLAGS='-w'
./configure --debug=0 --i18n=0
make
cp axel ../../
