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

define(['gl-matrix', 'utils', './atom'], 
       function(glMatrix, utils, atom) {

"use strict";

var vec3 = glMatrix.vec3;
var Atom = atom.Atom;
var AtomView = atom.AtomView;

function ResidueBase() {

}

ResidueBase.prototype = {

  prop : function(propName) { 
    return this[propName]();
  },

  isWater : function() {
    return this.name() === 'HOH' || this.name() === 'DOD';
  },

  eachAtom : function(callback, index) {
    index |= 0;
    for (var i =0; i< this._atoms.length; i+=1) {
      if (callback(this._atoms[i], index) === false) {
        return false;
      }
      index +=1;
    }
    return index;
  },

  qualifiedName : function() {
    var name =  this.chain().name() + '.' + this.name() + this.num();
    if (this.insCode() === '\0') {
      return name;
    }
    return name + this.insCode();
  },

  atom : function(index_or_name) { 
    if (typeof index_or_name === 'string') {
      for (var i =0; i < this._atoms.length; ++i) {
        if (this._atoms[i].name() === index_or_name) {
          return this._atoms[i];
        }
      }
      return null;
    }
    if (index_or_name >= this._atoms.length && index_or_name < 0) {
      return null;
    }
    return this._atoms[index_or_name]; 
  },

  // CA for amino acids, P for nucleotides, nucleosides
  centralAtom : function() {
    if (this.isAminoacid()) {
      return this.atom('CA');
    }
    if (this.isNucleotide()) {
      return this.atom('C3\'');
    }
    return null;
  },


  center : function() {
    var count = 0;
    var c = vec3.create();
    this.eachAtom(function(atom) {
      vec3.add(c, c, atom.pos());
      count += 1;
    });
    if (count > 0) {
      vec3.scale(c, c, 1.0/count);
    }
    return c;
  },

  isAminoacid : function() { 
    return this._isAminoacid;
  },

  isNucleotide : function() { 
    return this._isNucleotide;
  }
};

function Residue(chain, name, num, insCode) {
  ResidueBase.call(this);
  this._name = name;
  this._num = num;
  this._insCode = insCode;
  this._atoms = [];
  this._ss = 'C';
  this._chain = chain;
  this._isAminoacid = false;
  this._isNucleotide = false;
  this._index = chain.residues().length;
}

utils.derive(Residue, ResidueBase, {
  _deduceType : function() {
    this._isNucleotide = this.atom('P')!== null && this.atom('C3\'') !== null;
    this._isAminoacid = this.atom('N') !== null && this.atom('CA') !== null && 
                        this.atom('C') !== null && this.atom('O') !== null;
  },

  name : function() { return this._name; },
  insCode : function() { return this._insCode; },

  num : function() { return this._num; },

  full : function() { return this; },

  addAtom : function(name, pos, element, isHetatm, occupancy, tempFactor) {
    var atom = new Atom(this, name, pos, element, 
                        this.structure().nextAtomIndex(), 
                        isHetatm, occupancy, tempFactor);
    this._atoms.push(atom);
    return atom;
  },

  ss : function() { return this._ss; },
  setSS : function(ss) { this._ss = ss; },
  index : function() { return this._index; },

  atoms : function() { return this._atoms; },
  chain : function() { return this._chain; },


  structure : function() { 
    return this._chain.structure(); 
  }

});

function ResidueView(chainView, residue) {
  ResidueBase.call(this);
  this._chainView = chainView;
  this._atoms = [];
  this._residue = residue;
}


utils.derive(ResidueView, ResidueBase, {
  addAtom : function(atom) {
    var atomView = new AtomView(this, atom.full());
    this._atoms.push(atomView);
  },

  full : function() { return this._residue; },
  num : function() { return this._residue.num(); },

  insCode : function() { 
    return this._residue.insCode(); 
  },
  ss : function() { return this._residue.ss(); },
  index : function() { return this._residue.index(); },
  chain : function() { return this._chainView; },
  name : function() { return this._residue.name(); },

  atoms : function() { return this._atoms; },
  qualifiedName : function() {
    return this._residue.qualifiedName();
  },

  containsResidue : function(residue) {
    return this._residue.full() === residue.full();
  },
  isAminoacid : function() { 
    return this._residue.isAminoacid(); 
  },
  isNucleotide : function() { 
    return this._residue.isNucleotide(); 
  },
  isWater : function() { 
    return this._residue.isWater(); 
  }
});

return {
  ResidueView : ResidueView,
  Residue : Residue
};

});

