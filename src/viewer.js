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

var pv = (function(){
  "use strict";

  // FIXME: Browser vendors tend to block quite a few graphic cards. Instead
  //   of showing this very generic message, implement a per-browser
  //   diagnostic. For example, when we detect that we are running a recent
  //   Chrome and Webgl is not available, we should say that the user is
  //   supposed to check chrome://gpu for details on why WebGL is not
  //   available. Similar troubleshooting pages are available for other
  //   browsers.
  var WEBGL_NOT_SUPPORTED = '\
<div style="vertical-align:middle; text-align:center;">\
<h1>Oink</h1><p>Your browser does not support WebGL. \
You might want to try Chrome, Firefox, IE 11, or newer versions of Safari\
</p>\
<p>If you are using a recent version of one of the above browsers, your \
graphic card might be blocked. Check the browser documentation for details\
</p>\
</div>';

  function bind(obj, fn) {
    return function() {
      return fn.apply(obj, arguments);
  };
}


var requestAnimFrame = (function(){
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function(callback) {
           window.setTimeout(callback, 1000 / 60);
          };
})();

function slabModeToStrategy(mode, options) {
  mode = mode || 'auto';
  if (mode === 'fixed') {
    return new FixedSlab(options);
  }
  if (mode === 'auto') {
    return new AutoSlab(options);
  }
  return null;
}

function PV(domElement, opts) {
  opts = opts || {};
  this._options = {
    width : (opts.width || 500),
    height : (opts.height || 500),
    animateTime : (opts.animateTime || 0),
    antialias : opts.antialias,
    quality : opts.quality || 'low',
    style : opts.style || 'hemilight',
    background : opts.background ? forceRGB(opts.background) : vec3.fromValues(1,1,1),
    slabMode : slabModeToStrategy(opts.slabMode),
    atomClick: opts.atomClick || null,
    fog : true,
    atomDoubleClick : 'center', // option is handled below
  };
  this._objects = [];
  this._domElement = domElement;
  this._redrawRequested = false;
  this._resize = false;
  this._lastTimestamp = null;
  this.listenerMap = {};
  // NOTE: make sure to only request features supported by all browsers,
  // not only browsers that support WebGL in this constructor. WebGL
  // detection only happens in PV._initGL. Once this happened, we are
  // save to use whatever feature pleases us, e.g. typed arrays, 2D 
  // contexts etc.
  this._canvas = document.createElement('canvas');
  this._textureCanvas = document.createElement('canvas');
  this._textureCanvas.style.display = 'none';
  this._objectIdManager = new UniqueObjectIdPool();
  var parentRect = domElement.getBoundingClientRect();
  if (this._options.width === 'auto') {
    this._options.width = parentRect.width;
  }
  if (this._options.height === 'auto') {
    this._options.height = parentRect.height;
  }
  if ('outline' in opts) {
    this._options.outline = opts.outline;
  } else {
    this._options.outline = true;
  }
  if ('atomDoubleClicked' in opts) {
    this._options.atomDoubleClick = opts.atomDoubleClick;
  }
  if ('fog' in opts) {
    this._options.fog = opts.fog;
  }
  this._ok = false;
  this._camAnim = { 
      center : null, zoom : null, 
      rotation : null 
  };
  this.quality(this._options.quality);
  this._canvas.width = this._options.width;
  this._canvas.height = this._options.height;
  this._domElement.appendChild(this._canvas);
  this._domElement.appendChild(this._textureCanvas);

  if (document.readyState === "complete" ||  
    document.readyState === "loaded" ||  
      document.readyState === "interactive") {
    this._initPV();
  } else {
    document.addEventListener('DOMContentLoaded', bind(this, this._initPV));
  }
  if (this._options.atomDoubleClick !== null) {
    this.addListener('atomDoubleClicked', this._options.atomDoubleClick);
  }
  if (this._options.atomClick !== null) {
    this.addListener('atomClicked', this._options.atomClick);
  }
}

PV.prototype._centerOnClicked = function(picked, originalEvent) {
  if (picked === null) {
    return;
  }
  var transformedPos = vec3.create();
  var newAtom = picked.object().atom;
  var pos = newAtom.pos();
  if (picked.transform()) {
    vec3.transformMat4(transformedPos, pos, picked.transform());
    this.setCenter(transformedPos, this._options.animateTime);
  } else {
    this.setCenter(pos, this._options.animateTime);
  }
};
  

// resizes the canvas, separated out from PV.resize because we want
// to call this function directly in a requestAnimationFrame together
// with rendering to avoid flickering.
PV.prototype._ensureSize = function() {
  if (!this._resize) {
    return;
  }
  this._resize = false;
  this._options.realWidth = this._options.width * this._options.samples;
  this._options.realHeight = this._options.height * this._options.samples;
  this._gl.viewport(0, 0, this._options.realWidth, this._options._realHeight);
  this._canvas.width = this._options.realWidth;
  this._canvas.height = this._options.realHeight;
  this._cam.setViewportSize(this._options.realWidth, this._options.realHeight);
  if (this._options.samples > 1) {
    this._initManualAntialiasing(this._options.samples);
  }
  this._pickBuffer.resize(this._options.width, this._options.height);
};

PV.prototype.resize = function(width, height) {
  if (width === this._options.width && height === this._options.height) {
    return;
  }
  this._resize = true;
  this._options.width = width;
  this._options.height = height;
  this.requestRedraw();
};

PV.prototype.fitParent = function() {
  var parentRect = this._domElement.getBoundingClientRect();
  this.resize(parentRect.width, parentRect.height);
};

PV.prototype.gl = function() {
  return this._gl;
};

PV.prototype.ok = function() {
  return this._ok;
};

PV.prototype.options = function(optName, value) {
  if (value !== undefined) {
    if (optName === 'fog') {
      this._cam.fog(value);
      this._options.fog = value;
      this.requestRedraw();
    } else {
      this._options[optName] = value;
    }
    return value;
  }
  return this._options[optName];
};

PV.prototype.quality = function(qual) {
  this._options.quality = qual;
  if (qual === 'high') {
    this._options.arcDetail = 4;
    this._options.sphereDetail = 16;
    this._options.splineDetail = 8;
    return;
  }
  if (qual === 'medium') {
    this._options.arcDetail = 3;
    this._options.sphereDetail = 10;
    this._options.splineDetail = 4;
    return;
  }
  if (qual === 'low') {
    this._options.arcDetail = 2;
    this._options.sphereDetail = 8;
    this._options.splineDetail = 2;
    return;
  }
  console.error('invalid quality argument', qual);
};

// returns the content of the WebGL context as a data URL element which can be
// inserted into an img element. This allows users to save a picture to disk
PV.prototype.imageData = function() {
  return this._canvas.toDataURL();
};

PV.prototype._initContext = function() {
  try {
    var contextOpts = {
      antialias : this._options.antialias,
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
};

PV.prototype._initManualAntialiasing = function(samples) {
  var scale_factor = 1.0 / samples;
  var trans_x = -(1 - scale_factor) * 0.5 * this._options.realWidth;
  var trans_y = -(1 - scale_factor) * 0.5 * this._options.realHeight;
  var translate = 'translate(' + trans_x + 'px, ' + trans_y + 'px)';
  var scale = 'scale(' + scale_factor + ', ' + scale_factor + ')';
  var transform = translate + ' ' + scale;

  this._canvas.style.webkitTransform = transform;
  this._canvas.style.transform = transform;
  this._canvas.style.ieTransform = transform;
  this._canvas.width = this._options.realWidth;
  this._canvas.height = this._options.realHeight;
};

PV.prototype._initPickBuffer = function() {
  var fbOptions = {
    width : this._options.width, height : this._options.height
  };
  this._pickBuffer = new FrameBuffer(this._gl, fbOptions);
};

PV.prototype._initGL = function() {
  var samples = 1;
  if (!this._initContext()) {
    return false;
  }

  if (!this._gl.getContextAttributes().antialias && this._options.antialias) {
    samples = 2;
  }
  this._options.realWidth = this._options.width * samples;
  this._options.realHeight = this._options.height * samples;
  this._options.samples = samples;
  if (samples > 1) {
    this._initManualAntialiasing(samples);
  }
  this._gl.viewportWidth = this._options.realWidth;
  this._gl.viewportHeight = this._options.realHeight;

  this._gl.clearColor(this._options.background[0], this._options.background[1], this._options.background[2], 1.0);
  this._gl.lineWidth(2.0);
  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  this._gl.enable(this._gl.DEPTH_TEST);
  this._initPickBuffer();
  return true;
};

PV.prototype._shaderFromString = function(shader_code, type) {
  var shader;
  if (type === 'fragment') {
    shader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
  } else if (type === 'vertex') {
    shader = this._gl.createShader(this._gl.VERTEX_SHADER);
  } else {
    console.error('could not determine type for shader');
    return null;
  }
  this._gl.shaderSource(shader, shader_code);
  this._gl.compileShader(shader);
  if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
    console.error(this._gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};

PV.prototype._initShader = function(vert_shader, frag_shader) {
  var fs = this._shaderFromString(frag_shader, 'fragment');
  var vs = this._shaderFromString(vert_shader, 'vertex');
  var shaderProgram = this._gl.createProgram();
  this._gl.attachShader(shaderProgram, vs);
  this._gl.attachShader(shaderProgram, fs);
  this._gl.linkProgram(shaderProgram);
  if (!this._gl.getProgramParameter(shaderProgram, this._gl.LINK_STATUS)) {
    console.error('could not initialise shaders');
    console.error(this._gl.getShaderInfoLog(shaderProgram));
    return null;
  }
  this._gl.clearColor(this._options.background[0], this._options.background[1], this._options.background[2], 1.0);
  this._gl.enable(this._gl.BLEND);
  this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
  this._gl.enable(this._gl.CULL_FACE);
  this._gl.enable(this._gl.DEPTH_TEST);

  // get vertex attribute location for the shader once to
  // avoid repeated calls to getAttribLocation/getUniformLocation
  var getAttribLoc = bind(this._gl, this._gl.getAttribLocation);
  var getUniformLoc = bind(this._gl, this._gl.getUniformLocation);
  shaderProgram.posAttrib = getAttribLoc(shaderProgram, 'attrPos');
  shaderProgram.colorAttrib = getAttribLoc(shaderProgram, 'attrColor');
  shaderProgram.normalAttrib = getAttribLoc(shaderProgram, 'attrNormal');
  shaderProgram.objIdAttrib = getAttribLoc(shaderProgram, 'attrObjId');
  shaderProgram.symId = getUniformLoc(shaderProgram, 'symId');
  shaderProgram.projection = getUniformLoc(shaderProgram, 'projectionMat');
  shaderProgram.modelview = getUniformLoc(shaderProgram, 'modelviewMat');
  shaderProgram.rotation = getUniformLoc(shaderProgram, 'rotationMat');
  shaderProgram.fog = getUniformLoc(shaderProgram, 'fog');
  shaderProgram.fogFar = getUniformLoc(shaderProgram, 'fogFar');
  shaderProgram.fogNear = getUniformLoc(shaderProgram, 'fogNear');
  shaderProgram.fogColor = getUniformLoc(shaderProgram, 'fogColor');
  shaderProgram.outlineColor = getUniformLoc(shaderProgram, 'outlineColor');

  return shaderProgram;
};

PV.prototype._mouseUp = function(event) {
  this._canvas.removeEventListener('mousemove', this._mouseRotateListener, false);
  this._canvas.removeEventListener('mousemove', this._mousePanListener, false);
  this._canvas.removeEventListener('mouseup', this._mouseUpListener, false);
  document.removeEventListener('mouseup', this._mouseUpListener, false);
  document.removeEventListener('mousemove', this._mouseRotateListener);
  document.removeEventListener('mousemove', this._mousePanListener);
};

PV.prototype._initPV = function() {
  if (!this._initGL()) {
    this._domElement.removeChild(this._canvas);
    this._domElement.innerHTML = WEBGL_NOT_SUPPORTED;
    this._domElement.style.width = this._options.width + 'px';
    this._domElement.style.height = this._options.height + 'px';
    return false;
  }
  this._ok = true;
  this._2dcontext = this._textureCanvas.getContext('2d');
  this._float32Allocator = new PoolAllocator(Float32Array);
  this._uint16Allocator = new PoolAllocator(Uint16Array);
  this._cam = new Cam(this._gl);
  this._cam.fog(this._options.fog);
  this._shaderCatalog = {
    hemilight : this._initShader(shaders.HEMILIGHT_VS, shaders.HEMILIGHT_FS),
    outline : this._initShader(shaders.OUTLINE_VS, shaders.OUTLINE_FS),
    lines : this._initShader(shaders.HEMILIGHT_VS, shaders.LINES_FS),
    text : this._initShader(shaders.TEXT_VS, shaders.TEXT_FS),
    select : this._initShader(shaders.SELECT_VS, shaders.SELECT_FS)
  };

  this._boundDraw = bind(this, this._draw);

  this._mousePanListener = bind(this, this._mousePan);
  this._mouseRotateListener = bind(this, this._mouseRotate);
  this._mouseUpListener = bind(this, this._mouseUp);

  // Firefox responds to the wheel event, whereas other browsers listen to
  // the mousewheel event. Register different event handlers, depending on
  // what properties are available.
  if ('onwheel' in this._canvas) {
  this._canvas.addEventListener('wheel', bind(this, this._mouseWheelFF),
                              false);
  } else {
  this._canvas.addEventListener('mousewheel', bind(this, this._mouseWheel),
                              false);
  }
  this._canvas.addEventListener('dblclick', bind(this, this._mouseDoubleClick),
                            false);
  this._canvas.addEventListener('mousedown', bind(this, this._mouseDown),
                            false);

  return true;
};

PV.prototype.requestRedraw = function() {
  if (this._redrawRequested) {
    return;
  }
  this._redrawRequested = true;
  requestAnimFrame(this._boundDraw);
};

PV.prototype._drawWithPass = function(pass) {
  for (var i = 0, e = this._objects.length; i !== e; ++i) {
    this._objects[i]
        .draw(this._cam, this._shaderCatalog, this._options.style, pass);
  }
};

PV.prototype.setCamera = function(rotation, center, zoom, ms) {
  
  ms |= 0;
  if (ms === 0) {
    this._cam.setCenter(center);
    this._cam.setRotation(rotation);
    this._cam.setZoom(zoom);
    this.requestRedraw();
    return;
  }
  this._camAnim.center = new Move(this._cam.center(), 
                                  vec3.clone(center), ms);
  this._camAnim.rotation = new Rotate(this._cam.rotation(), 
      mat4.clone(rotation), ms);

  this._camAnim.zoom = new Animation(this._cam.zoom(), 
      zoom, ms);
  this.requestRedraw();
};

// performs interpolation of current camera position
PV.prototype._animateCam = function() {
  var anotherRedraw = false;
  if (this._camAnim.center) {
    this._cam.setCenter(this._camAnim.center.step());
    if (this._camAnim.center.finished()) {
      this._camAnim.center = null;
    }
    anotherRedraw = true;
  }
  if (this._camAnim.rotation) {
    this._cam.setRotation(this._camAnim.rotation.step());
    if (this._camAnim.rotation.finished()) {
      this._camAnim.rotation = null;
    }
    anotherRedraw = true;
  }
  if (this._camAnim.zoom) {
    this._cam.setZoom(this._camAnim.zoom.step());
    if (this._camAnim.zoom.finished()) {
      this._camAnim.zoom = null;
    }
    anotherRedraw = true;
  }
  if (anotherRedraw) {
    this.requestRedraw();
  }
};

PV.prototype._draw = function() {
  this._redrawRequested = false;
  this._ensureSize();
  this._animateCam();
  var newSlab = this._options.slabMode.update(this._objects, this._cam);
  if (newSlab !== null) {
    this._cam.setNearFar(newSlab.near, newSlab.far);
  }

  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  this._gl.viewport(0, 0, this._options.realWidth, this._options.realHeight);
  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  this._gl.enable(this._gl.BLEND);
  this._drawWithPass('normal');
  if (!this._options.outline) {
    return;
  }
  this._gl.cullFace(this._gl.BACK);
  this._gl.enable(this._gl.CULL_FACE);
  this._drawWithPass('outline');
};

PV.prototype.setCenter = function(center, ms) {
  ms |= 0;
  if (ms === 0) {
    this._cam.setCenter(center);
    return;
  }
  this._camAnim.center = new Move(this._cam.center(), 
                                  vec3.clone(center), ms);
  this.requestRedraw();
};

PV.prototype.centerOn = function(what, ms) {
  this.setCenter(what.center(), ms);
};


PV.prototype.clear = function() {
  for (var i = 0; i < this._objects.length; ++i) {
    this._objects[i].destroy();
  }
  this._objects = [];
};

PV.prototype._mouseWheel = function(event) {
  this._cam.zoom(event.wheelDelta < 0 ? -1 : 1);
  event.preventDefault();
  this.requestRedraw();
};

PV.prototype._mouseWheelFF = function(event) {
  this._cam.zoom(event.deltaY < 0 ? 1 : -1);
  event.preventDefault();
  this.requestRedraw();
};

PV.prototype._mouseDoubleClick = (function() {
  return function(event) {
    var rect = this._canvas.getBoundingClientRect();
    var picked = this.pick(
        { x : event.clientX - rect.left, y : event.clientY - rect.top });
    this._dispatchPickedEvent(event, 'atomDoubleClicked', picked);
    this.requestRedraw();
  };
})();


PV.prototype.addListener = function(eventName, callback) {
  var callbacks = this.listenerMap[eventName];
  if (typeof callbacks === 'undefined') {
    callbacks = [];
    this.listenerMap[eventName] = callbacks;
  }
  if (callback === 'center') {
    callbacks.push(bind(this, this._centerOnClicked));
  } else {
    callbacks.push(callback);
  }
};

PV.prototype._dispatchPickedEvent = function(event, newEventName, picked) {
  var callbacks = this.listenerMap[newEventName];
  if (callbacks) {
    
    callbacks.forEach(function (callback) {
      callback(picked, event);
    });
  }
};

PV.prototype._mouseDown = function(event) {
  if (event.button !== 0) {
    return;
  }
  var currentTime = (new Date()).getTime();
  // make sure it isn't a double click
  if (typeof this.lastClickTime === 'undefined' || (currentTime - this.lastClickTime > 300)) {
    this.lastClickTime = currentTime;
    var rect = this._canvas.getBoundingClientRect();
    var picked = this.pick(
        { x : event.clientX - rect.left, y : event.clientY - rect.top });
    this._dispatchPickedEvent(event, 'atomClicked', picked);
  }
  event.preventDefault();
  if (event.shiftKey === true) {
    this._canvas.addEventListener('mousemove', this._mousePanListener, false);
    document.addEventListener('mousemove', this._mousePanListener, false);
  } else {
    this._canvas.addEventListener('mousemove', this._mouseRotateListener,
                                  false);
    document.addEventListener('mousemove', this._mouseRotateListener, false);
  }
  this._canvas.addEventListener('mouseup', this._mouseUpListener, false);
  document.addEventListener('mouseup', this._mouseUpListener, false);
  this._lastMousePos = { x : event.pageX, y : event.pageY };
};

PV.prototype._mouseRotate = function(event) {
  var newMousePos = { x : event.pageX, y : event.pageY };
  var delta = {
    x : newMousePos.x - this._lastMousePos.x,
    y : newMousePos.y - this._lastMousePos.y
  };

  var speed = 0.005;
  this._cam.rotateX(speed * delta.y);
  this._cam.rotateY(speed * delta.x);
  this._lastMousePos = newMousePos;
  this.requestRedraw();
};

PV.prototype._mousePan = function(event) {
  var newMousePos = { x : event.pageX, y : event.pageY };
  var delta = {
    x : newMousePos.x - this._lastMousePos.x,
    y : newMousePos.y - this._lastMousePos.y
  };

  var speed = 0.05;
  this._cam.panXY(speed * delta.x, speed * delta.y);
  this._lastMousePos = newMousePos;
  this.requestRedraw();
};

PV.prototype.RENDER_MODES =
    [ 'sline', 'line', 'trace', 'lineTrace', 'cartoon', 'tube', 'spheres' ];

/// simple dispatcher which allows to render using a certain style.
//  will bail out if the render mode does not exist.
PV.prototype.renderAs = function(name, structure, mode, opts) {
  var found = false;
  for (var i = 0; i < this.RENDER_MODES.length; ++i) {
    if (this.RENDER_MODES[i] === mode) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.error('render mode', mode, 'not supported');
    return;
  }
  return this[mode](name, structure, opts);
};


PV.prototype._handleStandardOptions = function(opts) {
  opts = copy(opts);
  opts.float32Allocator = this._float32Allocator;
  opts.uint16Allocator = this._uint16Allocator;
  opts.idPool = this._objectIdManager;
  opts.showRelated = opts.showRelated || 'asym';
  return opts;
};


PV.prototype.lineTrace = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);
  options.color = options.color || color.uniform([ 1, 0, 1 ]);
  options.lineWidth = options.lineWidth || 4.0;

  var obj = render.lineTrace(structure, this._gl, options);
  return this.add(name, obj);
};

PV.prototype.spheres = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);
  options.color = options.color || color.byElement();
  options.sphereDetail = this.options('sphereDetail');
  options.radiusMultiplier = options.radiusMultiplier || 1.0;

  var obj = render.spheres(structure, this._gl, options);
  return this.add(name, obj);
};

PV.prototype.sline = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);
  options.color = options.color || color.uniform([ 1, 0, 1 ]);
  options.splineDetail = options.splineDetail || this.options('splineDetail');
  options.strength = options.strength || 1.0;
  options.lineWidth = options.lineWidth || 4.0;

  var obj = render.sline(structure, this._gl, options);
  return this.add(name, obj);
};

// internal method for debugging the auto-slabbing code. 
// not meant to be used otherwise. Will probably be removed again.
PV.prototype.boundingSpheres = function(gl, obj, options) {
  var vertArrays = obj.vertArrays();
  var mg = new MeshGeom(gl, options.float32Allocator, 
                        options.uint16Allocator);
  mg.order(100);
  var protoSphere = new ProtoSphere(16, 16);
  var vertsPerSphere = protoSphere.numVerts();
  var indicesPerSphere = protoSphere.numIndices();
  var vertAssoc = new AtomVertexAssoc(obj.structure());
  mg.setVertAssoc(vertAssoc);
  mg.addChainVertArray({ name : function() { return "a"; }}, 
                       vertArrays.length * vertsPerSphere,
                       indicesPerSphere * vertArrays.length);
  mg.setShowRelated('asym');
  var color = [0.5, 0.5, 0.5, 0.2];
  var va = mg.vertArrayWithSpaceFor(vertsPerSphere * vertArrays.length);
  for (var i = 0; i < vertArrays.length; ++i) {
    var bs = vertArrays[i].boundingSphere();
    protoSphere.addTransformed(va, bs.center(), bs.radius(), color, 0);
  }
  return mg;
};

PV.prototype.cartoon = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);
  options.color = options.color || color.bySS();
  options.strength = options.strength || 1.0;
  options.splineDetail = options.splineDetail || this.options('splineDetail');
  options.arcDetail = options.arcDetail || this.options('arcDetail');
  options.radius = options.radius || 0.3;
  options.forceTube = options.forceTube || false;
  var obj = render.cartoon(structure, this._gl, options);
  var added = this.add(name, obj);
  if (options.boundingSpheres) {
    var boundingSpheres = this.boundingSpheres(this._gl, obj, options);
    this.add(name+'.bounds', boundingSpheres);
  }
  return added;
};


PV.prototype.surface = function(name, data, opts) {
  var options = this._handleStandardOptions(opts);
  var obj = render.surface(data, this._gl, options);
  return this.add(name, obj);
};

// renders the protein using a smoothly interpolated tube, essentially
// identical to the cartoon render mode, but without special treatment for
// helices and strands.
PV.prototype.tube = function(name, structure, opts) {
  opts = opts || {};
  opts.forceTube = true;
  return this.cartoon(name, structure, opts);
};

PV.prototype.ballsAndSticks = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);

  options.color = options.color || color.byElement();
  options.radius = options.radius || 0.3;
  options.arcDetail = (options.arcDetail || this.options('arcDetail')) * 2;
  options.sphereDetail = options.sphereDetail || this.options('sphereDetail');

  var obj = render.ballsAndSticks(structure, this._gl, options);
  return this.add(name, obj);
};

PV.prototype.lines = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);
  options.color = options.color || color.byElement();
  options.lineWidth = options.lineWidth || 4.0;
  var obj = render.lines(structure, this._gl, options);
  return this.add(name, obj);
};

PV.prototype.trace = function(name, structure, opts) {
  var options = this._handleStandardOptions(opts);
  options.color = options.color || color.uniform([ 1, 0, 0 ]);
  options.radius = options.radius || 0.3;
  options.arcDetail = (options.arcDetail || this.options('arcDetail')) * 2;
  options.sphereDetail = options.sphereDetail || this.options('sphereDetail');

  var obj = render.trace(structure, this._gl, options);
  return this.add(name, obj);
};

PV.prototype.fitTo = function(what, slabMode) {
  var axes = this._cam.mainAxes();
  slabMode = slabMode || this._options.slabMode;
  var intervals = [ new Range(), new Range(), new Range() ];
  if (what instanceof SceneNode) {
    what.updateProjectionIntervals(axes[0], axes[1], axes[2], intervals[0],
                                   intervals[1], intervals[2]);
  } else if (what.eachAtom !== undefined) {
    what.eachAtom(function(atom) {
      var pos = atom.pos();
      for (var i = 0; i < 3; ++i) {
        intervals[i].update(vec3.dot(pos, axes[i]));
      }
    });
    for (var i = 0; i < 3; ++i) {
      intervals[i].extend(1.5);
    }
  }
  this._fitToIntervals(axes, intervals, slabMode);
};

PV.prototype._fitToIntervals = function(axes, intervals) {
  if (intervals[0].empty() || intervals[1].empty() || intervals[2].empty()) {
    console.error('could not determine interval. No objects shown?');
    return;
  }
  var cx = intervals[0].center();
  var cy = intervals[1].center();
  var cz = intervals[2].center();
  var center = [
    cx * axes[0][0] + cy * axes[1][0] + cz * axes[2][0],
    cx * axes[0][1] + cy * axes[1][1] + cz * axes[2][1],
    cx * axes[0][2] + cy * axes[1][2] + cz * axes[2][2]
  ];
  var fovY = this._cam.fieldOfViewY();
  var aspect = this._cam.aspectRatio();
  var inPlaneX = intervals[0].length() / aspect;
  var inPlaneY = intervals[1].length();
  var inPlane = Math.max(inPlaneX, inPlaneY) * 0.5;
  var distanceToFront =  inPlane / Math.tan(0.5 * fovY);
  var newZoom =
      (distanceToFront + 0.5*intervals[2].length());
  var grace = 0.5;
  var near = Math.max(distanceToFront - grace, 0.1);
  var far = 2 * grace + distanceToFront + intervals[2].length();
  this._cam.setNearFar(near,  far);
  this.setCamera(this._cam.rotation(), center, newZoom, this._options.animateTime);
  this.requestRedraw();
};

// adapt the zoom level to fit the viewport to all visible objects.
PV.prototype.autoZoom = function() {
  var axes = this._cam.mainAxes();
  var intervals = [ new Range(), new Range(), new Range() ];
  this.forEach(function(obj) {
    if (!obj.visible()) {
      return;
    }
    obj.updateProjectionIntervals(axes[0], axes[1], axes[2], intervals[0],
                                  intervals[1], intervals[2]);
  });
  this._fitToIntervals(axes, intervals);
};

PV.prototype.slabInterval = function() {
};

PV.prototype.autoSlab = function() {
  var slab = this._options._slabMode.update(this._objects, this._cam);
  if (slab !== null) {
    this._cam.setNearFar(slab.near, slab.far);
  }
  this.requestRedraw();
};

// enable disable rock and rolling of camera
PV.prototype.rockAndRoll = function(enable) {
  if (enable === true) {
    this._camAnim.rotation = new RockAndRoll(this._cam.rotation(), 
                                             [0, 1, 0], 2000);
    this.requestRedraw();
  } else if (enable === false) {
    this._camAnim.rotation = null;
    this.requestRedraw();
  }
  return this._camAnim.rotation !== null;
};

PV.prototype.slabMode = function(mode, options) {
  options = options || {};
  var strategy = slabModeToStrategy(mode, options);
  var slab = strategy.update(this._objects, this._cam);
  if (slab !== null) {
    this._cam.setNearFar(slab.near, slab.far);
  }
  this._options.slabMode = strategy;
  this.requestRedraw();
};

PV.prototype.label = function(name, text, pos) {
  var label = new TextLabel(this._gl, this._textureCanvas, 
                            this._2dcontext, pos, text);
  this.add(name, label);
  return label;
};

// INTERNAL: draws scene into offscreen pick buffer with the "select"
// shader.
PV.prototype._drawPickingScene = function() {
  this._gl.clearColor(0.0, 0.0, 0.0, 0.0);
  this._gl.disable(this._gl.BLEND);
  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  this._gl.clearColor(this._options.background[0], this._options.background[1], this._options.background[2], 1.0);
  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  this._drawWithPass('select');
};

function PickingResult(obj, symIndex, transform) {
  this._obj = obj;
  this._symIndex = symIndex;
  this._transform = transform;
}

PickingResult.prototype.object = function() { 
  return this._obj; 
};

PickingResult.prototype.symIndex = function() { 
  return this._symIndex; 
};

PickingResult.prototype.transform = function() { 
  return this._transform; 
};

PV.prototype.pick = function(pos) {
  this._pickBuffer.bind();
  this._drawPickingScene();
  var pixels = new Uint8Array(4);
  this._gl.readPixels(pos.x, this._options.height - pos.y, 1, 1,
                      this._gl.RGBA, this._gl.UNSIGNED_BYTE, pixels);
  this._pickBuffer.release();
  if (pixels.data) {
    pixels = pixels.data;
  }
  var pickedIds = {};
  if (pixels[3] === 0) {
    return null;
  }
  var objId = pixels[0] | pixels[1] << 8;
  var symIndex = pixels[2];

  var obj = this._objectIdManager.objectForId(objId);
  if (obj === undefined) {
    return null;
  }
  var transform = null;
  if (symIndex !== 255) {
    transform = obj.geom.symWithIndex(symIndex);
  }
  return new PickingResult(obj, symIndex < 255 ? symIndex : null,
                           transform);
};

PV.prototype.add = function(name, obj) {
  obj.name(name);
  this._objects.push(obj);
  this._objects.sort(function(lhs, rhs) { return lhs.order() - rhs.order(); });
  this.requestRedraw();
  return obj;
};

PV.prototype._globToRegex = function(glob) {
  var r = glob.replace('.', '\\.').replace('*', '.*');
  return new RegExp('^' + r + '$');
};

PV.prototype.forEach = function() {
  var callback, pattern = '*';
  if (arguments.length === 2) {
    callback = arguments[1];
    pattern = arguments[0];
  } else {
    callback = arguments[0];
  }
  var regex = this._globToRegex(pattern);
  for (var i = 0; i < this._objects.length; ++i) {
    var obj = this._objects[i];
    if (regex.test(obj.name())) {
      callback(obj, i);
    }
  }
};

PV.prototype.get = function(name) {
  for (var i = 0; i < this._objects.length; ++i) {
    if (this._objects[i].name() === name) {
      return this._objects[i];
    }
  }
  console.error('could not find object with name', name);
  return null;
};

PV.prototype.hide = function(glob) {
  this.forEach(glob, function(obj) { obj.hide(); });
};

PV.prototype.show = function(glob) {
  this.forEach(glob, function(obj) { obj.show(); });
};

// remove all objects whose names match the provided glob pattern from
// the viewer.
PV.prototype.rm = function(glob) {
  var newObjects = [];
  var regex = this._globToRegex(glob);
  for (var i = 0; i < this._objects.length; ++i) {
    var obj = this._objects[i];
    if (!regex.test(obj.name())) {
      newObjects.push(obj);
    } else {
      obj.destroy();
    }
  }
  this._objects = newObjects;
};

PV.prototype.all = function() {
  return this._objects;
};


return { Viewer : function(elem, options) { return new PV(elem, options);
}
}
;
})();

if(typeof(exports) !== 'undefined') {
    module.exports = pv;
}
