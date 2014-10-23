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

// A camera, providing us with a view into the 3D worlds. Handles projection,
// and modelview matrices and controls the global render parameters such as
  // shader and fog.
function Cam(gl) {
  this._projection = mat4.create();
  this._camModelView = mat4.create();
    this._modelView = mat4.create();
  this._rotation = mat4.create();
  this._translation = mat4.create();
  this._near = 0.10;
  this._far = 4000.0;
  this._fogNear = -5;
  this._fogFar = 50;
  this._fog = true;
  this._fovY = Math.PI * 45.0 / 180.0;
  this._paramsChanged = false;
  this._fogColor = vec3.fromValues(1, 1, 1);
  this._outlineColor = vec3.fromValues(0.1, 0.1, 0.1);
  this._center = vec3.create();
  this._zoom = 50;
  this._updateMat = true;
  this._gl = gl;
  this._currentShader = null;
  this.setViewportSize(gl.viewportWidth, gl.viewportHeight);
}


Cam.prototype.setRotation = function(rot) {
  if (rot.length === 16) {
    mat4.copy(this._rotation, rot);
  } else {
    this._rotation[0] = rot[0];
    this._rotation[1] = rot[1];
    this._rotation[2] = rot[2];
    this._rotation[3] = 0.0;
    this._rotation[4] = rot[3];
    this._rotation[5] = rot[4];
    this._rotation[6] = rot[5];
    this._rotation[7] = 0.0;
    this._rotation[8] = rot[6];
    this._rotation[9] = rot[7];
    this._rotation[10] = rot[8];
    this._rotation[11] = 0.0;
    this._rotation[12] = 0.0;
    this._rotation[13] = 0.0;
    this._rotation[14] = 0.0;
    this._rotation[15] = 1.0;
  }
  this._updateMat = true;
};

// returns the 3 main axes of the current camera rotation
Cam.prototype.mainAxes = function() {
  return[
    vec3.fromValues(this._rotation[0], this._rotation[4], this._rotation[8]),
    vec3.fromValues(this._rotation[1], this._rotation[5], this._rotation[9]),
    vec3.fromValues(this._rotation[2], this._rotation[6], this._rotation[10])
  ];
};

Cam.prototype.fieldOfViewY = function() {
  return this._fovY;
};

Cam.prototype.aspectRatio = function() {
  return this._width / this._height;
};

Cam.prototype.rotation = function() {
  return this._rotation;
};

Cam.prototype._updateIfRequired = function() {
  if (!this._updateMat) {
    return false;
  }
  mat4.identity(this._camModelView);
  mat4.translate(this._camModelView, this._camModelView,
                  [ -this._center[0], -this._center[1], -this._center[2] ]);
  mat4.mul(this._camModelView, this._rotation, this._camModelView);
  mat4.identity(this._translation);
  mat4.translate(this._translation, this._translation, [ 0, 0, -this._zoom ]);
  mat4.mul(this._camModelView, this._translation, this._camModelView);
  mat4.identity(this._projection);
  mat4.perspective(this._projection, this._fovY, this._width / this._height,
                    this._near, this._far);
  this._updateMat = false;
  return true;
};

Cam.prototype.setViewportSize = function(width, height) {
  this._updateMat = true;
  this._width = width;
  this._height = height;
};

Cam.prototype.setCenter = function(point) {
  this._updateMat = true;
  vec3.copy(this._center, point);
};

Cam.prototype.fog = function(value) {
  if (value !== undefined) {
    this._fog = value;
    this._paramsChanged = true;
  }
  return this._fog;
};

Cam.prototype.rotateZ = (function() {
    var tm = mat4.create();
    return function(delta) {
      mat4.identity(tm);
    this._updateMat = true;
    mat4.rotate(tm, tm, delta, [ 0, 0, 1 ]);
    mat4.mul(this._rotation, tm, this._rotation);
  };
})();

Cam.prototype.rotateX= (function(){
  var tm = mat4.create();
  return function(delta) {
    mat4.identity(tm);
  this._updateMat = true;
  mat4.rotate(tm, tm, delta, [ 1, 0, 0 ]);
  mat4.mul(this._rotation, tm, this._rotation);
  };
})();

Cam.prototype.rotateY = (function() {
  var tm = mat4.create();
  return function(delta) {
    mat4.identity(tm);
  this._updateMat = true;
  mat4.rotate(tm, tm, delta, [ 0, 1, 0 ]);
  mat4.mul(this._rotation, tm, this._rotation);
  };
})();

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
  vec3.set(newCenter, -deltaX, deltaY, 0);
  vec3.transformMat4(newCenter, newCenter, invertRotation);
  vec3.add(newCenter, newCenter, this._center);
  this.setCenter(newCenter);
  };
})();

Cam.prototype.nearOffset = function() { return this._near; };
Cam.prototype.farOffset = function() { return this._far; };


Cam.prototype.setNearFar = function(near, far) {
  if (near === this._near && far === this._far) {
    return;
  }
  this._near = near;
  this._far = far;
  this._updateMat = true;
};

Cam.prototype.setFogNearFar = function(near, far) {
  this._fogNear = near;
  this._fogFar = far;
  this._updateMat = true;
};

Cam.prototype.setZoom = function(zoom) {
  this._updateMat = true;
  this._zoom = zoom;
  return this._zoom;
};

Cam.prototype.zoom = function(delta) {
  if (delta === undefined) {
    return this._zoom;
  }
  this._updateMat = true;
  var factor = 1.0 + delta * 0.1;
  this._zoom = Math.min(1000.0, Math.max(2.0, factor * this._zoom));
  return this._zoom;
};

Cam.prototype.center = function() {
  return this._center;
};

Cam.prototype.currentShader = function() {
  return this._currentShader;
};

// sets all OpenGL parameters to make this camera active.
//
// among other things, it sets the follow uniforms on the shader:
//
// - projectionMat   - the 4x4 projection matrix
// - modelviewMat    - the 4x4 modelview matrix
// - rotationMat     - the rotational part of the modelview matrix
// - fog             - boolean indicating whether fog is enabled
// - fogNear,fogFar  - near and far offset of fog
// - fogColor        - the color of fog
// - outlineColor    - color to be used for the outline shader
Cam.prototype.bind = function(shader, additionalTransform) {
  var shaderChanged = false;
  if (this._currentShader !== shader) {
    this._currentShader = shader;
    this._gl.useProgram(shader);
    shaderChanged = true;
  }
  shaderChanged = this._updateIfRequired() || shaderChanged;

  // in case additionalTransform is given, multiply camera model view
  // with the matrix and use the product as the model view matrix. 
  if (additionalTransform) {
    mat4.mul(this._modelView, this._camModelView, additionalTransform);
    this._gl.uniformMatrix4fv(shader.modelview, false, this._modelView);
  } else {
    this._gl.uniformMatrix4fv(shader.modelview, false, this._camModelView);
  }

  // in case nothing changed, there is no need for us to set any other
  // parameters.
  if (!shaderChanged && !this._paramsChanged) {
    return;
  }
  this._paramsChanged = false;
  this._gl.uniformMatrix4fv(shader.projection, false, this._projection);
  if (shader.rotation) {
    this._gl.uniformMatrix4fv(shader.rotation, false, this._rotation);
  }
  this._gl.uniform1i(shader.fog, this._fog);
  var nearOffset =   this._zoom ;
  this._gl.uniform1f(shader.fogFar, this._fogFar + nearOffset);
  this._gl.uniform1f(shader.fogNear, this._fogNear + nearOffset);
  this._gl.uniform3fv(shader.fogColor, this._fogColor);
  this._gl.uniform3fv(shader.outlineColor, this._outlineColor);
};

exports.Cam = Cam;
})(this);

