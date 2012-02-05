#!/bin/bash

rm -rf build
mkdir build
cd build
echo 'unarcive the axel src tarball'
tar xf ../axel-2.4.tar.bz2
axel=axel-2.4
patch=../axel-patch
diff $axel/text.c $patch/text.c > $patch/text.c.patch
patch $axel/text.c $patch/text.c.patch
cd $axel/
export CFLAGS='-w'
./configure --debug=0 --i18n=0
make
cp axel ../../
