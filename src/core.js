// Copyright (c) 2013-2014 Marco Biasini
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

(function(exports) {
"use strict";

exports.derive = function(subclass, baseclass) {
  for (var prop in baseclass.prototype) {
    subclass.prototype[prop] = baseclass.prototype[prop];
  }
};

exports.copy = function(src) {
  src = src || {};
  var cloned = {};
  for (var prop in src) {
    if (src.hasOwnProperty(prop)) {
      cloned[prop] = src[prop];
    }
  }
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
  if (values.length === 0 || comp(value, values[0])) {
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
      low = mid;
    } else {
      high = mid+1;
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
  var low = 0, high = values.length;
  var mid = (low + high) >> 1;
  var cnt = 0;
  while (true) {
    var midValue = values[mid];
    if (comp(value, midValue)) {
      high = mid;
    } else {
      low = mid;
    }
    var newMid  = (low + high) >> 1;
    if (newMid === mid) {
      return mid-1;
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
  var cnt = 0;
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

return true;
})(this);
