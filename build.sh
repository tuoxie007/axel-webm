#!/bin/bash

rm -rf build
mkdir build
cd build
echo 'unarcive the axel src tarball'
tar xf ../axel-2.4.tar.bz2
axel=axel-2.4
patch=../axel-patch
diff $axel/text.c $patch/text.c > $patch/text.c.patch
diff $axel/axel.c $patch/axel.c > $patch/axel.c.patch
diff $axel/conf.c $patch/conf.c > $patch/conf.c.patch
diff $axel/conf.h $patch/conf.h > $patch/conf.h.patch
diff $axel/Makefile $patch/Makefile > $patch/Makefile.patch
patch $axel/text.c $patch/text.c.patch
patch $axel/axel.c $patch/axel.c.patch
patch $axel/conf.c $patch/conf.c.patch
patch $axel/conf.h $patch/conf.h.patch
patch $axel/Makefile $patch/Makefile.patch
cp $patch/httppost.c $patch/httppost.h $axel/
cd $axel/
export CFLAGS='-w'
./configure --debug=0 --i18n=0
make
cp axel ../../
