#!/bin/bash

grunt
RELEASE_VERSION=`git tag | tail -n 1`
DIR="pv-$RELEASE_VERSION"
echo $DIR
rm -rf $DIR
mkdir $DIR
cp js/pv.js $DIR/pv-$RELEASE_VERSION.js
cp js/pv.min.js $DIR/pv-$RELEASE_VERSION.min.js
cp LICENSE.txt $DIR
rm -rf $DIR.zip
zip -r $DIR.zip $DIR
