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

define(['gl-matrix', 'utils', '../geom', './chain', './bond', './select'], 
       function(glMatrix, utils, geom, chain, bond, select) {

"use strict";

var vec3 = glMatrix.vec3;

var Chain = chain.Chain;
var ChainView = chain.ChainView;
var Bond = bond.Bond;

// atom covalent radii by element derived from Cambrige Structural Database. 
// Source: http://profmokeur.ca/chemistry/covalent_radii.htm
var ELEMENT_COVALENT_RADII = {
 H : 0.31, HE : 0.28, LI : 1.28, BE : 0.96,  B : 0.84,  C : 0.76,  N : 0.71, 
 O : 0.66,  F : 0.57, NE : 0.58, NA : 1.66, MG : 1.41, AL : 1.21, SI : 1.11, 
 P : 1.07,  S : 1.05, CL : 1.02, AR : 1.06,  K : 2.03, CA : 1.76, SC : 1.70, 
TI : 1.60,  V : 1.53, CR : 1.39, MN : 1.39, FE : 1.32, CO : 1.26, NI : 1.24, 
CU : 1.32, ZN : 1.22, GA : 1.22, GE : 1.20, AS : 1.19, SE : 1.20, BR : 1.20, 
KR : 1.16, RB : 2.20, SR : 1.95,  Y : 1.90, ZR : 1.75, NB : 1.64, MO : 1.54, 
TC : 1.47, RU : 1.46, RH : 1.42, PD : 1.39, AG : 1.45, CD : 1.44, IN : 1.42, 
SN : 1.39, SB : 1.39, TE : 1.38,  I : 1.39, XE : 1.40, CS : 2.44, BA : 2.15, 
LA : 2.07, CE : 2.04, PR : 2.03, ND : 2.01, PM : 1.99, SM : 1.98, EU : 1.98, 
GD : 1.96, TB : 1.94, DY : 1.92, HO : 1.92, ER : 1.89, TM : 1.90, YB : 1.87, 
LU : 1.87, HF : 1.75, TA : 1.70,  W : 1.62, RE : 1.51, OS : 1.44, IR : 1.41, 
PT : 1.36, AU : 1.36, HG : 1.32, TL : 1.45, PB : 1.46, BI : 1.48, PO : 1.40, 
AT : 1.50, RN : 1.50, FR : 2.60, RA : 2.21, AC : 2.15, TH : 2.06, PA : 2.00, 
 U : 1.96, NP : 1.90, PU : 1.87, AM : 1.80, CM : 1.69
};

function covalentRadius(ele) {
  var r = ELEMENT_COVALENT_RADII[ele.toUpperCase()];
  if (r !== undefined) {
    return r;
  }
  return 1.5;
}

function connectPeptides(structure, left, right) {
  var cAtom = left.atom('C');
  var nAtom = right.atom('N');
  if (cAtom && nAtom) {
    var sqrDist = vec3.sqrDist(cAtom.pos(), nAtom.pos());
    if (sqrDist < 1.6*1.6) {
      structure.connect(nAtom, cAtom);
    }
  } 
}

function connectNucleotides(structure, left, right) {
  var o3Prime = left.atom('O3\'');
  var pAtom = right.atom('P');
  if (o3Prime && pAtom) {
    var sqrDist = vec3.sqrDist(o3Prime.pos(), pAtom.pos());
    // FIXME: make sure 1.7 is a good threshold here...
    if (sqrDist < 1.7*1.7) {
      structure.connect(o3Prime, pAtom);
    }
  }
}

function MolBase() {
}

MolBase.prototype = {
  eachResidue : function(callback) {
    for (var i = 0; i < this._chains.length; i+=1) {
      if (this._chains[i].eachResidue(callback) === false) {
        return false;
      }
    }
  },

  eachAtom : function(callback, index) {
    index |= 0;
    for (var i = 0; i < this._chains.length; i+=1) {
      index = this._chains[i].eachAtom(callback, index);
      if (index === false) {
        return false;
      }
    }
  },

  residueCount : function () {
    var chains = this.chains();
    var count = 0;
    for (var ci = 0; ci < chains.length; ++ci) {
      count += chains[ci].residues().length;
    }
    return count;
  },

  eachChain : function(callback) {
    var chains = this.chains();
    for (var i = 0; i < chains.length; ++i) {
      if (callback(chains[i]) === false) {
        return;
      }
    }
  },

  atomCount : function() {
    var chains = this.chains();
    var count = 0;
    for (var ci = 0; ci < chains.length; ++ci) {
      count += chains[ci].atomCount();
    }
    return count;
  },

  atoms : function() {
    var atoms = [];
    this.eachAtom(function(atom) { atoms.push(atom); });
    return atoms;
  },

  atom : function(name) {
    var parts = name.split('.');
    var chain = this.chain(parts[0]);
    if (chain === null) {
      return null;
    }
    var residue = chain.residueByRnum(parseInt(parts[1], 10));
    if (residue === null) {
      return null;
    }
    return residue.atom(parts[2]);
  },

  center : function() {
    var sum = vec3.create();
    var count = 0;
    this.eachAtom(function(atom) {
      vec3.add(sum, sum, atom.pos());
      count+=1;
    });
    if (count) {
      vec3.scale(sum, sum, 1/count);
    }
    return sum;
  },

  // returns a sphere containing all atoms part of this structure. This will 
  // not calculate the minimal bounding sphere, just a good-enough 
  // approximation.
  boundingSphere : function() {
    var center = this.center();
    var radiusSquare = 0.0;
    this.eachAtom(function(atom) {
      radiusSquare = Math.max(radiusSquare, vec3.sqrDist(center, atom.pos()));
    });
    return new geom.Sphere(center, Math.sqrt(radiusSquare));
  },

  // returns all backbone traces of all chains of this structure
  backboneTraces : function() {
    var chains = this.chains();
    var traces = [];
    for (var i = 0; i < chains.length; ++i) {
      Array.prototype.push.apply(traces, chains[i].backboneTraces());
    }
    return traces;
  },


  select : function(what) {

    if (what === 'protein') {
      return this.residueSelect(function(r) { return r.isAminoacid(); });
    }
    if (what === 'water') {
      return this.residueSelect(function(r) { return r.isWater(); });
    }
    if (what === 'ligand') {
      return this.residueSelect(function(r) { 
        return !r.isAminoacid() && !r.isWater();
      });
    }
    if (what === 'polymer') {
      return select.polymer(this, new MolView(this));
    }
    // when what is not one of the simple strings above, we assume what
    // is a dictionary containing predicates which have to be fulfilled.
    return select.dict(this, new MolView(this), what || {});
  },


  residueSelect : function(predicate) {
    console.time('Mol.residueSelect');
    var view = new MolView(this.full());
    for (var ci = 0; ci < this._chains.length; ++ci) {
      var chain = this._chains[ci];
      var chainView = null;
      var residues = chain.residues();
      for (var ri = 0; ri < residues.length; ++ri) {
        if (predicate(residues[ri])) {
          if (!chainView) {
            chainView = view.addChain(chain, false);
          }
          chainView.addResidue(residues[ri], true);
        }
      }
    }
    console.timeEnd('Mol.residueSelect');
    return view;
  },

  atomSelect : function(predicate) {
    console.time('Mol.atomSelect');
    var view = new MolView(this.full());
    for (var ci = 0; ci < this._chains.length; ++ci) {
      var chain = this._chains[ci];
      var chainView = null;
      var residues = chain.residues();
      for (var ri = 0; ri < residues.length; ++ri) {
        var residueView = null;
        var residue = residues[ri];
        var atoms = residue.atoms();
        for (var ai = 0; ai < atoms.length; ++ai) {
          if (!predicate(atoms[ai])) {
            continue;
          }
          if (!chainView) {
            chainView = view.addChain(chain, false);
          }
          if (!residueView) {
            residueView = chainView.addResidue(residue, false);
          }
          residueView.addAtom(atoms[ai]);
        }
      }
    }
    console.timeEnd('Mol.atomSelect');
    return view;
  },



  assembly : function(id) {
    var assemblies = this.assemblies();
    for (var i = 0; i < assemblies.length; ++i) {
      if (assemblies[i].name() === id) {
        return assemblies[i];
      }
    }
    return null;
  },

  chainsByName : function(chainNames) {
    // build a map to avoid O(n^2) behavior. That's overkill when the list 
    // of names is short but should give better performance when requesting
    // multiple chains.
    var chainMap = { };
    var chains = this.chains();
    for (var i = 0; i < chains.length; ++i) {
      chainMap[chains[i].name()] = chains[i];
    }
    var filteredChains = [];
    for (var j = 0; j < chainNames.length; ++j) {
      var filteredChain = chainMap[chainNames[j]];
      if (filteredChain !== undefined) {
        filteredChains.push(filteredChain);
      }
    }
    return filteredChains;
  },
  selectWithin : (function() {
    var dist = vec3.create();
    return function(mol, options) {
      console.time('Mol.selectWithin');
      options = options || {};
      var radius = options.radius || 4.0;
      var radiusSqr = radius * radius;
      var matchResidues = !!options.matchResidues;
      var targetAtoms = [];
      mol.eachAtom(function(a) { targetAtoms.push(a); });

      var view = new MolView(this.full());
      var addedRes = null, addedChain = null;
      var chains = this.chains();
      var skipResidue = false;
      for (var ci = 0; ci < chains.length; ++ci) {
        var residues = chains[ci].residues();
        addedChain = null;
        for (var ri = 0; ri < residues.length; ++ri) {
          addedRes = null;
          skipResidue = false;
          var atoms = residues[ri].atoms();
          for (var ai = 0; ai < atoms.length; ++ai) {
            if (skipResidue) {
              break;
            }
            for (var wi = 0; wi < targetAtoms.length; ++wi) {
              vec3.sub(dist, atoms[ai].pos(), targetAtoms[wi].pos());
              if (vec3.sqrLen(dist) > radiusSqr) {
                continue;
              }
              if (!addedChain) {
                addedChain = view.addChain(chains[ci].full(), false);
              }
              if (!addedRes) {
                addedRes =
                    addedChain.addResidue(residues[ri].full(), matchResidues);
              }
              if (matchResidues) {
                skipResidue = true;
                break;
              } 
              addedRes.addAtom(atoms[ai].full());
              break;
            }
          }
        }
      }
      console.timeEnd('Mol.selectWithin');
      return view;
    };
  })(),
  createEmptyView : function() {
    return new MolView(this.full());
  }
};

function Mol() {
  MolBase.call(this);
  this._chains = [];
  this._assemblies = [];
  this._nextAtomIndex = 0;
}

utils.derive(Mol, MolBase, {
  addAssembly : function(assembly) { 
    this._assemblies.push(assembly); 
  },

  setAssemblies : function(assemblies) { 
    this._assemblies = assemblies; 
  },

  assemblies : function() { return this._assemblies; },

  chains : function() { return this._chains; },

  full : function() { return this; },

  containsResidue : function(residue) {
    return residue.full().structure() === this;
  },

  chainByName : function(name) { 
    for (var i = 0; i < this._chains.length; ++i) {
      if (this._chains[i].name() === name) {
        return this._chains[i];
      }
    }
    return null;
  },

  // for backwards compatibility
  chain : function(name) {
    return this.chainByName(name);
  },

  nextAtomIndex : function() {
    var nextIndex = this._nextAtomIndex; 
    this._nextAtomIndex+=1; 
    return nextIndex; 
  },

  addChain : function(name) {
    var chain = new Chain(this, name);
    this._chains.push(chain);
    return chain;
  },


  connect : function(atom_a, atom_b) {
    var bond = new Bond(atom_a, atom_b);
    atom_a.addBond(bond);
    atom_b.addBond(bond);
    return bond;
  },



  // determine connectivity structure. for simplicity only connects atoms of the
  // same residue, peptide bonds and nucleotides
  deriveConnectivity : function() {
    console.time('Mol.deriveConnectivity');
    var thisStructure = this;
    var prevResidue = null;
    this.eachResidue(function(res) {
      var sqrDist;
      var atoms = res.atoms();
      var numAtoms = atoms.length;
      for (var i = 0; i < numAtoms; i+=1) {
        var atomI = atoms[i];
        var posI = atomI.pos();
        var covalentI = covalentRadius(atomI.element());
        for (var j = 0; j < i; j+=1) {
          var atomJ = atoms[j];
          var covalentJ = covalentRadius(atomJ.element());
          sqrDist = vec3.sqrDist(posI, atomJ.pos());
          var lower = covalentI+covalentJ-0.30;
          var upper = covalentI+covalentJ+0.30;
          if (sqrDist < upper*upper && sqrDist > lower*lower) {
            thisStructure.connect(atomI, atomJ);
          }
        }
      }
      res._deduceType();
      if (prevResidue !== null) {
        if (res.isAminoacid() && prevResidue.isAminoacid()) {
          connectPeptides(thisStructure, prevResidue, res);
        }
        if (res.isNucleotide() && prevResidue.isNucleotide()) {
          connectNucleotides(thisStructure, prevResidue, res);
        }
      }
      prevResidue = res;
    });
    console.timeEnd('Mol.deriveConnectivity');
  },
});

function MolView(mol) {
  MolBase.call(this);
  this._mol = mol; 
  this._chains = [];
}

utils.derive(MolView, MolBase, {

  full : function() { return this._mol; },

  assemblies : function() { return this._mol.assemblies(); },

  // add chain to view
  addChain : function(chain, recurse) {
    var chainView = new ChainView(this, chain.full());
    this._chains.push(chainView);
    if (recurse) {
      var residues = chain.residues();
      for (var i = 0; i< residues.length; ++i) {
        chainView.addResidue(residues[i], true);
      }
    }
    return chainView;
  },

  addAtom : function(atom) {
    var chain = this.chain(atom.residue().chain().name());
    if (chain === null) {
      chain = this.addChain(atom.residue().chain());
    }
    return chain.addAtom(atom);
  },

  removeAtom : function(atom, removeEmptyResiduesAndChains) {
    if (atom === null) {
      return false;
    }
    var chain = this.chain(atom.residue().chain().name());
    if (chain === null) {
      return false;
    }
    var removed = chain.removeAtom(atom, removeEmptyResiduesAndChains);
    if (removed && chain.residues().length === 0) {
      this._chains = this._chains.filter(function(c) { 
        return c !== chain;
      });
    }
    return removed;
  },

  containsResidue : function(residue) {
    if (!residue) {
      return false;
    }
    var chain = this.chain(residue.chain().name());
    if (!chain) {
      return false;
    }
    return chain.containsResidue(residue);
  },

  addResidues : function (residues, recurse) {
    var that = this;
    var chainsViews = {};
    residues.forEach(function  (residue) {
      var chainName = residue.chain().name();
      if (typeof chainsViews[chainName] === 'undefined') {
        chainsViews[chainName] = that.addChain(residue.chain(), false); 
      }
      chainsViews[chainName].addResidue(residue, recurse);
    });
    return chainsViews;
  },


  chains : function() { return this._chains; },

  chain : function(name) {
    for (var i = 0; i < this._chains.length; ++i) {
      if (this._chains[i].name() === name) {
        return this._chains[i];
      }
    }
    return null;
  }
});

return {
  MolView : MolView,
  Mol : Mol
};

});

