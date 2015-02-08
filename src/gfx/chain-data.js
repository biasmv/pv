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
    './vertex-array', 
    './indexed-vertex-array'
  ], 
  function(
    utils, 
    VertexArray, 
    IndexedVertexArray) {

"use strict";

// LineChainData and MeshChainData are two internal classes that add molecule-
// specific attributes and functionality to the IndexedVertexArray and 
// VertexArray classes.
function LineChainData(chain, gl, numVerts, float32Allocator) {
  VertexArray.call(this, gl, numVerts, float32Allocator);
  this._chain = chain;
}

utils.derive(LineChainData, VertexArray, {
  chain : function() { return this._chain; },

  drawSymmetryRelated : function(cam, shader, transforms) {
    this.bind(shader);
    for (var i = 0; i < transforms.length; ++i) {
      cam.bind(shader, transforms[i]);
      this._gl.uniform1i(shader.symId, i);
      this.draw();
    }
    this.releaseAttribs(shader);
  }
});

function MeshChainData(chain, gl, numVerts, numIndices, float32Allocator, 
                       uint16Allocator) {
  IndexedVertexArray.call(this, gl, numVerts, numIndices, 
                          float32Allocator, uint16Allocator);
  this._chain = chain;
}

utils.derive(MeshChainData, IndexedVertexArray, {
  chain : function() { return this._chain; }
});

MeshChainData.prototype.drawSymmetryRelated = 
  LineChainData.prototype.drawSymmetryRelated;


return {
  LineChainData : LineChainData,
  MeshChainData : MeshChainData
};

});

