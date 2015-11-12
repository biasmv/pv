// Copyright (c) 2013-2015 Marco Biasini
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

define(
  [
    './gl-matrix', 
  ], 
  function(glMatrix) {

"use strict";

var vec3 = glMatrix.vec3;

function CoordGroup(structure) {
  this._structure = structure;
  this._frames = [];
}

CoordGroup.prototype = {
  addFrame : function(frame) {
    this._frames.push(frame);
  },
  useFrame : function(frameIndex) {
    var frame = this._frames[frameIndex];
    this._structure.eachAtom(function(atom, index) {
      var offset = index * 3;
      vec3.set(atom.pos(),  
               frame[offset + 0], frame[offset + 1], frame[offset + 2]);
    });
  },
};

function dcd(structure, data) {
  var cg = new CoordGroup(structure);
  var endianness = String.fromCharCode(data.getUint8(4)) +
                   String.fromCharCode(data.getUint8(5)) +
                   String.fromCharCode(data.getUint8(6)) +
                   String.fromCharCode(data.getUint8(7));
  // FIXME: error handling and different dcd variants. 
  // At the moment, this only works for a very small subset of files, I 
  // can't even tell you which ones.
  var swapBytes = endianness === 'DROC';
  var current = 92;
  var titleLength = data.getUint32(current, swapBytes);
  current += 4;
  var title = '';
  var i;
  for (i = 0; i < titleLength; ++i) {
    title += String.fromCharCode(data.getUint8(current));
    current += 1;
  }
  //var fAtomCount = data.getUint32(4 * 10, swapBytes);
  var numFrames = data.getUint32(4 * 2, swapBytes);
  var format = data.getUint32(4 * 21, swapBytes);
  var perFrameHeader = false;
  if (format !== 0) {
    perFrameHeader = data.getUint32(4 * 12, swapBytes) !== 0;
  }
  current += 8;
  var tAtomCount = data.getUint32(current, swapBytes);
  current += 8;

  // read individual frames
  for (i = 0; i < numFrames; ++i) {
    var frame = new Float32Array(3 * tAtomCount);
    if (perFrameHeader) {
      current += 56;
    }
    for (var k = 0; k < 3; ++k) {
      current += 4;
      for (var j = 0; j < tAtomCount ; ++j) {
        var value = data.getFloat32(current, swapBytes);
        frame[j * 3 + k] = value ;
        current += 4;
      }
      current += 4;
    }
    cg.addFrame(frame);
  }
  return cg;
}

function fetch(url, callback) {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", url, true);
  oReq.responseType = 'arraybuffer';
  oReq.onload = function() {
    if (oReq.response) {
      callback(new DataView(oReq.response));
    }
  };
  oReq.send(null);
}

function fetchDcd(url, structure, callback) {
  fetch(url, function(data) {
    var coordGroup = dcd(structure, data);
    callback(coordGroup);
  });
}

return {
  CoordGroup : CoordGroup,
  fetchDcd : fetchDcd,

};

});

