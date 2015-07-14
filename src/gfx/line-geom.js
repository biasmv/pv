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
    '../utils', 
    './base-geom', 
    './chain-data'
  ], 
  function(
    utils, 
    BaseGeom, 
    chainData) {

"use strict";

var LineChainData = chainData.LineChainData;

// Holds geometrical data for objects rendered as lines. For each vertex,
// the color and position is stored in an interleaved format.
function LineGeom(gl, float32Allocator) {
  BaseGeom.call(this, gl);
  this._vertArrays = [];
  this._float32Allocator = float32Allocator;
  this._lineWidth = 0.5;
  this._pointSize = 1.0;
}

utils.derive(LineGeom, BaseGeom, {
  addChainVertArray : function(chain, numVerts) {
    var va = new LineChainData(chain.name(), this._gl, numVerts, 
                              this._float32Allocator);
    this._vertArrays.push(va);
    return va;
  },


  setLineWidth : function(width) {
    this._lineWidth = width;
  },
  setPointSize : function(size) {
    this._pointSize = size;
  },

  vertArrays : function() {
    return this._vertArrays;
  },

  shaderForStyleAndPass :
      function(shaderCatalog, style, pass) {
    if (pass === 'outline') {
      return shaderCatalog.selectLines;
    }
    if (pass === 'select') {
      return shaderCatalog.select;
    }
    return shaderCatalog.lines;
  },

  destroy : function() {
    BaseGeom.prototype.destroy.call(this);
    for (var i = 0; i < this._vertArrays.length; ++i) {
      this._vertArrays[i].destroy();
    }
    this._vertArrays = [];
  },

  _drawVertArrays : function(cam, shader, vertArrays, 
                             additionalTransforms) {
    var pointSizeMul = cam.upsamplingFactor();
    if (shader.selectAttrib !== -1) {
      pointSizeMul = 4.0 * cam.upsamplingFactor();
    }
    var i;
    if (additionalTransforms) {
      cam.bind(shader);
      this._gl.lineWidth(pointSizeMul * this._lineWidth);
      if (shader.pointSize) {
        this._gl.uniform1f(shader.pointSize, 
                          pointSizeMul * this._pointSize);
      }
      for (i = 0; i < vertArrays.length; ++i) {
        vertArrays[i].drawSymmetryRelated(cam, shader, additionalTransforms);
      }
    } else {
      cam.bind(shader);
      this._gl.lineWidth(pointSizeMul * this._lineWidth);
      this._gl.uniform1i(shader.symId, 255);
      if (shader.pointSize) {
        this._gl.uniform1f(shader.pointSize, 
                          pointSizeMul * this._pointSize);
      }
      for (i = 0; i < vertArrays.length; ++i) {
        vertArrays[i].bind(shader);
        vertArrays[i].draw();
        vertArrays[i].releaseAttribs(shader);
      }
    }
  },

  vertArray : function() { return this._va; }
});

return LineGeom;

});

