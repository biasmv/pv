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

// hemilight fragment shader
var HEMILIGHT_FS = '\n\
precision mediump float;\n\
\n\
varying vec3 vertColor;\n\
varying vec3 vertNormal;\n\
uniform float fogNear;\n\
uniform float fogFar;\n\
uniform vec3 fogColor;\n\
\n\
void main(void) {\n\
  float dp = dot(vertNormal, vec3(0.0, 0.0, 1.0));\n\
  float hemi = max(0.0, dp)*0.5+0.5;\n\
  gl_FragColor = vec4(vertColor*hemi, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
  gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                      fog_factor);\n\
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
\n\
void main() {\n\
  gl_FragColor = vec4(outlineColor, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  float fog_factor = smoothstep(fogNear, fogFar, depth);\n\
  gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n\
                      fog_factor);\n\
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



function evenOdd(even, odd) {
  return function(atom, out, index) {
    if (atom.residue().num() % 2) {
      out[index] = even[0];
      out[index+1] = even[1];
      out[index+2] = even[2];
    } else {
      out[index] = odd[0];
      out[index+1] = odd[1];
      out[index+2] = odd[2];
    }
  };
}


function ss() {
  return function(atom, out, index) {
    switch (atom.residue().ss()) {
      case 'C':
        out[index] = 0.8;
        out[index+1] = 0.8;
        out[index+2] = 0.8;
        return;
      case 'H':
        out[index] = 0.6;
        out[index+1] = 0.6;
        out[index+2] = 0.9;
        return;
      case 'E':
        out[index] = 0.2;
        out[index+1] = 0.8;
        out[index+2] = 0.2;
        return;
    }
  };
}


function uniformColor(color) {
  return function(atom, out, index) {
    out[index] = color[0];
    out[index+1] = color[1];
    out[index+2] = color[2];
  };
}



function colorForElement(ele, out) {
  if (!out) {
    out = vec3.create();
  }
  if (ele == 'C') {
    vec3.set(out, 0.8,0.8, 0.8);
    return out;
  }
  if (ele == 'N') {
    vec3.set(out, 0, 0, 1);
    return out;
  }
  if (ele == 'O') {
    vec3.set(out, 1, 0, 0);
    return out;
  }
  if (ele == 'S') {
    vec3.set(out, 0.8, 0.8, 0);
    return out;
  }
  if (ele == 'CA') {
    vec3.set(out, 0.533, 0.533, 0.666);
    return out;
  }
  vec3.set(out, 1, 0, 1);
  return out;
}

function cpk_color() {
  return function(atom, out, index) {
    colorForElement(atom.element(), out);
  };
}




var Cam = function(gl) {
  var self = {
    projection : mat4.create(),
    modelview : mat4.create(),
    near : 0.1,
    far : 400.0,
    fogNear : -5,
    fogFar : 10,
    fogColor : vec3.fromValues(1, 1, 1),
    center : vec3.create(),
    zoom : 50,
    rotation : mat4.create(),
    translation : mat4.create(),
    updateMat : true
  }; 


  function updateIfRequired() {
    if (!self.updateMat) {
      return;
    }
    mat4.identity(self.modelview);
    mat4.translate(self.modelview, self.modelview, 
                   [-self.center[0], -self.center[1], -self.center[2]]);
    mat4.mul(self.modelview, self.rotation, self.modelview);
    mat4.identity(self.translation);
    mat4.translate(self.translation, self.translation, [0,0, -self.zoom]);
    mat4.mul(self.modelview, self.translation, self.modelview);
    self.updateMat = false;
  }

  mat4.perspective(self.projection, 45.0, gl.viewportWidth / gl.viewportHeight, 
                   self.near, self.far);
  mat4.translate(self.modelview, self.modelview, [0, 0, -20]);
  return {

    set_center : function(point) {
      self.updateMat = true;
      vec3.copy(self.center, point);
    },
    rotate_z : function(delta) {
      self.updateMat = true;
      var tm = mat4.create();
      mat4.rotate(tm, tm, delta, [0,0,1]);
      mat4.mul(self.rotation, tm, self.rotation);
    },
    rotate_x: function(delta) {
      self.updateMat = true;
      var tm = mat4.create();
      mat4.rotate(tm, tm, delta, [1,0,0]);
      mat4.mul(self.rotation, tm, self.rotation);
    },
    rotate_y : function(delta) {
      self.updateMat = true;
      var tm = mat4.create();
      mat4.rotate(tm, tm, delta, [0,1,0]);
      mat4.mul(self.rotation, tm, self.rotation);
    },
    zoom : function(delta) {
      self.updateMat = true;
      self.zoom += delta;
    },

    bind : function(shader) {
      updateIfRequired();
      gl.useProgram(shader);
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      shader.projection = gl.getUniformLocation(shader, 'projectionMat');
      shader.modelview = gl.getUniformLocation(shader, 'modelviewMat');
      gl.uniformMatrix4fv(shader.projection, false, self.projection);
      gl.uniformMatrix4fv(shader.modelview, false, self.modelview);
      gl.uniform1f(gl.getUniformLocation(shader, 'fogFar'),
                    self.fogFar+self.zoom);
      gl.uniform1f(gl.getUniformLocation(shader, 'fogNear'),
                    self.fogNear+self.zoom);
      gl.uniform3fv(gl.getUniformLocation(shader, 'fogColor'),
                    self.fogColor);
    }
  };
};


function PV(domElement, opts) {
  opts = opts || {};
  this._options = {
    width : (opts.width || 500),
    height: (opts.height || 500),
    antialias : opts.antialias,
    quality : opts.quality || 'low',
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


PV.prototype.options = function(opt_name) {
  return this._options[opt_name];
};

PV.prototype.quality = function(qual) {
  this._options.quality = qual;
  console.info('setting quality to', qual);
  if (qual == 'high') {
    this._options.arcDetail = 4;
    this._options.sphereDetail = 16;
    this._options.splineDetail = 8;
    return;
  } 
  if (qual == 'medium') {
    this._options.arcDetail = 3;
    this._options.sphereDetail = 10;
    this._options.splineDetail = 4;
    return;
  }
  if (qual == 'low') {
    this._options.arcDetail = 2;
    this._options.sphereDetail = 8;
    this._options.splineDetail = 2;
    return;
  }
  console.error('invalid quality argument', qual);
};

PV.prototype._initGL = function () {
  var samples = 1;
  try {
    var context_opts = { antialias : this._options.antialias };
    this._gl = this._canvas.getContext('experimental-webgl', 
                                       context_opts);

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
  this._canvas.removeEventListener('mousemove', this._mouseMoveListener, 
                                   false);
  this._canvas.removeEventListener('mouseup', this._mouseUpListener, false);
  document.removeEventListener('mousemove', this._mouseMoveListener);
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
  this._cam = Cam(this._gl);
  this._hemilightShader = this._initShader(HEMILIGHT_VS, HEMILIGHT_FS);
  this._outlineShader = this._initShader(OUTLINE_VS, OUTLINE_FS);
  this._mouseMoveListener = bind(this, this._mouseMove);
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

PV.prototype._add = function(what) {
  this._objects.push(what);
  this.requestRedraw();
};

PV.prototype.requestRedraw = function() {
  requestAnimFrame(bind(this, this._draw));
};

PV.prototype._draw = function() {

  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

  this._cam.bind(this._hemilightShader);
  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  for (var i=0; i<this._objects.length; i+=1) {
    this._objects[i].draw(this._hemilightShader, false);
  }
  if (!this._options.outline) {
    return;
  }
  this._cam.bind(this._outlineShader);
  this._gl.cullFace(this._gl.BACK);
  this._gl.enable(this._gl.CULL_FACE);
  for (i = 0; i < this._objects.length; i+=1) {
    this._objects[i].draw(this._outlineShader, true);
  }
};



PV.prototype.centerOn = function(what) {
  this._cam.set_center(what.center());
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
  event.preventDefault();
  this._canvas.addEventListener('mousemove', this._mouseMoveListener, false);
  document.addEventListener('mousemove', this._mouseMoveListener, false);
  this._canvas.addEventListener('mouseup', this._mouseUpListener, false);
  document.addEventListener('mouseup', this._mouseUpListener, false);
  this._lastMousePos = { x: event.pageX, y: event.pageY };
};

PV.prototype._mouseMove = function(event) {
  var newMousePos = { x : event.pageX, y : event.pageY };
  var delta = { x : newMousePos.x - this._lastMousePos.x,
                y : newMousePos.y - this._lastMousePos.y};
                
  var speed = 0.005;
  this._cam.rotate_x(speed*delta.y);
  this._cam.rotate_y(speed*delta.x);
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
    color : opts.color || uniformColor([1, 0, 1])
  };
  return render.lineTrace(structure, this._gl, options);
};

PV.prototype.spheres = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || cpk_color(),
    sphereDetail : this.options('sphereDetail')
  };
  return render.spheres(structure, this._gl, options);
}

PV.prototype.sline = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || uniformColor([1, 0, 1]),
    splineDetail : opts.splineDetail || this.options('splineDetail'),
    strength: opts.strength || 0.5
  };
  return render.sline(structure, this._gl, options);
}

PV.prototype.cartoon = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || ss(),
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

PV.prototype.lines = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || cpk_color()
  };
  return render.lines(structure, this._gl, options);
}

PV.prototype.trace = function(structure, opts) {
  opts = opts || {};
  var options = {
    color : opts.color || uniformColor([1, 0, 0]),
    radius: opts.radius || 0.3,
    arcDetail : (opts.arcDetail || this.options('arcDetail'))*2,
    sphereDetail : opts.sphereDetail || this.options('sphereDetail')
  };
  return render.trace(structure, this._gl, options);
}


PV.prototype.add = function(name, obj) {
  this._objects.push(obj);
  this.requestRedraw();

};

return { Viewer: function(elem, options) { return new PV(elem, options); }};
})();

