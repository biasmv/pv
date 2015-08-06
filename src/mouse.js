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

define([
  './gl-matrix', 
  './utils', 
  ], 
  function(
    glMatrix, 
    utils) {

"use strict";

function MouseHandler(canvas, viewer, cam, animationTime) {
  this._viewer = viewer;
  this._canvas = canvas;
  this._cam = cam;
  this._canvas = canvas;
  this._animationTime = animationTime;
  this._lastMouseUpTime = null;
  this._init();
}

MouseHandler.prototype = {

  _centerOnClicked : function(picked) {
    if (picked === null) {
      return;
    }
    this._viewer.setCenter(picked.pos(), this._animationTime);
  },

  _mouseUp : function(event) {
    var canvas = this._canvas;
    var currentTime = (new Date()).getTime();
    if ((this._lastMouseUpTime === null ||
        currentTime - this._lastMouseUpTime > 300) &
        (currentTime - this._lastMouseDownTime < 300)) {
      var rect = this._canvas.domElement().getBoundingClientRect();
      var picked = this._viewer.pick(
          { x : event.clientX - rect.left, y : event.clientY - rect.top });
      this._viewer._dispatchEvent(event, 'click', picked);
    }
    this._lastMouseUpTime = currentTime;
    canvas.removeEventListener('mousemove', this._mouseRotateListener);
    canvas.removeEventListener('mousemove', this._mousePanListener);
    canvas.removeEventListener('mouseup', this._mouseUpListener);
    document.removeEventListener('mouseup', this._mouseUpListener);
    document.removeEventListener('mousemove', this._mouseRotateListener);
    document.removeEventListener('mousemove', this._mousePanListener);
  },

  setCam : function(cam) {
    this._cam = cam;
  },

  _init : function() {
    this._mousePanListener = utils.bind(this, this._mousePan);
    this._mouseRotateListener = utils.bind(this, this._mouseRotate);
    this._mouseUpListener = utils.bind(this, this._mouseUp);

    // Firefox responds to the wheel event, whereas other browsers listen to
    // the mousewheel event. Register different event handlers, depending on
    // what properties are available.
    this._canvas.onWheel(utils.bind(this, this._mouseWheelFF), 
                         utils.bind(this, this._mouseWheel));
    this._canvas.on('dblclick', utils.bind(this, this._mouseDoubleClick));
    this._canvas.on('mousedown', utils.bind(this, this._mouseDown));
    return true;
  },

  _mouseWheel : function(event) {
    this._cam.zoom(event.wheelDelta < 0 ? -1 : 1);
    event.preventDefault();
    this._viewer.requestRedraw();
  },

  _mouseWheelFF : function(event) {
    this._cam.zoom(event.deltaY < 0 ? 1 : -1);
    event.preventDefault();
    this._viewer.requestRedraw();
  },

  _mouseDoubleClick : (function() {
    return function(event) {
      var rect = this._canvas.domElement().getBoundingClientRect();
      var picked = this._viewer.pick(
          { x : event.clientX - rect.left, y : event.clientY - rect.top });
      this._viewer._dispatchEvent(event, 'doubleClick', picked);
      this._viewer.requestRedraw();
    };
  })(),

  _mouseDown : function(event) {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }
    this._lastMouseDownTime = (new Date()).getTime();
    event.preventDefault();
    if (event.shiftKey === true || event.button === 1) {
      this._canvas.on('mousemove', this._mousePanListener);
      document.addEventListener('mousemove', this._mousePanListener, false);
    } else {
      this._canvas.on('mousemove', this._mouseRotateListener);
      document.addEventListener('mousemove', this._mouseRotateListener, false);
    }
    this._canvas.on('mouseup', this._mouseUpListener);
    document.addEventListener('mouseup', this._mouseUpListener, false);
    this._lastMousePos = { x : event.pageX, y : event.pageY };
  },

  _mouseRotate : function(event) {
    var newMousePos = { x : event.pageX, y : event.pageY };
    var delta = {
      x : newMousePos.x - this._lastMousePos.x,
      y : newMousePos.y - this._lastMousePos.y
    };

    var speed = 0.005;
    this._cam.rotateX(speed * delta.y);
    this._cam.rotateY(speed * delta.x);
    this._lastMousePos = newMousePos;
    this._viewer.requestRedraw();
  },

  _mousePan : function(event) {
    var newMousePos = { x : event.pageX, y : event.pageY };
    var delta = {
      x : newMousePos.x - this._lastMousePos.x,
      y : newMousePos.y - this._lastMousePos.y
    };

    // adjust speed according to distance to camera center, it's not
    // perfect but gives good enough results.
    var speed = 
      0.002 * Math.tan(0.5 * this._cam.fieldOfViewY()) * this._cam.zoom();
    this._cam.panXY(speed * delta.x,
                    speed * delta.y);
    this._lastMousePos = newMousePos;
    this._viewer.requestRedraw();
  }

};

return MouseHandler;

});
