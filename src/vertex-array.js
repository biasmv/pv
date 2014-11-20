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
  VertexArrayBase.prototype.constructor.call(this, gl, numVerts, 
                                             float32Allocator);
  this._numLines = 0;
}

derive(VertexArray, VertexArrayBase);

VertexArray.prototype._FLOATS_PER_VERT = 8;
VertexArray.prototype._POS_OFFSET = 0;
VertexArray.prototype._COLOR_OFFSET = 3;
VertexArray.prototype._ID_OFFSET = 7;

VertexArray.prototype.numVerts = function() { return this._numLines * 2; };

VertexArray.prototype.addLine = function(startPos, startColor, endPos, 
                                         endColor, idOne, idTwo) {
  var index = this._FLOATS_PER_VERT * this._numLines * 2;
  this._vertData[index++] = startPos[0];
  this._vertData[index++] = startPos[1];
  this._vertData[index++] = startPos[2];
  this._vertData[index++] = startColor[0];
  this._vertData[index++] = startColor[1];
  this._vertData[index++] = startColor[2];
  this._vertData[index++] = startColor[3];
  this._vertData[index++] = idOne;
  this._vertData[index++] = endPos[0];
  this._vertData[index++] = endPos[1];
  this._vertData[index++] = endPos[2];
  this._vertData[index++] = endColor[0];
  this._vertData[index++] = endColor[1];
  this._vertData[index++] = endColor[2];
  this._vertData[index++] = endColor[3];
  this._vertData[index++] = idTwo;

  this._numLines += 1;
  this._ready = false;
  this._boundingSpehre = null;
};


VertexArray.prototype.bindAttribs = function(shader) {
  this._gl.vertexAttribPointer(shader.posAttrib, 3, this._gl.FLOAT, false,
                                this._FLOATS_PER_VERT * 4,
                                this._POS_OFFSET * 4);
  if (shader.colorAttrib !== -1) {
    this._gl.vertexAttribPointer(shader.colorAttrib, 4, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._COLOR_OFFSET * 4);
    this._gl.enableVertexAttribArray(shader.colorAttrib);
  }
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
  if (shader.colorAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.colorAttrib); }
  if (shader.objIdAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.objIdAttrib);
  }
};

VertexArray.prototype.bind = function(shader) {
  this.bindBuffers();
  this.bindAttribs(shader);
};

// draws all triangles contained in the indexed vertex array using the provided
// shader.
VertexArray.prototype.draw = function(symId) {
  this._gl.drawArrays(this._gl.LINES, 0, this._numLines * 2);
};



exports.VertexArray = VertexArray;

return true;
})(this);
