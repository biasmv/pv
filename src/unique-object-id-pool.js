// Copyright (c) 2013-2015 Marco Biasini
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

define(function() {

"use strict";

// A continous range of object identifiers.
function ContinuousIdRange(pool, start, end) {
  this._pool = pool;
  this._start = start;
  this._next = start;
  this._end = end;
}

ContinuousIdRange.prototype = {
  nextId : function(obj) {
    var id = this._next;
    console.assert(this._next < this._end);
    this._next++;
    this._pool._objects[id] = obj;
    return id;
  },
  hasLeft : function() {
    return this._next < this._end;
  },
  recycle : function() {
    this._pool.recycle(this);
  },
  length : function() {
    return this._end - this._start;
  }
};

// simple class that generates unique object identifiers. Identifiers are 
// requested in sequential groups. 
// FIXME: describe why!
function UniqueObjectIdPool() {
  this.clear();
}

UniqueObjectIdPool.prototype = {
  MAX_ID : 16777216, // 2^24
  getContinuousRange : function(num) {
    // FIXME: keep the "free" list sorted, so we can binary search it
    // for a good match
    var bestIndex = -1;
    var bestLength = null;
    for (var i = 0; i < this._free.length; ++i) {
      var free = this._free[i];
      var length = free.length();
      if (length >= num && (bestLength === null || length < bestLength)) {
        bestLength = length;
        bestIndex = i;
      }
    }
    if (bestIndex !== -1) {
      var result = this._free[bestIndex];
      this._free.splice(bestIndex, 1);
      this._usedCount ++;
      return result;
    }
    var start = this._unusedRangeStart;
    var end = start + num;
    if (end > this.MAX_ID) {
      console.error('not enough free object ids.');
      return null;
    }
    this._unusedRangeStart = end;
    var newRange = new ContinuousIdRange(this, start, end);
    this._usedCount ++;
    return newRange;
  },
  clear : function() {
    this._objects = {};
    this._unusedRangeStart = 1;
    this._free = [];
    this._usedCount = 0;
  },
  recycle : function(range) {
    for (var i = range._start; i < range._next; ++i) {
      delete this._objects[i];
    }
    range._next = range._start;
    this._free.push(range);
    this._usedCount--;
    console.assert(this._usedCount >= 0);
    if (this._free.length > 0 && this._usedCount === 0) {
      this.clear();
    }
  },
  objectForId : function(id) {
    return this._objects[id];
  }
};

return UniqueObjectIdPool;

});
