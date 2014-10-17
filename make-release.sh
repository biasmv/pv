#!/bin/bash

set -e
grunt
RELEASE_VERSION=`git tag | tail -n 1`
DIR="pv-$RELEASE_VERSION"
echo $DIR
rm -rf $DIR
mkdir $DIR
cp js/pv.dbg.js $DIR/pv-$RELEASE_VERSION.dbg.js
cp js/pv.rel.js $DIR/pv-$RELEASE_VERSION.rel.js
cp js/pv.min.js $DIR/pv-$RELEASE_VERSION.min.js
cp LICENSE.txt $DIR
rm -rf $DIR.zip
zip -r $DIR.zip $DIR
