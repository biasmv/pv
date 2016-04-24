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
  '../utils', 
  ],
  function(
    utils
  ) {

"use strict";

function isWebGLSupported(gl) {
  if (document.readyState !== "complete" &&
      document.readyState !== "loaded" &&
      document.readyState !== "interactive") {
    console.error('isWebGLSupported only works after DOMContentLoaded');
    return false;
  }
  if (gl === undefined) {
    try {
      var canvas = document.createElement("canvas");
      return !!  (window.WebGLRenderingContext &&
          canvas.getContext("experimental-webgl"));
    } catch(e) {
      return false;
    }
  }
  return !!gl;
}


function Canvas(parentElement, options) {
  this._width = options.width;
  this._antialias = options.antialias;
  this._height = options.height;
  this._resize = false;
  this._lastTimestamp = null;
  this._domElement = parentElement;
  this._initCanvas();
  this._backgroundColor = options.backgroundColor;
  this._forceManualAntialiasing = options.forceManualAntialiasing;
}

Canvas.prototype = {

  _ensureSize : function() {
    if (!this._resize) {
      return;
    }
    this._resize = false;
    var realWidth = this._width * this._samples;
    var realHeight = this._height * this._samples;
    this._realWidth = realWidth;
    this._realHeight = realHeight;
    this._gl.viewport(0, 0, realWidth, realHeight);
    this._canvas.width = realWidth;
    this._canvas.height = realHeight;
    if (this._samples > 1) {
      this._initManualAntialiasing(this._samples);
    }
  },

  // tells the canvas to resize. The resize does not happen immediately but is 
  // delayed until the next redraw. This avoids flickering
  resize : function(width, height) {
    if (width === this._width && height === this._height) {
      return;
    }
    this._resize = true;
    this._width = width;
    this._height = height;
  },

  fitParent : function() {
    var parentRect = this._domElement.getBoundingClientRect();
    this.resize(parentRect.width, parentRect.height);
  },

  gl : function() {
    return this._gl;
  },


  // returns the content of the WebGL context as a data URL element which can be
  // inserted into an img element. This allows users to save a picture to disk
  imageData : function() {
    return this._canvas.toDataURL();
  },

  _initContext : function() {
    try {
      var contextOpts = {
        antialias : this._antialias && !this._forceManualAntialiasing,
        preserveDrawingBuffer : true // for image export
      };
      this._gl = this._canvas.getContext('experimental-webgl', contextOpts);
    }
    catch (err) {
      console.error('WebGL not supported', err);
      return false;
    }
    if (!this._gl) {
      console.error('WebGL not supported');
      return false;
    }
    return true;
  },

  _initManualAntialiasing : function(samples) {
    var scale_factor = 1.0 / samples;
    var trans_x = -(1 - scale_factor) * 0.5 * this._realWidth;
    var trans_y = -(1 - scale_factor) * 0.5 * this._realHeight;
    var translate = 'translate(' + trans_x + 'px, ' + trans_y + 'px)';
    var scale = 'scale(' + scale_factor + ', ' + scale_factor + ')';
    var transform = translate + ' ' + scale;

    this._canvas.style.webkitTransform = transform;
    this._canvas.style.transform = transform;
    this._canvas.style.ieTransform = transform;
    this._canvas.width = this._realWidth;
    this._canvas.height = this._realHeight;
  },

  initGL : function() {
    var samples = 1;
    if (!this._initContext()) {
      return false;
    }

    var gl = this._gl;
    if (!gl.getContextAttributes().antialias && 
        this._forceManualAntialiasing && this._antialias) {
      samples = 2;
    }
    this._realWidth = this._width * samples;
    this._realHeight = this._height * samples;
    this._samples = samples;
    if (samples > 1) {
      this._initManualAntialiasing(samples);
    }
    gl.viewportWidth = this._realWidth;
    gl.viewportHeight = this._realHeight;

    gl.clearColor(this._backgroundColor[0], this._backgroundColor[1], 
                  this._backgroundColor[2], 1.0);
    gl.lineWidth(2.0);
    gl.cullFace(gl.FRONT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    return true;
  },


  _shaderFromString : function(shader_code, type, precision) {
    var shader;
    var gl = this._gl;
    if (type === 'fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type === 'vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      console.error('could not determine type for shader');
      return null;
    }
    
    // replace the precision placeholder in shader source code with appropriate
    // value. See comment on top of shaders.js for details.
    var code = shader_code.replace('${PRECISION}', precision);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(code);
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  },

  initShader : function(vert_shader, frag_shader, precision) {
    var gl = this._gl;
    var fs = this._shaderFromString(frag_shader, 'fragment', precision);
    var vs = this._shaderFromString(vert_shader, 'vertex', precision);
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('could not initialise shaders');
      console.error(gl.getShaderInfoLog(shaderProgram));
      return null;
    }
    // get vertex attribute location for the shader once to
    // avoid repeated calls to getAttribLocation/getUniformLocation
    var getAttribLoc = utils.bind(gl, gl.getAttribLocation);
    var getUniformLoc = utils.bind(gl, gl.getUniformLocation);
    shaderProgram.posAttrib = getAttribLoc(shaderProgram, 'attrPos');
    shaderProgram.colorAttrib = getAttribLoc(shaderProgram, 'attrColor');
    shaderProgram.normalAttrib = getAttribLoc(shaderProgram, 'attrNormal');
    shaderProgram.objIdAttrib = getAttribLoc(shaderProgram, 'attrObjId');
    shaderProgram.selectAttrib = getAttribLoc(shaderProgram, 'attrSelect');
    shaderProgram.symId = getUniformLoc(shaderProgram, 'symId');
    shaderProgram.projection = getUniformLoc(shaderProgram, 'projectionMat');
    shaderProgram.modelview = getUniformLoc(shaderProgram, 'modelviewMat');
    shaderProgram.rotation = getUniformLoc(shaderProgram, 'rotationMat');
    shaderProgram.fog = getUniformLoc(shaderProgram, 'fog');
    shaderProgram.fogFar = getUniformLoc(shaderProgram, 'fogFar');
    shaderProgram.fogNear = getUniformLoc(shaderProgram, 'fogNear');
    shaderProgram.fogColor = getUniformLoc(shaderProgram, 'fogColor');
    shaderProgram.outlineColor = getUniformLoc(shaderProgram, 'outlineColor');
    shaderProgram.outlineWidth = getUniformLoc(shaderProgram, 'outlineWidth');
    shaderProgram.relativePixelSize = getUniformLoc(shaderProgram, 
                                                    'relativePixelSize');
    shaderProgram.screenDoorTransparency = getUniformLoc(shaderProgram, 
                                                    'screenDoorTransparency');
    shaderProgram.selectionColor = getUniformLoc(shaderProgram, 
                                                 'selectionColor');
    shaderProgram.pointSize = getUniformLoc(shaderProgram, 'pointSize');
    shaderProgram.zoom = getUniformLoc(shaderProgram, 'zoom');
    shaderProgram.outlineEnabled = getUniformLoc(shaderProgram, 
                                                 'outlineEnabled');

    return shaderProgram;
  },

  // register event handler on canvas DOM element
  on : function(name, handler) {
    this._canvas.addEventListener(name, handler, false);
  },
  removeEventListener : function(name, listener) {
    this._canvas.removeEventListener(name, listener, false);
  },

  // helper to register different event handler depending on whether we are 
  // running in firefox or any other browser
  onWheel : function(firefoxHandler, handler) {
    if ('onwheel' in this._canvas) {
      this.on('wheel', firefoxHandler);
    } else {
      this.on('mousewheel', handler);
    }
  },
  domElement : function() {
    return this._canvas;
  },

  // bind the canvas as the primary render target and prepare everything for 
  // drawing.
  bind : function() {
    this._ensureSize();
    this._gl.viewport(0, 0, this._realWidth, this._realHeight);
  },

  // the current super sampling factor. At the moment either 1 or 2 is 
  // returned, depending on whether manual antialiasing is enabled or not.
  superSamplingFactor : function() {
    return this._samples;
  },

  viewportWidth : function() {
    return this._realWidth;
  },

  viewportHeight : function() {
    return this._realHeight;
  },

  width : function() {
    return this._width;
  },

  height : function() {
    return this._height;
  },

  _initCanvas : function() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._domElement.appendChild(this._canvas);
  },

  isWebGLSupported : function() {
    return isWebGLSupported(this._gl);
  },

  destroy : function() {
    this._canvas.width = 1;
    this._canvas.height = 1;
    this._canvas.parentElement.removeChild(this._canvas);
    this._canvas = null;
  },
};

return { 
  Canvas : Canvas,
  isWebGLSupported : isWebGLSupported
};

});
