// Copyright (c) 2013-2014 Marco Biasini
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

// (unindexed) vertex array for line-based geometries
function VertexArray(gl, numVerts, float32Allocator)  {
  this._gl = gl;
  this._vertBuffer = gl.createBuffer();
  this._float32Allocator = float32Allocator || null;
  this._ready = false;
  this._numLines = 0;
  var numFloats = this._FLOATS_PER_VERT * numVerts;
    this._vertData = float32Allocator.request(numFloats);
}

VertexArray.prototype._FLOATS_PER_VERT = 7;
VertexArray.prototype._POS_OFFSET = 0;
VertexArray.prototype._COLOR_OFFSET = 3;
VertexArray.prototype._ID_OFFSET = 6;

VertexArray.prototype.destroy = function() {
  this._gl.deleteBuffer(this._vertBuffer);
    this._float32Allocator.release(this._vertData);
};

VertexArray.prototype.numVerts = function() { return this._numLines * 2; };

VertexArray.prototype.setColor = function(index, r, g, b) {
  var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
  this._vertData[colorStart + 0] = r;
  this._vertData[colorStart + 1] = g;
  this._vertData[colorStart + 2] = b;
  this._ready = false;
};

VertexArray.prototype.addLine = function(startPos, startColor, endPos, 
                                         endColor, idOne, idTwo) {
  var index = this._FLOATS_PER_VERT * this._numLines * 2;
  this._vertData[index++] = startPos[0];
  this._vertData[index++] = startPos[1];
  this._vertData[index++] = startPos[2];
  this._vertData[index++] = startColor[0];
  this._vertData[index++] = startColor[1];
  this._vertData[index++] = startColor[2];
  this._vertData[index++] = idOne;
  this._vertData[index++] = endPos[0];
  this._vertData[index++] = endPos[1];
  this._vertData[index++] = endPos[2];
  this._vertData[index++] = endColor[0];
  this._vertData[index++] = endColor[1];
  this._vertData[index++] = endColor[2];
  this._vertData[index++] = idTwo;

  this._numLines += 1;
  this._ready = false;
};

VertexArray.prototype.bindBuffers = function() {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
  if (this._ready) {
    return;
  }
  this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertData,
                      this._gl.STATIC_DRAW);
  this._ready = true;
};

VertexArray.prototype.bindAttribs = function(shader) {
  this._gl.vertexAttribPointer(shader.posAttrib, 3, this._gl.FLOAT, false,
                                this._FLOATS_PER_VERT * 4,
                                this._POS_OFFSET * 4);
  this._gl.vertexAttribPointer(shader.colorAttrib, 3, this._gl.FLOAT, false,
                                this._FLOATS_PER_VERT * 4,
                                this._COLOR_OFFSET * 4);
  this._gl.enableVertexAttribArray(shader.colorAttrib);
  this._gl.enableVertexAttribArray(shader.posAttrib);
  if (shader.objIdAttrib !== -1) {
    this._gl.vertexAttribPointer(shader.objIdAttrib, 1, this._gl.FLOAT, false,
                                  this._FLOATS_PER_VERT * 4,
                                  this._ID_OFFSET * 4);
    this._gl.enableVertexAttribArray(shader.objIdAttrib);
  }
};

VertexArray.prototype.releaseAttribs = function(shader) {
  this._gl.disableVertexAttribArray(shader.posAttrib);
  this._gl.disableVertexAttribArray(shader.colorAttrib);
  if (shader.objIdAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.objIdAttrib);
  }
};

// draws all triangles contained in the indexed vertex array using the provided
// shader.
VertexArray.prototype.draw = function(shader) {
  this.bindBuffers();
  this.bindAttribs(shader);
  this._gl.drawArrays(this._gl.LINES, 0, this._numLines * 2);
  this.releaseAttribs(shader);
};


VertexArray.prototype.updateProjectionIntervals = 
    function(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
  updateProjectionIntervalsForBuffer(
      xAxis, yAxis, zAxis, this._vertData, this._FLOATS_PER_VERT,
      this._numLines * 2, xInterval, yInterval, zInterval);
};
exports.VertexArray = VertexArray;

return true;
})(this);
