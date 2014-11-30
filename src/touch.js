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

function TouchHandler(element, viewer, cam) {
  this._element = element;
  this._element.addEventListener('touchmove', bind(this, this._touchMove));
  this._element.addEventListener('touchstart', bind(this, this._touchStart));
  this._element.addEventListener('touchend', bind(this, this._touchEnd));
  this._touchState = {
    scale : 1.0,
    rotation : 0.0,
    center : null,
  };
  this._viewer = viewer;
  this._cam = cam;
}

TouchHandler.prototype._touchMove = function(event) {
  var newCenter = getCenter(event.targetTouches);
  var deltaCenter = { 
      x : newCenter.x - this._touchState.center.x,
      y : newCenter.y - this._touchState.center.y 
  };
  // only handle pinch/pan we one target touch in a previous frame. 
  // Otherwise the calculation of the center might be off which leads
  // to visible jumps.
  if (event.targetTouches.length === 2 && 
      this._touchState.numTouches === 2) { 
    var deltaScale = (this._touchState.scale - event.scale) * 2.0;
    if (deltaScale !== 0) {
      this._cam.zoom(deltaScale);
    }
    var deltaZRotation = 
      Math.PI * (this._touchState.rotation - event.rotation) / 180.0;
    this._cam.panXY(deltaCenter.x * 0.05, deltaCenter.y * 0.05);
    this._cam.rotateZ(deltaZRotation);
    this._viewer.requestRedraw();
  }
  // only handle XZ rotation when we one target touch in a previous frame. 
  // Otherwise the calculation of the center might be off which leads
  // to visible jumps.
  if (event.targetTouches.length === 1 && 
      this._touchState.numTouches === 1) {
    // FIXME: ideally we would rotate the scene around the touch center.
    // This would feel more natural. Now when the touch center is far
    // away from the project center of the viewer, rotation is a little
    // awkward.
    this._cam.rotateX(deltaCenter.y * 0.002);
    this._cam.rotateY(deltaCenter.x * 0.002);
    this._viewer.requestRedraw();
  }
  this._touchState.center = newCenter;
  this._touchState.scale = event.scale;
  this._touchState.rotation = event.rotation;
  this._touchState.numTouches = event.targetTouches.length;
  event.preventDefault();
};

function getCenter(touches) {
  var centerX = 0, centerY = 0;
  for (var i = 0; i < touches.length; ++i) {
    centerX += touches[i].clientX;
    centerY += touches[i].clientY;
  }
  centerX /= touches.length;
  centerY /= touches.length;
  console.log(touches.length, centerX, centerY);
  return { x : centerX, y : centerY };
}

TouchHandler.prototype._touchStart = function(event) {
  console.log(event);
  event.preventDefault();
  this._touchState.scale = event.scale;
  this._touchState.rotation = event.rotation;
  this._touchState.center = getCenter(event.targetTouches);
  this._touchState.numTouches = event.targetTouches.length;
};

TouchHandler.prototype._touchEnd = function(event) {
  event.preventDefault();
};

exports.TouchHandler = TouchHandler;
})(this);
