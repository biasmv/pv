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

function PoolAllocator(bufferType) {
  this._freeArrays = [];
  this._bufferType = bufferType;
}

PoolAllocator.prototype.request = function(requestedLength) {
  var bestIndex = -1;
  var bestLength = null;
  for (var i = 0; i < this._freeArrays.length; ++i) {
    var free = this._freeArrays[i];
    var length = free.length;
    if (length >= requestedLength && 
        (bestLength === null || length < bestLength)) {
      bestLength = length;
      bestIndex = i;
    }
  }
  if (bestIndex !== -1) {
    var result = this._freeArrays[bestIndex];
    this._freeArrays.splice(bestIndex, 1);
    return result;
  }
  return new this._bufferType(requestedLength);

};

PoolAllocator.prototype.release = function(buffer) {
  this._freeArrays.push(buffer);
};

return PoolAllocator;
});
