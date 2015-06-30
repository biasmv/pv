#!/bin/bash

function write_bower_json {
  cat <<EOF
  {
    "name": "bio-pv",
    "homepage": "https://github.com/biasmv/pv",
      "authors": [
      "Marco Biasini <mvbiasini@gmail.com>"
    ],
    "description": "WebGL protein viewer",
    "main": "bio-pv.min.js",
    "moduleType": [
      "amd"
    ],
    "keywords": [
      "protein",
      "3d",
      "webgl",
      "biojs"
    ],
    "license": "MIT",
    "ignore": [
      "**/.*",
      "node_modules",
      "pdbs",
      "test",
      "tests"
    ]
  }
EOF
}

write_bower_json > bower.json

set -e
grunt
cp js/bio-pv.dbg.js bio-pv.js
npm run-script build-biojs
echo 'writing mangled output to bio-pv.min.js'
python scripts/mangle-private-identifiers.py js/bio-pv.min.js bio-pv.min.js
