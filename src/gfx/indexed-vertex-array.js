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
    './vertex-array-base'
  ], 
  function(
    utils, 
    VertexArrayBase) {

"use strict";

function IndexedVertexArray(gl, numVerts, numIndices, 
                            float32Allocator, uint16Allocator) {
  VertexArrayBase.call(this, gl, numVerts, float32Allocator);
  this._indexBuffer = gl.createBuffer();
  this._uint16Allocator = uint16Allocator;
  this._numVerts = 0;
  this._maxVerts = numVerts;
  this._numTriangles = 0;
  this._indexData = uint16Allocator.request(numIndices);
}

utils.derive(IndexedVertexArray, VertexArrayBase, {

  destroy : function() {
    VertexArrayBase.prototype.destroy.call(this);
    this._gl.deleteBuffer(this._indexBuffer);
    this._uint16Allocator.release(this._indexData);
  },
  setIndexData : function(data) {
    this._ready = false;
    this._numTriangles = data.length/3;
    for (var i = 0; i < data.length; ++i) {
      this._indexData[i] = data[i];
    }
  },

  setVertData : function(data) {
    this._ready = false;
    this._numVerts = data.length/this._FLOATS_PER_VERT;
    for (var i = 0; i < data.length; ++i) {
      this._vertData[i] = data[i];
    }
  },

  numVerts : function() { return this._numVerts; },
  maxVerts : function() { return this._maxVerts; },
  numIndices : function() { return this._numTriangles * 3; },

  addVertex : function(pos, normal, color, objId) {
    if (this._numVerts === this._maxVerts) {
      console.error('maximum number of vertices reached');
      return;
    }
    var i = this._numVerts * this._FLOATS_PER_VERT;
    this._vertData[i++] = pos[0];
    this._vertData[i++] = pos[1];
    this._vertData[i++] = pos[2];
    this._vertData[i++] = normal[0];
    this._vertData[i++] = normal[1];
    this._vertData[i++] = normal[2];
    this._vertData[i++] = color[0];
    this._vertData[i++] = color[1];
    this._vertData[i++] = color[2];
    this._vertData[i++] = color[3];
    this._vertData[i++] = objId;
    this._vertData[i++] = 0.0; // select
    this._numVerts += 1;
    this._ready = false;
  },

  _FLOATS_PER_VERT : 12,
  _BYTES_PER_VERT : 12 * 4,

  _OBJID_OFFSET : 10,
  _OBJID_BYTE_OFFSET : 10 * 4,

  _SELECT_OFFSET : 11,
  _SELECT_BYTE_OFFSET : 11 * 4,

  _COLOR_OFFSET : 6,
  _COLOR_BYTE_OFFSET : 6 * 4,

  _NORMAL_OFFSET : 3,
  _NORMAL_BYTE_OFFSET : 3 * 4,

  _POS_OFFSET : 0,
  _POS_BYTE_OFFSET : 0 * 4,

  addTriangle : function(idx1, idx2, idx3) {
    var index = 3 * this._numTriangles;
    if (index + 2 >= this._indexData.length) {
      return;
    }
    this._indexData[index++] = idx1;
    this._indexData[index++] = idx2;
    this._indexData[index++] = idx3;
    this._numTriangles += 1;
    this._ready = false;
  },

  bindBuffers : function() {
    var ready = this._ready;
    var gl = this._gl;
    VertexArrayBase.prototype.bindBuffers.call(this);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    if (ready) {
      return;
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexData, gl.STATIC_DRAW);
  },

  bindAttribs : function(shader) {
    var gl = this._gl;
    var byteStride = this._BYTES_PER_VERT;
    gl.enableVertexAttribArray(shader.posAttrib);
    gl.vertexAttribPointer(shader.posAttrib, 3, gl.FLOAT, false,
                           byteStride, this._POS_BYTE_OFFSET);
    if (shader.normalAttrib !== -1) {
      gl.enableVertexAttribArray(shader.normalAttrib);
      gl.vertexAttribPointer(shader.normalAttrib, 3, gl.FLOAT, false,
                             byteStride, this._NORMAL_BYTE_OFFSET);
    }

    if (shader.colorAttrib !== -1) {
      gl.vertexAttribPointer(shader.colorAttrib, 4, gl.FLOAT, false,
                             byteStride, this._COLOR_BYTE_OFFSET);
      gl.enableVertexAttribArray(shader.colorAttrib);
    }
    if (shader.objIdAttrib !== -1) {
      gl.vertexAttribPointer(shader.objIdAttrib, 1, gl.FLOAT, false,
                             byteStride, this._OBJID_BYTE_OFFSET);
      gl.enableVertexAttribArray(shader.objIdAttrib);
    }
    if (shader.selectAttrib !== -1) {
      gl.vertexAttribPointer(shader.selectAttrib, 1, gl.FLOAT, false,
                             byteStride, this._SELECT_BYTE_OFFSET);
      gl.enableVertexAttribArray(shader.selectAttrib);
    }
  },

  releaseAttribs : function(shader) {
    var gl = this._gl;
    gl.disableVertexAttribArray(shader.posAttrib);
    if (shader.colorAttrib !== -1) {
      gl.disableVertexAttribArray(shader.colorAttrib);
    }
    if (shader.normalAttrib !== -1) {
      gl.disableVertexAttribArray(shader.normalAttrib);
    }
    if (shader.objIdAttrib !== -1) {
      gl.disableVertexAttribArray(shader.objIdAttrib);
    }
    if (shader.selectAttrib !== -1) {
      gl.disableVertexAttribArray(shader.selectAttrib);
    }
  },

  bind : function(shader) {
    this.bindBuffers();
    this.bindAttribs(shader);
  },

  // draws all triangles contained in the indexed vertex array using the 
  // provided shader. requires a call to bind() first.
  draw : function() {
    var gl = this._gl;
    gl.drawElements(gl.TRIANGLES, this._numTriangles * 3, gl.UNSIGNED_SHORT, 0);
  }
});

return IndexedVertexArray;

});
