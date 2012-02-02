#!/bin/bash

rm -rf build
mkdir build
cd build
echo 'unarcive the axel src tarball'
tar xf ../axel.tar.bz2
diff axel/text.c ../text.c > ../text.c.patch
diff axel/axel.c ../axel.c > ../axel.c.patch
patch axel/text.c ../text.c.patch
patch axel/axel.c ../axel.c.patch
cd axel/
./configure --debug=0 --i18n=0
make
cp axel ../../
