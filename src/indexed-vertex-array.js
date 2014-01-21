// Copyright (c) 2013 Marco Biasini
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

(function(exports) {
"use strict";

function IndexedVertexArray(gl, numVerts, numIndices, 
                            float32BufferPool, uint16BufferPool) {
  this._gl = gl;
  this._vertBuffer = gl.createBuffer();
  this._indexBuffer = gl.createBuffer();
  this._float32BufferPool = float32BufferPool || null;
  this._uint16BufferPool = uint16BufferPool || null;
  this._ready = false;
  this._numVerts = 0;
  this._maxVerts = numVerts;
  this._numTriangles = 0;
  var numFloats = this._FLOATS_PER_VERT * numVerts;
  if (this._float32BufferPool) {
    this._vertData = float32BufferPool.request(numFloats);
  } else {
    this._vertData = new Float32Array(numFloats);
  }
  if (this._uint16BufferPool) {
    this._indexData = uint16BufferPool.request(numIndices);
  } else {
    this._indexData = new Uint16Array(numIndices);
  }
}

IndexedVertexArray.prototype.destroy = function() {
  this._gl.deleteBuffer(this._vertBuffer);
  this._gl.deleteBuffer(this._indexBuffer);
  if (this._float32BufferPool) {
    this._float32BufferPool.release(this._vertData);
  } else {
    delete this._vertData;
  }
  if (this._uint16BufferPool) {
    this._uint16BufferPool.release(this._indexData);
  } else {
    delete this._indexData;
  }
};

IndexedVertexArray.prototype.numVerts = function() { return this._numVerts; };
IndexedVertexArray.prototype.maxVerts = function() { return this._maxVerts; };
IndexedVertexArray.prototype.numIndices = function() { return this._numTriangles * 3; };


IndexedVertexArray.prototype.setColor = function(index, r, g, b) {
  var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
  this._vertData[colorStart + 0] = r;
  this._vertData[colorStart + 1] = g;
  this._vertData[colorStart + 2] = b;
  this._ready = false;
};

IndexedVertexArray.prototype.addVertex = function(pos, normal, color, objId) {
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
  this._vertData[i++] = objId;
  this._numVerts += 1;
  this._ready = false;
};

IndexedVertexArray.prototype._FLOATS_PER_VERT = 10;
IndexedVertexArray.prototype._COLOR_OFFSET = 6;
IndexedVertexArray.prototype._POS_OFFSET = 0;
IndexedVertexArray.prototype._NORMAL_OFFSET = 3;

IndexedVertexArray.prototype.addTriangle = function(idx1, idx2, idx3) {
  var index = 3 * this._numTriangles;
  if (index >= this._indexData.length) {
    return;
  }
  this._indexData[index++] = idx1;
  this._indexData[index++] = idx2;
  this._indexData[index++] = idx3;
  this._numTriangles += 1;
  this._ready = false;
};

IndexedVertexArray.prototype.bindBuffers = function() {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
  this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
  if (this._ready) {
    return;
  }
  this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertData,
                      this._gl.STATIC_DRAW);
  this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, this._indexData,
                      this._gl.STATIC_DRAW);
  this._ready = true;
};

IndexedVertexArray.prototype.bindAttribs = function(shader) {
  this._gl.enableVertexAttribArray(shader.posAttrib);
  this._gl.vertexAttribPointer(shader.posAttrib, 3, this._gl.FLOAT, false,
                               this._FLOATS_PER_VERT * 4, this._POS_OFFSET * 4);

  if (shader.normalAttrib !== -1) {
    this._gl.enableVertexAttribArray(shader.normalAttrib);
    this._gl.vertexAttribPointer(shader.normalAttrib, 3, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._NORMAL_OFFSET * 4);
  }

  if (shader.colorAttrib !== -1) {
    this._gl.vertexAttribPointer(shader.colorAttrib, 3, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._COLOR_OFFSET * 4);
    this._gl.enableVertexAttribArray(shader.colorAttrib);
  }
  if (shader.objIdAttrib !== -1) {
    this._gl.vertexAttribPointer(shader.objIdAttrib, 1, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4, 9 * 4);
    this._gl.enableVertexAttribArray(shader.objIdAttrib);
  }
};

IndexedVertexArray.prototype.releaseAttribs = function(shader) {

  this._gl.disableVertexAttribArray(shader.posAttrib);
  if (shader.colorAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.colorAttrib);
  }
  if (shader.normalAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.normalAttrib);
  }
  if (shader.objIdAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.objIdAttrib);
  }
};

// draws all triangles contained in the indexed vertex array using the provided
// shader.
IndexedVertexArray.prototype.draw = function(shader) {
  this.bindBuffers();
  this.bindAttribs(shader);
  this._gl.drawElements(this._gl.TRIANGLES, this._numTriangles * 3,
                        this._gl.UNSIGNED_SHORT, 0);
  this.releaseAttribs(shader);
};

exports.IndexedVertexArray = IndexedVertexArray;

return true;
})(this);
