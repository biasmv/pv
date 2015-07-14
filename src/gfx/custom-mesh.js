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
    '../utils', 
    '../color', 
    '../geom', 
    './geom-builders', 
    './indexed-vertex-array', 
    './scene-node'
  ], 
  function(
    glMatrix, 
    utils, 
    color, 
    geom, 
    gb, 
    IndexedVertexArray, 
    SceneNode) {

"use strict";

var vec3 = glMatrix.vec3;
var mat3 = glMatrix.mat3;

var forceRGB = color.forceRGB;


// number of ids to be allocated whenever we run out of objects. This would 
// ideally depend on number of objects the user is going to create.
var ID_CHUNK_SIZE = 100;

// small helper with the same interface as IndexedVertexArray that can be used 
// as a drop-in when the number of vertices/indices is not known in advance.
function DynamicIndexedVertexArray() {
  this._vertData = [];
  this._indexData = [];
  this._numVerts = 0;
}

DynamicIndexedVertexArray.prototype = {
  numVerts : function() {
    return this._numVerts;
  },
  addVertex : function(pos, normal, color, objId) {
    this._numVerts += 1;
    this._vertData.push(pos[0], pos[1], pos[2], 
                        normal[0], normal[1], normal[2], 
                        color[0], color[1], color[2], color[3], 
                        objId, 0.0);
  },
  addTriangle : function(indexOne, indexTwo, indexThree) {
    this._indexData.push(indexOne, indexTwo, indexThree);
  },
  numIndices : function() {
    return this._indexData.length;
  },
  indexData : function() {
    return this._indexData;
  },
  vertData : function() {
    return this._vertData;
  }
};

function CustomMesh(name, gl, float32Allocator, uint16Allocator, idPool) {
  SceneNode.call(this, gl);
  this._float32Allocator = float32Allocator;
  this._uint16Allocator = uint16Allocator;
  this._data = new DynamicIndexedVertexArray();
  this._protoSphere = new gb.ProtoSphere(8, 8);
  this._protoCyl = new gb.ProtoCylinder(8);
  this._va = null;
  this._idRanges = [];
  this._idPool = idPool;
  this._ready = false;
  this._currentRange = null;
}

// FIXME: these are duplicated from render.js and should be moved to a 
// common module
function capTubeStart(va, baseIndex, numTubeVerts) {
  for (var i = 0; i < numTubeVerts - 1; ++i) {
    va.addTriangle(baseIndex, baseIndex + 1 + i, baseIndex + 2 + i);
  }
  va.addTriangle(baseIndex, baseIndex + numTubeVerts, baseIndex + 1);
}

function capTubeEnd(va, baseIndex, numTubeVerts) {
  var center = baseIndex + numTubeVerts;
  for (var i = 0; i < numTubeVerts - 1; ++i) {
    va.addTriangle(center, baseIndex + i + 1, baseIndex + i);
  }
  va.addTriangle(center, baseIndex, baseIndex + numTubeVerts - 1);
}

utils.derive(CustomMesh, SceneNode, {
  updateProjectionIntervals : function() {},
  updateSquaredSphereRadius : function(center, radius) { 
    return radius;
  },

  addTube : (function() {
    var midPoint = vec3.create();
    var left = vec3.create();
    var up = vec3.create();
    var dir = vec3.create();
    var rotation = mat3.create();
    return function(start, end, radius, options) {
      options = options || {};
      var color = forceRGB(options.color || 'white');
      var cap = true;
      if (options.cap !== undefined) {
        cap = options.cap;
      }
      vec3.sub(dir, end, start);
      var length = vec3.length(dir);
      vec3.normalize(dir, dir);
      vec3.add(midPoint, start, end);
      vec3.scale(midPoint, midPoint, 0.5);
      geom.buildRotation(rotation, dir, left, up, false);
      if (cap) {
        var startIndex = this._data.numVerts();
        this._data.addVertex(start, [-dir[0], -dir[1], -dir[2]], color, 0);
        capTubeStart(this._data, startIndex, 8);
      }
      var userData = options.userData !== undefined ? options.userData : null;
      console.log(userData);
      var objectId = this._nextObjectId({
        center : midPoint,
        userData : userData,
        geom : this
      });
      this._protoCyl.addTransformed(this._data, midPoint, length, radius, 
                                    rotation, color, color, objectId, objectId);
      if (cap) {
        var baseIndex = this._data.numVerts();
        this._data.addVertex(end, dir, color, 0);
        capTubeEnd(this._data, baseIndex - 8, 8);
      }
      this._ready = false;
    };
  })(),
  _nextObjectId : function(data) {
    // because we have no idea how many different objects the user will 
    // create we will just allocate the object ids in chunks of 
    // ID_CHUNK_SIZE
    if (!this._currentRange || !this._currentRange.hasLeft()) {
      this._currentRange = this._idPool.getContinuousRange(ID_CHUNK_SIZE);
      this._idRanges.push(this._currentRange);
    }
    return this._currentRange.nextId(data);
  },
  destroy : function() {
    SceneNode.prototype.destroy.call(this);
    for (var i = 0; i < this._idRanges.length; ++i) {
      this._idRanges[i].recycle();
    }
  },

  addSphere : function(center, radius, options) {
    options = options || {};
    var color = forceRGB(options.color || 'white');
    var userData = options.userData !== undefined ? options.userData : null;
    var objectId = this._nextObjectId({
      center : center,
      userData : userData,
      geom : this
    });
    this._protoSphere.addTransformed(this._data, center, radius, 
                                     color, objectId);
    this._ready = false;
  },
  _prepareVertexArray : function() {
    this._ready = true;
    if (this._va !== null) {
      this._va.destroy();
    }
    this._va = new IndexedVertexArray(this._gl, this._data.numVerts(), 
                                      this._data.numIndices(), 
                                      this._float32Allocator, 
                                      this._uint16Allocator);
    // FIXME: find a better way to do this
    this._va.setIndexData(this._data.indexData());
    this._va.setVertData(this._data.vertData());
  },

  draw : function(cam, shaderCatalog, style, pass) {
    if (!this._visible) {
      return;
    }
    if (!this._ready) {
      this._prepareVertexArray();
    }
    var shader = this.shaderForStyleAndPass(shaderCatalog, style, pass);
    if (!shader) {
      return;
    }
    cam.bind(shader);
    this._gl.uniform1i(shader.symId, 255);
    var va = this._va;
    va.bind(shader);
    va.draw();
    va.releaseAttribs(shader);
  },
  shaderForStyleAndPass : function(shaderCatalog, style, pass) {
    if (pass === 'normal') {
      if (style === 'hemilight') {
        return shaderCatalog.hemilight;
      } else {
        return shaderCatalog.phong;
      }
    }
    if (pass === 'select') {
      return shaderCatalog.select;
    }
    if (pass === 'outline') {
      return shaderCatalog.outline;
    }
    var shader = shaderCatalog[pass];
    return shader !== undefined ? shader : null;
  },
});

return CustomMesh;

});

