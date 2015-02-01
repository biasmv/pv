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

function FrameBuffer(gl, options) {
  this._width = options.width;
  this._height = options.height;
  this._colorBufferWidth = this._width;
  this._colorBufferHeight = this._height;
  this._gl = gl;
  this._colorHandle = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, this._colorHandle);
  this._depthHandle = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthHandle);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                               this._width, this._height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
                             gl.DEPTH_ATTACHMENT,
                             gl.RENDERBUFFER, this._depthHandle);
  this._colorTexture = gl.createTexture();
  this._initColorBuffer();
}

FrameBuffer.prototype = {
  width : function() { return this._width; },
  height : function() { return this._height; },

  bind : function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._colorHandle);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthHandle);
    if (this._colorBufferWidth !== this._width ||
        this._colorBufferHeight !== this._height) {
      this._resizeBuffers();
    }
    gl.viewport(0, 0, this._width, this._height);
  },

  colorTexture : function() {
    return this._colorTexture;
  },

  _initColorBuffer : function() {
    this.bind();
    var gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width, this._height, 0, 
                  gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                  gl.TEXTURE_2D, this._colorTexture, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.release();
  },

  _resizeBuffers : function() {
    var gl = this._gl;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthHandle);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                                this._width, this._height);
    gl.bindTexture(gl.TEXTURE_2D, this._colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width,
                        this._height, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                        null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                  gl.TEXTURE_2D, this._colorTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
                                      gl.DEPTH_ATTACHMENT,
                                      gl.RENDERBUFFER, this._depthHandle);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this._colorBufferWidth = this._width;
    this._colorBufferHeight = this._height;
  },

  resize : function(width, height) {
    this._width = width;
    this._height = height;
  },
  release : function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }
};

return FrameBuffer;

});

