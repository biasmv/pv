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

function Slab(near, far) {
  this.near = near;
  this.far = far;
}

function FixedSlab(options) {
  options = options || {};
  this._near = options.near || 0.1;
  this._far = options.far || 400.0;
}

FixedSlab.prototype.update = function() {
  return new Slab(this._near, this._far);
};

function AutoSlab(options) {
  this._far = 100.0;
}

AutoSlab.prototype.update = function(objects, cam) {
  var axes = cam.mainAxes();
  var intervals = [ new Range(), new Range(), new Range() ];
  for (var i = 0; i < objects.length; ++i) {
    var obj = objects[i];
    if (!obj.visible()) {
      continue;
    }
    obj.updateProjectionIntervals(axes[0], axes[1], axes[2], 
                                  intervals[0], intervals[1], 
                                  intervals[2]);
  }
  if (intervals[0].empty() || intervals[1].empty() || intervals[2].empty()) {
    // no object visible, or only objects that do not affect the 
    // slab interval are shown. Just return null in that case.
    return null;
  }
  var projectedCamCenter = vec3.dot(axes[2], cam.center());
  var projectedCamPos = projectedCamCenter + cam.zoom();
  var newFar = Math.max(10, projectedCamPos-intervals[2].min());
  var newNear = Math.max(0.1, projectedCamPos-intervals[2].max());
  return new Slab(newNear, newFar);
};

exports.FixedSlab = FixedSlab;
exports.AutoSlab = AutoSlab;
exports.Slab = Slab;

})(this);
