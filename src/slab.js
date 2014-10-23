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
  var center = cam.center();
  var radius = null;
  for (var i = 0; i < objects.length; ++i) {
    var obj = objects[i];
    if (!obj.visible()) {
      continue;
    }
    radius = obj.updateSquaredSphereRadius(center, radius);
  }
  if (radius === null) {
    return null;
  }
  radius = Math.sqrt(radius);
  var zoom = cam.zoom();
  var newFar = (radius + zoom) * 1.05;
  var newNear = 0.1;//Math.max(0.1, zoom - radius);
  return new Slab(newNear, newFar);
};

exports.FixedSlab = FixedSlab;
exports.AutoSlab = AutoSlab;
exports.Slab = Slab;

})(this);
