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

var exports = {};
exports.derive = function(subclass, baseclass, extensions) {
  // jshint forin:false
  for (var prop in baseclass.prototype) {
    subclass.prototype[prop] = baseclass.prototype[prop];
  }
  if (extensions === undefined) {
    return;
  }
  for (var ext in extensions) {
    subclass.prototype[ext] = extensions[ext];
  }
};


exports.bind = function (obj, fn) {
    return function() {
      return fn.apply(obj, arguments);
  };
};

exports.update = function(dst, src) {
  src = src || {};
  for (var prop in src) {
    if (src.hasOwnProperty(prop)) {
      dst[prop] = src[prop];
    }
  }
  return dst;
};

exports.copy = function(src) {
  var cloned = {};
  exports.update(cloned, src);
  return cloned;
};

function defaultComp(lhs, rhs) {
  return lhs < rhs;
}

// returns the index into the values array for the first value identical to
// *value*.
exports.binarySearch = function(values, value, comp) {
  if (values.length === 0) {
    return -1;
  }
  comp = comp || defaultComp;
  var low = 0, high = values.length;
  var mid  = (low + high) >> 1;
  while (true) {
    var midValue = values[mid];
    if (comp(value, midValue)) {
      high = mid;
    } else if (comp(midValue, value)) {
      low = mid;
    } else {
      return mid;
    }
    var newMid  = (low + high) >> 1;
    if (newMid === mid) {
      return -1;
    }
    mid = newMid;
  }
  return -1;
};

// returns the index of the first item in the list whose value is 
// larger or equal than *value*.
exports.indexFirstLargerEqualThan = function(values, value, comp) {
  comp = comp || defaultComp;
  if (values.length === 0 || comp(values[values.length - 1], value)) {
    return -1;
  }
  var low = 0, high = values.length;
  var mid = (low + high) >> 1;
  while (true) {
    var midValue = values[mid];
    if (comp(value, midValue)) {
      // there might be other values larger than value with an index
      // lower than mid.
      high = mid;
    } else if (comp(midValue, value)) {
      low = mid + 1;
    } else {
      high = mid;
    }
    var newMid  = (low + high) >> 1;
    if (newMid === mid) {
      return mid;
    }
    mid = newMid;
  }
};

exports.indexLastSmallerThan = function(values, value, comp) {
  comp = comp || defaultComp;
  if (values.length === 0 || comp(values[values.length-1], value)) {
    return values.length-1;
  }
  if (comp(value, values[0]) || !comp(values[0], value)) {
    return -1;
  }
  var low = 0, high = values.length;
  var mid = (low + high) >> 1;
  while (true) {
    var midValue = values[mid];
    if (comp(value, midValue) || !comp(midValue, value)) {
      high = mid;
    } else {
      low = mid;
    }
    var newMid  = (low + high) >> 1;
    if (newMid === mid) {
      return mid;
    }
    mid = newMid;
  }
};

exports.indexLastSmallerEqualThan = function(values, value, comp) {
  comp = comp || defaultComp;
  if (values.length === 0 || comp(values[values.length-1], value)) {
    return values.length-1;
  }
  if (comp(value, values[0])) {
    return -1;
  }
  var low = 0, high = values.length;
  var mid = (low + high) >> 1;
  while (true) {
    var midValue = values[mid];
    if (comp(value, midValue)) {
      high = mid;
    } else {
      low = mid;
    }
    var newMid  = (low + high) >> 1;
    if (newMid === mid) {
      return mid;
    }
    mid = newMid;
  }
};

function Range(min, max) {
  if (min === undefined || max === undefined) {
    this._empty = true;
    this._min = this._max = null;
  } else {
    this._empty = false;
    this._min = min;
    this._max = max;
  }
}

Range.prototype = {
  min : function() {
    return this._min;
  },
  max : function() {
    return this._max;
  },
  length : function() {
    return this._max - this._min;
  },
  empty : function() {
    return this._empty;
  },
  center : function() {
    return (this._max + this._min) * 0.5;
  },

  extend : function(amount) {
    this._min -= amount;
    this._max += amount;
  },

  update : function(val) {
    if (!this._empty) {
      if (val < this._min) {
        this._min = val;
      } else if (val > this._max) {
        this._max = val;
      }
      return;
    }
    this._min = this._max = val;
    this._empty = false;
  }
};

exports.Range = Range;

return exports;

});

