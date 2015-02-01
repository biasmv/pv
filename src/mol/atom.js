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

define(['gl-matrix', 'core'], function(glMatrix, core) {

"use strict";

var vec3 = glMatrix.vec3;
var mat3 = glMatrix.mat3;

function AtomBase() {
}


AtomBase.prototype = {
  name : function() { return this._name; },
  pos : function() { return this._pos; },
  element : function() { return this._element; },
  index : function() { return this._index; },

  prop : function(propName) { 
    return this[propName]();
  },

  bondCount : function() { return this.bonds().length; },

  eachBond : function(callback) {
    var bonds = this.bonds();
    for (var i = 0, e = bonds.length; i < e; ++i) {
      callback(bonds[i]);
    }
  }
};

function Atom(residue, name, pos, element, index, isHetatm) {
  AtomBase.call(this);
  this._residue = residue;
  this._bonds = [];
  this._isHetatm = !!isHetatm;
  this._name = name;
  this._pos = pos;
  this._index = index;
  this._element = element;
}

core.derive(Atom, AtomBase, {
  addBond : function(bond) { 
    this._bonds.push(bond); 
  },
  name : function() { return this._name; },
  bonds : function() { return this._bonds; },
  residue : function() { return this._residue; },
  structure : function() { return this._residue.structure(); },
  full : function() { return this; },
  qualifiedName : function() {
    return this.residue().qualifiedName()+'.'+this.name();
  },
  isHetatm : function() { 
    return this._isHetatm; 
  },
});

function AtomView(resView, atom) {
  AtomBase.call(this);
  this._resView = resView;
  this._atom = atom;
  this._bonds = [];
}


core.derive(AtomView, AtomBase, {
  full : function() { return this._atom; },
  name : function() { return this._atom.name(); },
  pos : function() { return this._atom.pos(); },
  element : function() { return this._atom.element(); },
  residue : function() { return this._resView; },
  bonds : function() { return this._atom.bonds(); },
  index : function() { return this._atom.index(); },
  qualifiedName : function() {
    return this._atom.qualifiedName();
  },
  isHetatm : function() {
    return this._atom.isHetatm();
  }
});

return {
  Atom: Atom,
  AtomView : AtomView
};

});

