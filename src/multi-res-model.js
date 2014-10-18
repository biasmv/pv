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
//
(function(exports) {
"use strict";

function LowResModel() {
  this._chains = [];
}

LowResModel.prototype.addChain = function(name) {
  var chain = new LowResChain(name);
  this._chains.push(chain);
  return chain;
};


LowResModel.prototype.chains = function() {
  return this._chains;
};

function LowResChain(name) {
  this._name = name;
  this._traces = [];
}


LowResChain.prototype.name = function() {
  return this._name;
};

LowResChain.prototype.backboneTraces = function() {
  return this._traces;
};


LowResModel.prototype.eachChain = function(callback) {
  for (var i = 0; i < this._chains.length; ++i) {
    callback(this._chains[i]);
  }
};


LowResChain.prototype.addTrace = function() {
  var trace = new LowResTrace();
  this._traces.push(trace);
  return trace;
};

LowResChain.prototype.center = (function() {
    var pos = vec3.create();
    return function() {
    var center = vec3.create();
    var count = 0;
    for (var i = 0; i < this._traces.length; ++i) {
      var trace = this._traces[i];
      for (var j = 0; j < trace.length(); ++j) {
          vec3.add(center, center, trace.posAt(pos, j));
          count += 1;
      }
    }
    vec3.scale(center, center, 1.0/(count > 0 ? count : 1));
    return center;
  };
})();


function LowResTrace() {
  this._residues = [];
}


LowResTrace.prototype.length = function() { 
  return this._residues.length; 
};

LowResTrace.prototype.residueAt = function(index) {
  return this._residues[index];
};

LowResTrace.prototype.posAt = function(out, index) {
  var pos = this._residues[index].centralPos();
  out[0] = pos[0];
  out[1] = pos[1];
  out[2] = pos[2];
  return out;
};

LowResTrace.prototype.centralAtomAt = function(index) {
  return null;
};


LowResTrace.prototype.addHelix = function(startPos, endPos) {
  var start = new LowResResidue('H', startPos);
  var end = new LowResResidue('H', endPos);
  this._residues.push(start);
  this._residues.push(end);
};

LowResTrace.prototype.addStrand = function(startPos, endPos) {
  var start = new LowResResidue('E', startPos);
  var end = new LowResResidue('E', endPos);
  this._residues.push(start);
  this._residues.push(end);
};

LowResTrace.prototype.addCoil = function(positions) {
  for (var i = 0; i < positions.length; ++i) {
    this.addCoilresidue(positions[i]);
  }
};

LowResTrace.prototype.addCoilResidue = function(position) {
  var residue = new LowResResidue('C', position);
  this._residues.push(residue);
};

function LowResResidue(ssType, centralPos) {
  this._centralPos = centralPos;
  this._ss = ssType;
}

LowResResidue.prototype.centralPos = function() {
  return this._centralPos;
};

LowResResidue.prototype.ss = function() {
  return this._ss;
};


exports.LowResModel = LowResModel;

})(this);
