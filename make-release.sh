#!/bin/bash
set -e
grunt
env
cp js/pv.dbg.js pv.js
python scripts/mangle-private-identifiers.py js/pv.min.js pv.min.js
