#!/bin/bash
set -e
grunt
env
cp js/bio-pv.dbg.js pv.js
python scripts/mangle-private-identifiers.py js/bio-pv.min.js bio-pv.min.js
