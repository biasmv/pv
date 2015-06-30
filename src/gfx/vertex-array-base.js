// Copyright (c) 2013-2015 Marco Biasini
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

define(
  [
    '../gl-matrix', 
    '../geom'
  ], 
  function(
    glMatrix, 
    geom) {
"use strict";

var vec3 = glMatrix.vec3;

function VertexArrayBase(gl, numVerts, float32Allocator) {
  this._gl = gl;
  this._vertBuffer = gl.createBuffer();
  this._float32Allocator = float32Allocator || null;
  this._ready = false;
  this._boundingSphere = null;
  var numFloats = this._FLOATS_PER_VERT * numVerts;
  this._vertData = float32Allocator.request(numFloats);
}

VertexArrayBase.prototype = {
  setColor : function(index, r, g, b, a) {
    var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
    this._vertData[colorStart + 0] = r;
    this._vertData[colorStart + 1] = g;
    this._vertData[colorStart + 2] = b;
    this._vertData[colorStart + 3] = a;
    this._ready = false;
  },

  getColor : function(index, color) {
    var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
    color[0] = this._vertData[colorStart + 0];
    color[1] = this._vertData[colorStart + 1];
    color[2] = this._vertData[colorStart + 2];
    color[3] = this._vertData[colorStart + 3];
    return color;
  },

  setOpacity : function(index, a) {
    var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
    this._vertData[colorStart + 3] = a;
    this._ready = false;
  },

  setSelected : function(index, a) {
    var selected = index * this._FLOATS_PER_VERT + this._SELECT_OFFSET;
    this._vertData[selected] = a;
    this._ready = false;
  },


  boundingSphere : function() {
    if (!this._boundingSphere) {
      this._boundingSphere = this._calculateBoundingSphere();
    }
    return this._boundingSphere;
  },


  _calculateBoundingSphere : function() {
    var numVerts = this.numVerts();
    if (numVerts === 0) {
      return null;
    }
    var center = vec3.create();
    var index, i;
    for (i = 0; i < numVerts; ++i) {
      index = i * this._FLOATS_PER_VERT;
      center[0] += this._vertData[index + 0];
      center[1] += this._vertData[index + 1];
      center[2] += this._vertData[index + 2];
    }
    vec3.scale(center, center, 1.0/numVerts);
    var radiusSquare = 0.0;
    for (i = 0; i < numVerts; ++i) {
      index = i * this._FLOATS_PER_VERT;
      var dx  = center[0] - this._vertData[index + 0];
      var dy  = center[1] - this._vertData[index + 1];
      var dz  = center[2] - this._vertData[index + 2];
      radiusSquare = Math.max(radiusSquare, dx*dx + dy*dy + dz*dz);
    }
    return new geom.Sphere(center, Math.sqrt(radiusSquare));
  },

  destroy : function() {
    this._gl.deleteBuffer(this._vertBuffer);
    this._float32Allocator.release(this._vertData);
  },

  bindBuffers : function() {
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
    if (this._ready) {
      return;
    }
    this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertData,
                        this._gl.STATIC_DRAW);
    this._ready = true;
  },

  // Helper method to calculate the squared bounding sphere radius of the 
  // sphere centered on "sphereCenter" over multiple vertex arrays. 
  updateSquaredSphereRadius :  (function() {

    var transformedCenter = vec3.create();
    return function(sphereCenter, radius, transform) {
      var bounds = this.boundingSphere();
      if (!bounds) {
        return radius;
      }
      // Note: Math.max(radius, null) returns the radius for positive values 
      // of radius, which is exactly what we want.
      if (transform) {
        vec3.transformMat4(transformedCenter, bounds.center(), transform);
        return Math.max(vec3.sqrDist(transformedCenter, sphereCenter), radius);
      } 

      var sphereRadSquare = bounds.radius() * bounds.radius();
      return Math.max(vec3.sqrDist(bounds.center(), 
                                   sphereCenter) + sphereRadSquare, 
                      radius);
    };
  })(),

  updateProjectionIntervals :  (function() {

    var transformedCenter = vec3.create();
    return function(xAxis, yAxis, zAxis, xInterval, yInterval, 
                    zInterval, transform) {
      var bounds = this.boundingSphere();
      if (!bounds) {
        return;
      }
      if (transform) {
        vec3.transformMat4(transformedCenter, bounds.center(), transform);
      } else {
        vec3.copy(transformedCenter, bounds.center());
      }
      var xProjected = vec3.dot(xAxis, transformedCenter);
      var yProjected = vec3.dot(yAxis, transformedCenter);
      var zProjected = vec3.dot(zAxis, transformedCenter);
      xInterval.update(xProjected - bounds.radius());
      xInterval.update(xProjected + bounds.radius());
      yInterval.update(yProjected - bounds.radius());
      yInterval.update(yProjected + bounds.radius());
      zInterval.update(zProjected - bounds.radius());
      zInterval.update(zProjected + bounds.radius());
    };
  })()
};

return VertexArrayBase;

});
