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
    '../utils'
  ], 
  function(
    glMatrix, utils) {


"use strict";

var vec3 = glMatrix.vec3;

function AtomBase() {
}


AtomBase.prototype = {

  bondCount : function() { return this.bonds().length; },

  eachBond : function(callback) {
    var bonds = this.bonds();
    for (var i = 0, e = bonds.length; i < e; ++i) {
      callback(bonds[i]);
    }
  },

  isConnectedTo: function(otherAtom) {
    if (otherAtom === null) {
      return false;
    }
    var other = otherAtom.full();
    var me = this.full();
    var bonds = this.bonds();
    for (var i = 0, e = bonds.length; i < e; ++i) {
      var bond = bonds[i];
      if ((bond.atom_one() === me && bond.atom_two() === other) ||
          (bond.atom_one() === other && bond.atom_two() === me)) {
        return true;
      }
    }
    return false;
  },
};

function Atom(residue, name, pos, element, index, isHetatm,
              occupancy, tempFactor, serial) {
  AtomBase.call(this);
  this._properties = {};
  this._residue = residue;
  this._bonds = [];
  this._isHetatm = !!isHetatm;
  this._name = name;
  this._pos = pos;
  this._index = index;
  this._element = element;
  this._occupancy = occupancy !== undefined ? occupancy : null;
  this._tempFactor = tempFactor !== undefined ? tempFactor : null;
  this._serial = serial|0;
}

utils.derive(Atom, AtomBase, {
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
  pos : function() { return this._pos; },

  setPos : function(pos) { 
    vec3.copy(this._pos, pos); 
  },

  element : function() { return this._element; },
  index : function() { return this._index; },

  occupancy : function() { return this._occupancy; },

  tempFactor : function() { return this._tempFactor; },

  serial : function() { return this._serial; },

  isHetatm : function() { 
    return this._isHetatm; 
  },
  prop : function(propName) { 
    var fn = this[propName];
    if (fn !== undefined) {
      return fn.call(this);
    }
    var property = this._properties[propName];
    return property === undefined ? 0 : property;
  },

  setProp : function(propName, value) {
    this._properties[propName] = value;
  }
});

function AtomView(resView, atom) {
  AtomBase.call(this);
  this._resView = resView;
  this._atom = atom;
  this._bonds = [];
}


utils.derive(AtomView, AtomBase, {
  full : function() { return this._atom; },
  name : function() { return this._atom.name(); },
  pos : function() { return this._atom.pos(); },
  element : function() { return this._atom.element(); },
  residue : function() { return this._resView; },
  bonds : function() { return this._atom.bonds(); },
  index : function() { return this._atom.index(); },
  occupancy : function() { return this._atom.occupancy(); },
  tempFactor : function() { return this._atom.tempFactor(); },
  serial : function() { return this._atom.serial(); },
  qualifiedName : function() {
    return this._atom.qualifiedName();
  },
  isHetatm : function() {
    return this._atom.isHetatm();
  },
  prop : function(propName) { 
    return this._atom.prop(propName); 
  },
  setProp : function(propName, value) { 
    this._atom.setProp(propName, value); 
  }
});

return {
  Atom: Atom,
  AtomView : AtomView
};

});

