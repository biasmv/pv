// Copyright (c) 2013 Marco Biasini
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.
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

// line fragment shader, essentially uses the vertColor and adds some fog.
var LINES_FS = '\n\
precision mediump float;\n\
\n\
varying vec3 vertColor;\n\
varying vec3 vertNormal;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main(void) {\n\
  gl_FragColor = vec4(vertColor, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) {\n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}';

// hemilight fragment shader
var HEMILIGHT_FS = '\n\
precision mediump float;\n\
\n\
varying vec3 vertColor;\n\
varying vec3 vertNormal;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main(void) {\n\
  float dp = dot(vertNormal, vec3(0.0, 0.0, 1.0));\n\
  float hemi = max(0.0, dp)*0.5+0.5;\n\
  gl_FragColor = vec4(vertColor*hemi, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) {\n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}';

// hemilight vertex shader
var HEMILIGHT_VS = '\n\
attribute vec3 attrPos;\n\
attribute vec3 attrColor;\n\
attribute vec3 attrNormal;\n\
\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
varying vec3 vertColor;\n\
varying vec3 vertNormal;\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 n = (modelviewMat * vec4(attrNormal, 0.0));\n\
  vertNormal = n.xyz;\n\
  vertColor = attrColor;\n\
}';
// outline shader. mixes outlineColor with fogColor
var OUTLINE_FS = '\n\
precision mediump float;\n\
\n\
uniform vec3 outlineColor;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
uniform bool fog;\n\
\n\
void main() {\n\
  gl_FragColor = vec4(outlineColor, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  if (fog) { \n\
    float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                        fog_factor);\n\
  }\n\
}';
// outline vertex shader. expands vertices along the (in-screen) xy
// components of the normals.
var OUTLINE_VS = '\n\
\n\
attribute vec3 attrPos;\n\
attribute vec3 attrNormal;\n\
                                                                       \n\
uniform vec3 outlineColor;\n\
uniform mat4 projectionMat;\n\
uniform mat4 modelviewMat;\n\
\n\
void main(void) {\n\
  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n\
  vec4 normal = modelviewMat * vec4(attrNormal, 0.0);\n\
  gl_Position.xy += normal.xy*0.200;\n\
}';

function bind(obj, fn) { 
  return function() { return fn.apply(obj, arguments); };
}


var requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


// A camera, providing us with a view into the 3D worlds. Handles projection,
// and modelview matrices and controls the global render parameters such as
// shader and fog.
function Cam(gl) {
  this._projection = mat4.create();
  this._modelview = mat4.create();
  this._near = 0.1;
  this._far = 400.0;
  this._fogNear = -5;
  this._fogFar = 10;
  this._fog = true;
  this._fogColor = vec3.fromValues(1, 1, 1);
  this._outlineColor = vec3.fromValues(0.1, 0.1, 0.1);
  this._center = vec3.create();
  this._zoom = 50;
  this._rotation = mat4.create();
  this._translation = mat4.create();
  this._updateMat = true;
  this._gl = gl;
  this._currentShader = null;
  mat4.perspective(this._projection, 45.0, gl.viewportWidth / gl.viewportHeight, 
                   this._near, this._far);
  mat4.translate(this._modelview, this._modelview, [0, 0, -20]);
}

Cam.prototype._updateIfRequired = function() {
  if (!this._updateMat) {
    return false;
  }
  mat4.identity(this._modelview);
  mat4.translate(this._modelview, this._modelview, 
                  [-this._center[0], -this._center[1], -this._center[2]]);
  mat4.mul(this._modelview, this._rotation, this._modelview);
  mat4.identity(this._translation);
  mat4.translate(this._translation, this._translation, [0,0, -this._zoom]);
  mat4.mul(this._modelview, this._translation, this._modelview);
  this._updateMat = false;
  return true;
};


Cam.prototype.setCenter = function(point) {
  this._updateMat = true;
  vec3.copy(this._center, point);
};

Cam.prototype.fog =function(value) {
  if (value !== undefined) {
    this._fog = value;
  }
  return this._fog;
};

Cam.prototype.rotateZ = function(delta) {
  this._updateMat = true;
  var tm = mat4.create();
  mat4.rotate(tm, tm, delta, [0,0,1]);
  mat4.mul(this._rotation, tm, this._rotation);
};

Cam.prototype.rotateX= function(delta) {
  this._updateMat = true;
  var tm = mat4.create();
  mat4.rotate(tm, tm, delta, [1,0,0]);
  mat4.mul(this._rotation, tm, this._rotation);
};

Cam.prototype.rotateY = function(delta) {
  this._updateMat = true;
  var tm = mat4.create();
  mat4.rotate(tm, tm, delta, [0,1,0]);
  mat4.mul(this._rotation, tm, this._rotation);
};

Cam.prototype.panX = function(delta) {
  return this.panXY(delta, 0);
};

Cam.prototype.panY = function(delta) {
  return this.panXY(0, delta);
};

Cam.prototype.panXY = (function () {
  var invertRotation = mat4.create();
  var newCenter = vec3.create();
  return function(deltaX, deltaY) {
    mat4.transpose(invertRotation, this._rotation);
    this._updateMat = true;
    vec3.set(newCenter, -deltaX, deltaY ,0);
    vec3.transformMat4(newCenter, newCenter, invertRotation);
    vec3.add(newCenter, newCenter, this._center);
    this.setCenter(newCenter);
  };
})();

Cam.prototype.zoom = function(delta) {
  this._updateMat = true;
  this._zoom += delta;
};

Cam.prototype.currentShader = function() { return this._currentShader; };

// sets all OpenGL parameters to make this camera active.
Cam.prototype.bind = function(shader) {
  var shaderChanged = false;
  if (this._currentShader !== shader)
  {
    this._currentShader = shader;
    this._gl.useProgram(shader);
    shaderChanged = true;
  }
  if (!this._updateIfRequired() && !shaderChanged) {
    return;
  }
  this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
  shader.projection = this._gl.getUniformLocation(shader, 'projectionMat');
  shader.modelview = this._gl.getUniformLocation(shader, 'modelviewMat');
  this._gl.uniformMatrix4fv(shader.projection, false, this._projection);
  this._gl.uniformMatrix4fv(shader.modelview, false, this._modelview);
  this._gl.uniformMatrix4fv(shader.modelview, false, this._modelview);
  this._gl.uniform1i(this._gl.getUniformLocation(shader, 'fog'), this._fog);
  this._gl.uniform1f(this._gl.getUniformLocation(shader, 'fogFar'),
                this._fogFar+this._zoom);
  this._gl.uniform1f(this._gl.getUniformLocation(shader, 'fogNear'),
                this._fogNear+this._zoom);
  if (this._gl.getUniformLocation(shader, 'outlineColor')) {
    this._gl.uniform3fv(this._gl.getUniformLocation(shader, 'outlineColor'),
                  this._outlineColor);
  }
  this._gl.uniform3fv(this._gl.getUniformLocation(shader, 'fogColor'),
                this._fogColor);
};


function PV(domElement, opts) {
  opts = opts || {};
  this._options = {
    width : (opts.width || 500),
    height: (opts.height || 500),
    antialias : opts.antialias,
    quality : opts.quality || 'low',
    style : opts.style || 'hemilight'
  };
  this._domElement = domElement;
  this._canvas = document.createElement('canvas');
  if ('outline' in opts) {
    this._options.outline = opts.outline;
  } else {
    this._options.outline = true;
  }
  this._ok = false;
  this.quality(this._options.quality);
  this._canvas.width = this._options.width;
  this._canvas.height = this._options.height;
  this._domElement.appendChild(this._canvas);

  document.addEventListener('DOMContentLoaded', 
                            bind(this, this._initPV));
}

PV.prototype.gl = function() { return this._gl; };

PV.prototype.ok = function() { return this._ok; };


PV.prototype.options = function(optName, value) {
  if (value !== undefined) {
    if (optName === 'fog') {
      this._cam.fog(value);
    } else {
      this._options[optName] = value;
    }
    return value;
  }
  return this._options[optName];
};

PV.prototype.quality = function(qual) {
  this._options.quality = qual;
  console.info('setting quality to', qual);
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

PV.prototype._initGL = function () {
  var samples = 1;
  try {
    var contextOpts = { 
      antialias : this._options.antialias,
      preserveDrawingBuffer : true // for image export
    };
    this._gl = this._canvas.getContext('experimental-webgl', 
                                       contextOpts);

    if (!this._gl.getContextAttributes().antialias &&
        this._options.antialias) {
      console.info('hardware antialising not supported.',
                   'will use manual antialiasing instead.');
      samples = 2;
    }
  } catch (err) {
    console.error('WebGL not supported', err);
    return false;
  }
  if (!this._gl) {
    console.error('WebGL not supported');
    return false;
  }
  this._options.real_width = this._options.width * samples;
  this._options.real_height = this._options.height * samples;
  if (samples > 1) {
    var scale_factor = 1.0/samples;
    var trans_x = -(1-scale_factor)*0.5*this._options.real_width;
    var trans_y = -(1-scale_factor)*0.5*this._options.real_height;
    var translate = 'translate('+trans_x+'px, '+trans_y+'px)';
    var scale = 'scale('+scale_factor+', '+scale_factor+')';
    var transform = translate+' '+scale;

    this._domElement.style.width = this._options.width+'px';
    this._domElement.style.height = this._options.height+'px';
    this._domElement.style.overflow = 'hidden';
    this._canvas.style.webkitTransform = transform;
    this._canvas.style.transform = transform;
    this._canvas.style.ieTransform = transform;
    this._canvas.width = this._options.real_width;
    this._canvas.height = this._options.real_height;
  }
  this._gl.viewportWidth = this._options.real_width;
  this._gl.viewportHeight = this._options.real_height;

  this._gl.clearColor(1.0, 1.0, 1.0, 1.0);
  this._gl.lineWidth(2.0);
  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  this._gl.enable(this._gl.DEPTH_TEST);
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
  }
  return shaderProgram;
};

PV.prototype._mouseUp = function(event) {
  this._canvas.removeEventListener('mousemove', this._mouseRotateListener, 
                                   false);
  this._canvas.removeEventListener('mousemove', this._mousePanListener, 
                                   false);
  this._canvas.removeEventListener('mouseup', this._mouseUpListener, false);
  document.removeEventListener('mouseup', this._mouseUpListener, false);
  document.removeEventListener('mousemove', this._mouseRotateListener);
  document.removeEventListener('mousemove', this._mousePanListener);
};


PV.prototype._initPV = function() {
  if (!this._initGL()) {
    this._domElement.removeChild(this._canvas);
    this._domElement.innerHTML = WEBGL_NOT_SUPPORTED;
    this._domElement.style.width = this._options.width+'px';
    this._domElement.style.height = this._options.height+'px';
    return false; 
  }
  this._ok = true;
  this._cam = new Cam(this._gl);
  this._shaderCatalog = {
    hemilight : this._initShader(HEMILIGHT_VS, HEMILIGHT_FS),
    outline : this._initShader(OUTLINE_VS, OUTLINE_FS),
    lines : this._initShader(HEMILIGHT_VS, LINES_FS)
  };
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
  this._canvas.addEventListener('mousedown', bind(this, this._mouseDown), 
                                false);
  return true;
};


PV.prototype.requestRedraw = function() {
  requestAnimFrame(bind(this, this._draw));
};

PV.prototype._draw = function() {

  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  for (var i=0; i<this._objects.length; i+=1) {
    this._objects[i].draw(this._cam, this._shaderCatalog, this._options.style, 
                          'normal');
  }
  if (!this._options.outline) {
    return;
  }
  this._gl.cullFace(this._gl.BACK);
  this._gl.enable(this._gl.CULL_FACE);
  for (i = 0; i < this._objects.length; i+=1) {
    this._objects[i].draw(this._cam, this._shaderCatalog, this._options.style, 
                          'outline');
  }
};



PV.prototype.centerOn = function(what) {
  this._cam.setCenter(what.center());
};

PV.prototype.clear = function() {
  this._objects = [];
};



PV.prototype._mouseWheel = function(event) {
  this._cam.zoom(event.wheelDelta*0.05);
  this.requestRedraw();
};

PV.prototype._mouseWheelFF = function(event) {
  this._cam.zoom(-event.deltaY*0.60);
  this.requestRedraw();
};

PV.prototype._mouseDown = function(event) {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  if (event.shiftKey === true){
    this._canvas.addEventListener('mousemove', this._mousePanListener, false);
    document.addEventListener('mousemove', this._mousePanListener, false);
  } else {
    this._canvas.addEventListener('mousemove', this._mouseRotateListener, false);
    document.addEventListener('mousemove', this._mouseRotateListener, false);
  }
  this._canvas.addEventListener('mouseup', this._mouseUpListener, false);
  document.addEventListener('mouseup', this._mouseUpListener, false);
  this._lastMousePos = { x: event.pageX, y: event.pageY };
};

PV.prototype._mouseRotate = function(event) {
  var newMousePos = { x : event.pageX, y : event.pageY };
  var delta = { x : newMousePos.x - this._lastMousePos.x,
                y : newMousePos.y - this._lastMousePos.y};
                
  var speed = 0.005;
  this._cam.rotateX(speed*delta.y);
  this._cam.rotateY(speed*delta.x);
  this._lastMousePos = newMousePos;
  this.requestRedraw();
};

PV.prototype._mousePan = function(event){
  var newMousePos = { x : event.pageX, y : event.pageY };
  var delta = { x : newMousePos.x - this._lastMousePos.x,
                y : newMousePos.y - this._lastMousePos.y};
                
  var speed = 0.05;
  this._cam.panXY(speed*delta.x, speed*delta.y);
  this._lastMousePos = newMousePos;
  this.requestRedraw();
};


PV.prototype.RENDER_MODES = [
  'sline', 'line', 'trace', 'lineTrace', 'cartoon', 'tube',
  'spheres'
];


/// simple dispatcher which allows to render using a certain style.
//  will bail out if the render mode does not exist.
PV.prototype.renderAs = function(structure, mode, opts) {
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
  return this[mode](structure, opts);

};

PV.prototype.lineTrace = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.uniform([1, 0, 1]),
    lineWidth : opts.lineWidth || 4.0
  };
  return render.lineTrace(structure, this._gl, options);
};

PV.prototype.spheres = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.byElement(),
    sphereDetail : this.options('sphereDetail')
  };
  return render.spheres(structure, this._gl, options);
};

PV.prototype.sline = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.uniform([1, 0, 1]),
    splineDetail : opts.splineDetail || this.options('splineDetail'),
    strength: opts.strength || 0.5,
    lineWidth : opts.lineWidth || 4.0
  };
  return render.sline(structure, this._gl, options);
};

PV.prototype.cartoon = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.bySS(),
    strength: opts.strength || 1.0,
    splineDetail : opts.splineDetail || this.options('splineDetail'),
    arcDetail : opts.arcDetail || this.options('arcDetail'),
    radius : opts.radius || 0.3,
    forceTube: opts.forceTube || false
  };
  return render.cartoon(structure, this._gl, options);
};

// renders the protein using a smoothly interpolated tube, essentially 
// identical to the cartoon render mode, but without special treatment for 
// helices and strands.
PV.prototype.tube = function(structure, opts) {
  opts = opts || {};
  opts.forceTube = true;
  return this.cartoon(structure, opts);
};

PV.prototype.ballsAndSticks = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.byElement(),
    radius: opts.radius || 0.3,
    arcDetail : (opts.arcDetail || this.options('arcDetail'))*2,
    sphereDetail : opts.sphereDetail || this.options('sphereDetail')
  };
  return render.ballsAndSticks(structure, this._gl, options);
};

PV.prototype.lines = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.byElement(),
    lineWidth : opts.lineWidth || 4.0
  };
  return render.lines(structure, this._gl, options);
};

PV.prototype.trace = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || color.uniform([1, 0, 0]),
    radius: opts.radius || 0.3,
    arcDetail : (opts.arcDetail || this.options('arcDetail'))*2,
    sphereDetail : opts.sphereDetail || this.options('sphereDetail')
  };
  return render.trace(structure, this._gl, options);
};

PV.prototype.add = function(name, obj) {
  obj.name(name);
  this._objects.push(obj);
  this.requestRedraw();
  return obj;
};

PV.prototype._globToRegex = function(glob) {
  var r = glob.replace('.', '\\.').replace('*', '.*');
  return new RegExp('^'+r+'$');
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
  this.forEach(glob, function(obj) {
    obj.hide();
  });
};

PV.prototype.show = function(glob) {
  this.forEach(glob, function(obj) {
    obj.show();
  });
};

// remove all objects whose names match the provided glob pattern from 
// the viewer. 
PV.prototype.rm = function(glob) {
  var newObjects = [];
  var regex = this._globToRegex(pattern);
  for (var i = 0; i < this._objects.length; ++i) {
    var obj = this._objects[i];
    if (!regex.test(obj.name())) {
      newObjects.push(obj);
    }
  }
  this._objects = newObjects;
};


PV.prototype.all = function() {
  return this._objects;
};

return { Viewer: function(elem, options) { return new PV(elem, options); }};
})();

