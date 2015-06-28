#!/bin/bash
set -e
grunt
cp js/bio-pv.dbg.js bio-pv.js
echo 'writing mangled output to bio-pv.min.js'
python scripts/mangle-private-identifiers.py js/bio-pv.min.js bio-pv.min.js
