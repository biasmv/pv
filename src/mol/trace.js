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
    '../gl-matrix', 
    '../geom'
  ], 
  function(
    glMatrix, geom) {

"use strict";

var vec3 = glMatrix.vec3;

function BackboneTrace() { this._trace = []; }

BackboneTrace.prototype = {
  push : function(residue) {
    this._trace.push(residue);
  },

  length : function() {
    return this._trace.length;
  },

  residueAt : function(index) {
    return this._trace[index];
  },

  posAt : function(out, index) {
    vec3.copy(out, this._trace[index].centralAtom().pos());
    return out;
  },

  normalAt : function(out, index) {
    var residue = this._trace[index];
    if (residue.isAminoacid()) {
      vec3.sub(out, residue.atom('O').pos(), residue.atom('C').pos());
    }
    vec3.normalize(out, out);
    return out;
  },

  centralAtomAt : function(index) {
    return this._trace[index].centralAtom();
  },

  tangentAt : (function() {
    var posBefore = vec3.create();
    var posAfter = vec3.create();
    return function(out, index) {
      if (index > 0) { 
        this.posAt(posBefore, index - 1);
      } else {
        this.posAt(posBefore, index);
      }
      if (index < this._trace.length-1) {
        this.posAt(posAfter, index + 1);
      } else {
        this.posAt(posAfter, index);
      }
      vec3.sub(out, posAfter, posBefore);
    };
  })(),

  fullTraceIndex : function(index) {
    return index;
  },

  residues: function() { return this._trace; },

  subsets : function(residues) {
    // we assume that the residue list is ordered from N- to C-
    // terminus and we can traverse it in one go.
    var fullTraceIdx = 0, listIdx = 0;
    var subsets = [];
    while (listIdx < residues.length && fullTraceIdx < this._trace.length) {
      // increase pointer until the residue indices match.
      var residueIndex = residues[listIdx].full().index();
      while (this._trace.length > fullTraceIdx &&
             this._trace[fullTraceIdx].index() < residueIndex) {
        ++fullTraceIdx;
      }
      if (fullTraceIdx >= this._trace.length) {
        break;
      }
      var traceIndex = this._trace[fullTraceIdx].index();
      while (residues.length > listIdx &&
            residues[listIdx].full().index() < traceIndex) {
        ++listIdx;
      }
      if (listIdx >= residues.length) {
        break;
      }
      var fullTraceBegin = fullTraceIdx;
      while (residues.length > listIdx && this._trace.length > fullTraceIdx &&
             residues[listIdx].full().index() ===
                this._trace[fullTraceIdx].index()) {
        ++listIdx;
        ++fullTraceIdx;
      }
      var fullTraceEnd = fullTraceIdx;
      subsets.push(new TraceSubset(this, fullTraceBegin, fullTraceEnd));
    }
    return subsets;
  }
};

// nothing needs to be done for the backbone trace.
BackboneTrace.prototype.smoothPosAt = BackboneTrace.prototype.posAt;
BackboneTrace.prototype.smoothNormalAt = BackboneTrace.prototype.normalAt;

// a trace subset, e.g. the part of a trace contained in a view. End regions
// are handled automatically depending on whether the beginning/end of the
// trace subset coincides with the C- and N-terminus of the full trace.
function TraceSubset(fullTrace, fullTraceBegin, fullTraceEnd) {
  this._fullTrace = fullTrace;
  this._fullTraceBegin = fullTraceBegin;
  this._fullTraceEnd = fullTraceEnd;
  this._isNTerminal = this._fullTraceBegin === 0;
  this._isCTerminal = this._fullTrace.length() === this._fullTraceEnd;
  var length = this._fullTraceEnd - this._fullTraceBegin;
  if (!this._isCTerminal) {
    ++length;
  }
  if (!this._isNTerminal) {
    ++length;
    this._fullTraceBegin -= 1;
  }
  this._length = length;
}


TraceSubset.prototype = {
  length : function() {
    return this._length;
  },
  residueAt : function(index) {
    return this._fullTrace.residueAt(this._fullTraceBegin + index);
  },

  residues: function() { 
    var residues = [];
    for (var i = 0; i < this._length; ++i) {
      residues.push(this.residueAt(i));
    }
    return residues;
  },

  _interpolate : (function() {
    var tangentOne = vec3.create();
    var tangentTwo = vec3.create();
    return function(out, indexOne, indexTwo, strength) {
      this.tangentAt(tangentOne, indexOne);
    this.tangentAt(tangentTwo, indexTwo);
    vec3.scale(tangentOne, tangentOne, strength);
    vec3.scale(tangentTwo, tangentTwo, strength);
    geom.cubicHermiteInterpolate(out, this.centralAtomAt(indexOne).pos(),
                                tangentOne, this.centralAtomAt(indexTwo).pos(),
                                tangentTwo, 0.5, 0);
    return out;
    };
  })(),

  // like posAt, but interpolates the position for the ends with a Catmull-Rom
  // spline.
  smoothPosAt : (function() {
    return function(out, index, strength) {
      if (index === 0 && !this._isNTerminal) {
        return this._interpolate(out, index, index + 1, strength);
      }
      if (index === this._length-1 && !this._isCTerminal) {
        return this._interpolate(out, index - 1, index, strength);
      }
      var atom = this.centralAtomAt(index);
      vec3.copy(out, atom.pos()); 
      return out;
    };
  })(),


  smoothNormalAt : (function() {
    return function(out, index) {
      this._fullTrace.normalAt(out, index + this._fullTraceBegin);
      return out;
    };
  })(),

  posAt : function(out, index) {
    var atom = this.centralAtomAt(index);
    var atom2 = null;
    vec3.copy(out, atom.pos());
    if (index === 0 && !this._isNTerminal) {
      atom2 = this.centralAtomAt(index + 1);
      vec3.add(out, out, atom2.pos());
      vec3.scale(out, out, 0.5);
    }
    if (index === this._length - 1 && !this._isCTerminal) {
      atom2 = this.centralAtomAt(index - 1);
      vec3.add(out, out, atom2.pos());
      vec3.scale(out, out, 0.5);
    }
    return out;
  },

  centralAtomAt : function(index) {
    return this.residueAt(index).centralAtom();
  },

  fullTraceIndex : function(index) {
    return this._fullTraceBegin + index;
  },
  tangentAt : function(out, index) {
    return this._fullTrace.tangentAt(out, index + this._fullTraceBegin);
  },
};

return {
  TraceSubset : TraceSubset,
  BackboneTrace : BackboneTrace
};

});

