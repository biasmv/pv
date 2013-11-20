// Copyright (c) 2013 Marco Biasini
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

(function(exports) {
"use strict";

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

//-----------------------------------------------------------------------------
// MolBase, ChainBase, ResidueBase, AtomBase
//-----------------------------------------------------------------------------

function MolBase() {

}


MolBase.prototype.eachResidue = function(callback) {
  for (var i = 0; i < this._chains.length; i+=1) {
    this._chains[i].eachResidue(callback);
  }
};

MolBase.prototype.eachAtom = function(callback, index) {
  index |= 0;
  for (var i = 0; i < this._chains.length; i+=1) {
    index = this._chains[i].eachAtom(callback, index);
  }
};

MolBase.prototype.residueCount = function () {
  var chains = this.chains();
  var count = 0;
  for (var ci = 0; ci < chains.length; ++ci) {
    count += chains[ci].residues().length;
  }
  return count;
};

MolBase.prototype.atomCount = function() {
  var chains = this.chains();
  var count = 0;
  for (var ci = 0; ci < chains.length; ++ci) {
    var residues = chains[ci].residues();
    for (var ri = 0; ri < residues.length; ++ri) {
      count+= residues[ri].atoms().length;
    }
  }
  return count;
};

MolBase.prototype.center = function() {
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
};

MolBase.prototype.select = function(what) {

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
  // when what is not one of the simple strings above, we assume what
  // is a dictionary containing predicates which have to be fulfilled.
  return this._dictSelect(what);
};

MolBase.prototype.selectWithin = (function() {
  var dist = vec3.create();
  return function(mol, options) {
    console.time('Mol.selectWithin');
    options = options || {};
    var radius = options.radius || 4.0;
    var radiusSqr = radius*radius;
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
              addedRes = addedChain.addResidue(residues[ri].full(), 
                                               matchResidues);
            }
            if (matchResidues) {
              skipResidue = true;
              break;
            } 
            addedRes.addAtom(atoms[ai].full());
          }
        }
      }
    }
    console.timeEnd('Mol.selectWithin');
    return view;
  };
})();

MolBase.prototype.residueSelect = function(predicate) {
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
};

MolBase.prototype._atomPredicates = function(dict) {

  var predicates = [];
  if (dict.aname !== undefined) {
    predicates.push(function(a) { return a.name() === dict.aname; });
  }
  if (dict.anames !== undefined) {
    predicates.push(function(a) { 
      var n = a.name();
      for (var k = 0; k < dict.anames.length; ++k) {
        if (n === dict.anames[k]) {
          return true;
        }
      }
      return false;
    });
  }
  return predicates;
};
// extracts the residue predicates from the dictionary. 
// ignores rindices, rindexRange because they are handled separately.
MolBase.prototype._residuePredicates = function(dict) {

  var predicates = [];
  if (dict.rname !== undefined) {
    predicates.push(function(r) { return r.name() === dict.rname; });
  }
  if (dict.rnames !== undefined) {
    predicates.push(function(r) { 
      var n = r.name();
      for (var k = 0; k < dict.rnames.length; ++k) {
        if (n === dict.rnames[k]) {
          return true;
        }
      }
      return false;
    });
  }
  return predicates;
};

MolBase.prototype._chainPredicates = function(dict) {
  var predicates = [];
  if (dict.chain !== undefined) {
    predicates.push(function(c) { return c.name() === dict.chain; });
  }
  if (dict.chains !== undefined) {
    predicates.push(function(c) { 
      var n = c.name();
      for (var k = 0; k < dict.chains.length; ++k) {
        if (n === dict.chains[k]) {
          return true;
        }
      }
      return false;
    });
  }
  return predicates;
};

function fulfillsPredicates(obj, predicates) {
  for (var i = 0; i < predicates.length; ++i) {
    if (!predicates[i](obj)) {
      return false;
    }
  }
  return true;
}

MolBase.prototype._dictSelect = function(dict) {
  var view = new MolView(this);
  var residuePredicates = this._residuePredicates(dict);
  var atomPredicates = this._atomPredicates(dict);
  var chainPredicates = this._chainPredicates(dict);

  for (var ci = 0; ci < this._chains.length; ++ci) {
    var chain = this._chains[ci];
    if (!fulfillsPredicates(chain, chainPredicates)) {
      continue;
    }
    var chainView = null;
    var residues = chain.residues();
    var selResidues = [], i, e;
    if (dict.rindexRange !== undefined) {
      for (i = dict.rindexRange[0], 
           e = Math.min(residues.length, dict.rindexRange[1]); i < e; ++i) {
        selResidues.push(residues[i]);
      }
      residues = selResidues;
    }  else if (dict.rindices) {
      if (dict.rindices.length !== undefined) {
        selResidues = [];
        for (i = 0; i < dict.rindices.length; ++i) {
          selResidues.push(residues[dict.rindices[i]]);
        }
        residues = selResidues;
      }
    }
    for (var ri = 0; ri < residues.length; ++ri) {
      if (!fulfillsPredicates(residues[ri], residuePredicates)) {
        continue;
      }
      if (!chainView) {
        chainView = view.addChain(chain, false);
      }
      var residueView = null;
      var atoms = residues[ri].atoms();
      for (var ai = 0; ai < atoms.length; ++ai) {
        if (!fulfillsPredicates(atoms[ai], atomPredicates)) {
          continue;
        }
        if (!residueView) {
          residueView = chainView.addResidue(residues[ri], false);
        }
        residueView.addAtom(atoms[ai]);
      }
    }
  }
  return view;
};

function ChainBase() {

}

ChainBase.prototype.eachAtom = function(callback, index) {
  index |= 0;
  for (var i = 0; i< this._residues.length; i+=1) {
    index = this._residues[i].eachAtom(callback, index);
  }
  return index;
};

ChainBase.prototype.eachResidue = function(callback) {
  for (var i = 0; i < this._residues.length; i+=1) {
    callback(this._residues[i]);
  }
};



ChainBase.prototype.residues = function() { return this._residues; };

ChainBase.prototype.structure = function() { return this._structure; };


ChainBase.prototype.asView = function() {
  var view = new MolView(this.structure().full());
  view.addChain(this, true);
  return view;

};

ChainBase.prototype.prop = function(propName) { 
  return this[propName]();
};

function ResidueBase() {

}

ResidueBase.prototype.prop = function(propName) { 
  return this[propName]();
};

ResidueBase.prototype.isWater = function() {
  return this.name() === 'HOH' || this.name() === 'DOD';
};

ResidueBase.prototype.eachAtom = function(callback, index) {
  index |= 0;
  for (var i =0; i< this._atoms.length; i+=1) {
    callback(this._atoms[i], index);
    index +=1;
  }
  return index;
};

ResidueBase.prototype.qualifiedName = function() {
  return this.chain().name()+'.'+this.name()+this.num();
};

ResidueBase.prototype.atom = function(index_or_name) { 
  if (typeof index_or_name === 'string') {
    for (var i =0; i < this._atoms.length; ++i) {
     if (this._atoms[i].name() === index_or_name) {
       return this._atoms[i];
     }
    }
  }
  return this._atoms[index_or_name]; 
};


ResidueBase.prototype.center = function() {
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
};

ResidueBase.prototype.isAminoacid = function() { 
  return this.atom('N') && this.atom('CA') && this.atom('C') && this.atom('O');
};
function AtomBase() {
}

AtomBase.prototype.name = function() { return this._name; };
AtomBase.prototype.pos = function() { return this._pos; };
AtomBase.prototype.element = function() { return this._element; };
AtomBase.prototype.index = function() { return this._index; };

AtomBase.prototype.prop = function(propName) { 
  return this[propName]();
};

AtomBase.prototype.eachBond = function(callback) {
  var bonds = this.bonds();
  for (var i = 0, e = bonds.length; i < e; ++i) {
    callback(bonds[i]);
  }
};

//-----------------------------------------------------------------------------
// Mol, Chain, Residue, Atom, Bond
//-----------------------------------------------------------------------------

function Mol(pv) {
  MolBase.prototype.constructor.call(this);
  this._chains = [];
  this._pv = pv;
  this._nextAtomIndex = 0;
}

derive(Mol, MolBase);


Mol.prototype.chains = function() { return this._chains; };

Mol.prototype.full = function() { return this; };

Mol.prototype.containsResidue = function(residue) {
  return residue.full().structure() === this;
};

Mol.prototype.chain = function(name) { 
  for (var i = 0; i < this._chains.length; ++i) {
    if (this._chains[i].name() === name) {
      return this._chains[i];
    }
  }
  return null;
};

Mol.prototype.nextAtomIndex = function() {
  var nextIndex = this._nextAtomIndex; 
  this._nextAtomIndex+=1; 
  return nextIndex; 
};

Mol.prototype.addChain = function(name) {
  var chain = new Chain(this, name);
  this._chains.push(chain);
  return chain;
};


Mol.prototype.connect = function(atom_a, atom_b) {
  var bond = new Bond(atom_a, atom_b);
  atom_a.addBond(bond);
  atom_b.addBond(bond);
  return bond;
};

// determine connectivity structure. for simplicity only connects atoms of the 
// same residue and peptide bonds
Mol.prototype.deriveConnectivity = function() {
  console.time('Mol.deriveConnectivity');
  var this_structure = this;
  var prev_residue;
  this.eachResidue(function(res) {
    var sqr_dist;
    var d = vec3.create();
    for (var i = 0; i < res.atoms().length; i+=1) {
      var atomI = res.atom(i);
      var covalentI = covalentRadius(atomI.element());
      for (var j = 0; j < i; j+=1) {
        var atomJ = res.atom(j);
        var covalentJ = covalentRadius(atomJ.element());
        sqr_dist = vec3.sqrDist(atomI.pos(), atomJ.pos());
        var lower = covalentI+covalentJ-0.30;
        var upper = covalentI+covalentJ+0.30;
        if (sqr_dist < upper*upper && sqr_dist > lower*lower) {
          this_structure.connect(res.atom(i), res.atom(j));
        }
      }
    }
    if (prev_residue) {
    var c_atom = prev_residue.atom('C');
    var n_atom = res.atom('N');
    if (c_atom && n_atom) {
      sqr_dist = vec3.sqrDist(c_atom.pos(), n_atom.pos());
      if (sqr_dist < 1.6*1.6) {
        this_structure.connect(n_atom, c_atom);
      }
    }
    }
    prev_residue = res;
  });
  console.timeEnd('Mol.deriveConnectivity');
};

function Chain(structure, name) {
  ChainBase.prototype.constructor.call(this);
  this._structure = structure;
  this._name = name;
  this._cachedTraces = [];
  this._residues = [];
}

derive(Chain, ChainBase);

Chain.prototype.name = function() { return this._name; };

Chain.prototype.full = function() { return this; };

Chain.prototype.addResidue = function(name, num) {
  var residue = new Residue(this, name, num);
  this._residues.push(residue);
  return residue;
};

// assigns secondary structure to residues in range from_num to to_num.
Chain.prototype.assignSS = function(from_num, to_num, ss) {
  // FIXME: when the chain numbers are completely ordered, perform binary 
  // search to identify range of residues to assign secondary structure to.
  for (var i = 1; i < this._residues.length-1; ++i) {
    var res = this._residues[i];
    // FIXME: we currently don't set the secondary structure of the first and 
    // last residue of helices and sheets. that takes care of better 
    // transitions between coils and helices. ideally, this should be done
    // in the cartoon renderer, NOT in this function.
    if (res.num() <=  from_num || res.num() >= to_num) {
      continue;
    }
    res.setSS(ss);
  }
};

// invokes a callback for each connected stretch of amino acids. these 
// stretches are used for all trace-based rendering styles, e.g. sline, 
// line_trace, tube, cartoon etc. 
Chain.prototype.eachBackboneTrace = function(callback) {
  this._cacheBackboneTraces();
  for (var i=0; i < this._cachedTraces.length; ++i) {
    callback(this._cachedTraces[i]);
  }
};

Chain.prototype._cacheBackboneTraces = function() {
  if (this._cachedTraces.length > 0) {
    return;
  }
  var  stretch = new BackboneTrace();
  for (var i = 0; i < this._residues.length; i+=1) {
    var residue = this._residues[i];
    if (!residue.isAminoacid()) {
      if (stretch.length() > 1) {
        this._cachedTraces.push(stretch);
        stretch = new BackboneTrace();
      }
      continue;
    }
    if (stretch.length() === 0) {
      stretch.push(residue);
      continue;
    }
    var ca_prev = this._residues[i-1].atom('C');
    var n_this = residue.atom('N');
    if (Math.abs(vec3.sqrDist(ca_prev.pos(), n_this.pos()) - 1.5*1.5) < 1) {
      stretch.push(residue);
    } else {
      if (stretch.length() > 1) {
        this._cachedTraces.push(stretch);
        stretch = new BackboneTrace();
      }
    }
  }
  if (stretch.length() > 1) {
    this._cachedTraces.push(stretch);
  }
};


// returns all connected stretches of amino acids found in this chain as 
// a list.
Chain.prototype.backboneTraces = function() {
  var traces = [];
  this.eachBackboneTrace(function(trace) { traces.push(trace); });
  return traces;

};

function Residue(chain, name, num) {
  ResidueBase.prototype.constructor.call(this);
  this._name = name;
  this._num = num;
  this._atoms = [];
  this._ss = 'C';
  this._chain = chain;
  this._index = chain.residues().length;
}

derive(Residue, ResidueBase);

Residue.prototype.name = function() { return this._name; };

Residue.prototype.num = function() { return this._num; };

Residue.prototype.full = function() { return this; };

Residue.prototype.addAtom = function(name, pos, element) {
  var atom = new Atom(this, name, pos, element, this.structure().nextAtomIndex());
  this._atoms.push(atom);
  return atom;
};

Residue.prototype.ss = function() { return this._ss; };
Residue.prototype.setSS = function(ss) { this._ss = ss; };
Residue.prototype.index = function() { return this._index; };

Residue.prototype.atoms = function() { return this._atoms; };
Residue.prototype.chain = function() { return this._chain; };


Residue.prototype.structure = function() { 
  return this._chain.structure(); 
};

function Atom(residue, name, pos, element, index) {
  AtomBase.prototype.constructor.call(this);
  this._residue = residue;
  this._bonds = [];
  this._name = name;
  this._pos = pos;
  this._index = index;
  this._element = element;
}

derive(Atom, AtomBase);

Atom.prototype.addBond = function(bond) { this._bonds.push(bond); };
Atom.prototype.name = function() { return this._name; };
Atom.prototype.bonds = function() { return this._bonds; };
Atom.prototype.residue = function() { return this._residue; };
Atom.prototype.structure = function() { return this._residue.structure(); };
Atom.prototype.full = function() { return this; };
Atom.prototype.qualifiedName = function() {
  return this.residue().qualifiedName()+'.'+this.name();
};

var Bond = function(atom_a, atom_b) {
  var self = {
    atom_one : atom_a,
    atom_two : atom_b
  };
  return {
    atom_one : function() { return self.atom_one; },
    atom_two : function() { return self.atom_two; },

    // calculates the mid-point between the two atom positions
    mid_point : function(out) { 
      if (!out) {
        out = vec3.create();
      }
      vec3.add(out, self.atom_one.pos(), self.atom_two.pos());
      vec3.scale(out, out, 0.5);
      return out;
    }
  };
};

//-----------------------------------------------------------------------------
// MolView, ChainView, ResidueView, AtomView
//-----------------------------------------------------------------------------

function MolView(mol) {
  MolBase.prototype.constructor.call(this);
  this._mol = mol; 
  this._chains = [];
}

derive(MolView, MolBase);

MolView.prototype.full = function() { return this._mol; };

// add chain to view
MolView.prototype.addChain = function(chain, recurse) {
  var chainView = new ChainView(this, chain.full());
  this._chains.push(chainView);
  if (recurse) {
    var residues = chain.residues();
    for (var i = 0; i< residues.length; ++i) {
      chainView.addResidue(residues[i], true);
    }
  }
  return chainView;
};


MolView.prototype.containsResidue = function(residue) {
  if (!residue) {
    return false;
  }
  var chain = this.chain(residue.chain().name());
  if (!chain) {
    return false;
  }
  return chain.containsResidue(residue);
};


MolView.prototype.chains = function() { return this._chains; };


MolView.prototype.chain = function(name) {
  for (var i = 0; i < this._chains.length; ++i) {
    if (this._chains[i].name() === name) {
      return this._chains[i];
    }
  }
  return null;
};

function ChainView(molView, chain) {
  ChainBase.prototype.constructor.call(this);
  this._chain = chain;
  this._residues = [];
  this._molView = molView;
  this._residueMap = {};
}


derive(ChainView, ChainBase);

ChainView.prototype.addResidue = function(residue, recurse) {
  var resView = new ResidueView(this, residue.full());
  this._residues.push(resView);
  this._residueMap[residue.full().index()] = resView;
  if (recurse) {
    var atoms = residue.atoms();
    for (var i = 0; i < atoms.length; ++i) {
      resView.addAtom(atoms[i].full());
    }
  }
  return resView;
};

ChainView.prototype.containsResidue = function(residue) {
  var resView = this._residueMap[residue.full().index()];
  if (resView === undefined) {
    return false;
  }
  return resView.full() === residue.full();
};


ChainView.prototype.eachBackboneTrace = function(callback) {
  // backbone traces for the view must be based on the the full 
  // traces for the following reasons:
  //  - we must be able to display subsets with one residue in length,
  //    when they are part of a larger trace. 
  //  - when a trace residue is not at the end, e.g. the C-terminal or
  //    N-terminal end of the full trace, the trace residue starts
  //    midway between the residue and the previous, and ends midway
  //    between the residue and the next.
  //  - the tangents for the Catmull-Rom spline depend on the residues
  //    before and after. Thus, to get the same curvature for a 
  //    trace subset, the residues before and after must be taken
  //    into account.
  var fullTraces = this._chain.backboneTraces();
  var traceSubsets = [];
  for (var i = 0; i < fullTraces.length; ++i) {
    var subsets = fullTraces[i].subsets(this._residues);
    for (var j = 0; j < subsets.length; ++j) {
      callback(subsets[j]);
    }
  }
};

ChainView.prototype.backboneTraces = function() {
  var traces = [];
  this.eachBackboneTrace(function(trace) { traces.push(trace); });
  return traces;
};

ChainView.prototype.full = function() { return this._chain; };

ChainView.prototype.name = function () { return this._chain.name(); };

ChainView.prototype.structure = function() { return this._molView; };

function ResidueView(chainView, residue) {
  ResidueBase.prototype.constructor.call(this);
  this._chainView = chainView;
  this._atoms = [];
  this._residue = residue;
}


derive(ResidueView, ResidueBase);

ResidueView.prototype.addAtom = function(atom) {
  var atomView = new AtomView(this, atom.full());
  this._atoms.push(atomView);
};

ResidueView.prototype.full = function() { return this._residue; };
ResidueView.prototype.num = function() { return this._residue.num(); };
ResidueView.prototype.ss = function() { return this._residue.ss(); };
ResidueView.prototype.index = function() { return this._residue.index(); };
ResidueView.prototype.chain = function() { return this._chainView; };
ResidueView.prototype.name = function() { return this._residue.name(); };

ResidueView.prototype.atoms = function() { return this._atoms; };
ResidueView.prototype.qualifiedName = function() {
  return this._residue.qualifiedName();
};



function AtomView(resView, atom) {
  AtomBase.prototype.constructor.call(this);
  this._resView = resView;
  this._atom = atom;
  this._bonds = [];
}


derive(AtomView, AtomBase);

AtomView.prototype.full = function() { return this._atom; };
AtomView.prototype.name = function() { return this._atom.name(); };
AtomView.prototype.pos = function() { return this._atom.pos(); };
AtomView.prototype.element = function() { return this._atom.element(); };
AtomView.prototype.residue = function() { return this._resView; };
AtomView.prototype.bonds = function() { return this._atom.bonds(); };
AtomView.prototype.index = function() { return this._atom.index(); };
AtomView.prototype.qualifiedName = function() {
  return this._atom.qualifiedName();
};


function parseHelixRecord(line) {
  // FIXME: handle insertion codes
  var frst_num = parseInt(line.substr(21, 4), 10);
  var last_num = parseInt(line.substr(33, 4), 10);
  var chainName = line[19];
  return { first : frst_num, last : last_num, chainName : chainName };
}

function parseSheetRecord(line) {
  // FIXME: handle insertion codes
  var frst_num = parseInt(line.substr(22, 4), 10);
  var last_num = parseInt(line.substr(33, 4), 10);
  var chainName = line[21];
  return { first : frst_num, last : last_num, chainName : chainName };
}

// a truly minimalistic PDB parser. It will die as soon as the input is 
// not well-formed. it only reads ATOM, HETATM, HELIX and SHEET records, 
// everything else is ignored. in case of multi-model files, only the 
// first model is read.
//
// FIXME: load PDB currently spends a substantial amount of time creating
// the vec3 instances for the atom positions. it's possible that it's
// cheaper to initialize a bulk buffer once and create buffer views to
// that data for each atom position. since the atom's lifetime is bound to
// the parent structure, the buffer could be managed on that level and
// released once the structure is deleted.
function pdb(text) {
  console.time('pdb'); 
  var structure = new Mol();
  var currChain = null;
  var currRes = null;
  var currAtom = null;
  
  var helices = [];
  var sheets = [];
  
  function parseAndAddAtom(line, hetatm) {
    var alt_loc = line[16];
    if (alt_loc !== ' ' && alt_loc !== 'A') {
      return;
    }
    var chainName = line[21];
    var res_name = line.substr(17, 3);
    var atomName = line.substr(12, 4).trim();
    var rnumNum = parseInt(line.substr(22, 4), 10);
    var insCode = line[26];
    var updateResidue = false;
    var updateChain = false;
    if (!currChain || currChain.name() !== chainName) {
      updateChain = true;
      updateResidue = true;
    }
    if (!currRes || currRes.num() !== rnumNum) {
      updateResidue = true;
    }
    if (updateChain) {
      // residues of one chain might appear interspersed with residues from
      // other chains.
      currChain = structure.chain(chainName) || structure.addChain(chainName);
    }
    if (updateResidue) {
      currRes = currChain.addResidue(res_name, rnumNum,
                                       currChain.residues().length);
    }
    var pos = vec3.create();
    for (var i=0;i<3;++i) {
      pos[i] = (parseFloat(line.substr(30+i*8, 8)));
    }
    currRes.addAtom(atomName, pos, line.substr(76, 2).trim());
  }
  var lines = text.split(/\r\n|\r|\n/g);
  var i = 0;
  for (i = 0; i < lines.length; i++) {
    var line = lines[i];
    var recordName = line.substr(0, 6);

    if (recordName === 'ATOM  ') {
      parseAndAddAtom(line, false);
      continue;
    }
    if (recordName === 'HETATM') {
      parseAndAddAtom(line, true);
      continue;
    }
    if (recordName === 'HELIX ') {
      helices.push(parseHelixRecord(line));
      continue;
    }
    if (recordName === 'SHEET ') {
      sheets.push(parseSheetRecord(line));
      continue;
    }
    if (recordName === 'END') {
      break;
    }
  }
  var chain = null;
  for (i = 0; i < sheets.length; ++i) {
    var sheet = sheets[i];
    chain = structure.chain(sheet.chainName);
    if (chain) {
      chain.assignSS(sheet.first, sheet.last, 'E');
    }
  }
  for (i = 0; i < helices.length; ++i) {
    var helix = helices[i];
    chain = structure.chain(helix.chainName);
    if (chain) {
      chain.assignSS(helix.first, helix.last, 'H');
    }
  }
  structure.deriveConnectivity();
  console.log('imported', structure.chains().length, 'chain(s),',
              structure.residueCount(), 'residue(s)');
  console.timeEnd('pdb');

  return structure;
}

var zhangSkolnickSS = (function() {
  var posOne = vec3.create();
  var posTwo = vec3.create();
  return function(trace, i, distances, delta) {
    for (var j = Math.max(0, i-2); j <= i; ++j) {
      for (var k = 2;  k < 5; ++k) {
        if (j+k >= trace.length())
          continue;
        var d = vec3.dist(trace.posAt(posOne, j), 
                          trace.posAt(posTwo, j+k));
        if (Math.abs(d - distances[k-2]) > delta) {
          return false;
        }
      }
    }
    return true;
  };
})();

var isHelical = function(trace, i) {
  var helixDistances = [5.45, 5.18, 6.37];
  var helixDelta = 2.1;
  return zhangSkolnickSS(trace, i, helixDistances, helixDelta);
};

var isSheet = function(trace, i) {
  var sheetDistances = [6.1, 10.4, 13.0];
  var sheetDelta = 1.42;
  return zhangSkolnickSS(trace, i, sheetDistances, sheetDelta);
};


// assigns secondary structure information based on a simple and very fast 
// algorithm published by Zhang and Skolnick in their TM-align paper. 
// Reference:
//
// TM-align: a protein structure alignment algorithm based on the Tm-score 
// (2005) NAR, 33(7) 2302-2309
function assignHelixSheet(structure) {
  console.time('mol.assignHelixSheet');
  var chains = structure.chains();
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    chain.eachBackboneTrace(function(trace) {
      for (var i = 0; i < trace.length(); ++i) {
        if (isHelical(trace, i)) {
          trace.residueAt(i).setSS('H');
          continue;
        } 
        if (isSheet(trace, i)) {
          trace.residueAt(i).setSS('E');
          continue;
        }
        trace.residueAt(i).setSS('C');
      }
    });
  }
  console.timeEnd('mol.assignHelixSheet');
}

exports.mol = {};

exports.mol.Mol = Mol;
exports.mol.Chain = Chain;
exports.mol.Residue = Residue;
exports.mol.Atom = Atom;

exports.mol.MolView = MolView;
exports.mol.ChainView = ChainView;
exports.mol.ResidueView = ResidueView;
exports.mol.AtomView = AtomView;
exports.mol.pdb = pdb;
exports.mol.assignHelixSheet = assignHelixSheet;

return true;

})(this);
