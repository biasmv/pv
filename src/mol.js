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

// combines the numeric part of the residue number with the insertion
// code and returns a single number. Note that this is completely safe
// and we do not have to worry about overflows, as for PDB files the 
// range of permitted residue numbers is quite limited anyway.
function rnumInsCodeHash(num, insCode) {
  return num << 8 | insCode.charCodeAt(0);
}

//-----------------------------------------------------------------------------
// MolBase, ChainBase, ResidueBase, AtomBase
//-----------------------------------------------------------------------------

function MolBase() {
}

MolBase.prototype.eachResidue = function(callback) {
  for (var i = 0; i < this._chains.length; i+=1) {
    if (this._chains[i].eachResidue(callback) === false) {
      return false;
    }
  }
};

MolBase.prototype.eachAtom = function(callback, index) {
  index |= 0;
  for (var i = 0; i < this._chains.length; i+=1) {
    index = this._chains[i].eachAtom(callback, index);
    if (index === false) {
      return false;
    }
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

MolBase.prototype.eachChain = function(callback) {
  var chains = this.chains();
  for (var i = 0; i < chains.length; ++i) {
    if (callback(chains[i]) === false) {
      return;
    }
  }
};

MolBase.prototype.atomCount = function() {
  var chains = this.chains();
  var count = 0;
  for (var ci = 0; ci < chains.length; ++ci) {
    count += chains[ci].atomCount();
  }
  return count;
};

MolBase.prototype.atoms = function() {
  var atoms = [];
  this.eachAtom(function(atom) { atoms.push(atom); });
  return atoms;
};

MolBase.prototype.atom = function(name) {
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

// returns a sphere containing all atoms part of this structure. This will not 
// calculate the minimal bounding sphere, just a good-enough approximation.
MolBase.prototype.boundingSphere = function() {
  var center = this.center();
  var radiusSquare = 0.0;
  this.eachAtom(function(atom) {
    radiusSquare = Math.max(radiusSquare, vec3.sqrDist(center, atom.pos()));
  });
  return new Sphere(center, radiusSquare);
};

// returns all backbone traces of all chains of this structure
MolBase.prototype.backboneTraces = function() {
  var chains = this.chains();
  var traces = [];
  for (var i = 0; i < chains.length; ++i) {
    Array.prototype.push.apply(traces, chains[i].backboneTraces());
  }
  return traces;
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
              addedRes =
                  addedChain.addResidue(residues[ri].full(), matchResidues);
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
  if (dict.rnums !== undefined) {
    var num_set = {};
    for (var i = 0; i < dict.rnums.length; ++i) {
      num_set[dict.rnums[i]] = true;
    }
    predicates.push(function(r) {
      var n = r.num();
      return num_set[n] === true;
    });
  }
  return predicates;
};

MolBase.prototype._chainPredicates = function(dict) {
  var predicates = [];
  if (dict.cname !== undefined) {
    dict.chain = dict.cname;
  }
  if (dict.cnames !== undefined) {
    dict.chains = dict.cnames;
  }
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
    if (dict.rindex) {
      dict.rindices = [dict.rindex];
    }
    if (dict.rnumRange) {
      residues =
          chain.residuesInRnumRange(dict.rnumRange[0], dict.rnumRange[1]);
    }
    var selResidues = [], i, e;
    if (dict.rindexRange !== undefined) {
      for (i = dict.rindexRange[0],
          e = Math.min(residues.length, dict.rindexRange[1]);
           i < e; ++i) {
        selResidues.push(residues[i]);
      }
      residues = selResidues;
    } else if (dict.rindices) {
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

function rnumComp(lhs, rhs) {
  return lhs.num() < rhs.num();
}

function numify(val) {
  return { num : function() { return val; }};
}



MolBase.prototype.assembly = function(id) {
  var assemblies = this.assemblies();
  for (var i = 0; i < assemblies.length; ++i) {
    if (assemblies[i].name() === id) {
      return assemblies[i];
    }
  }
  return null;
};


function ChainBase() {

}

ChainBase.prototype.eachAtom = function(callback, index) {
  index |= 0;
  for (var i = 0; i< this._residues.length; i+=1) {
    index = this._residues[i].eachAtom(callback, index);
    if (index === false) {
      return false;
    }
  }
  return index;
};

ChainBase.prototype.atomCount = function() {
  var count = 0;
  var residues = this.residues();
  for (var ri = 0; ri < residues.length; ++ri) {
    count+= residues[ri].atoms().length;
  }
  return count;
};

ChainBase.prototype.eachResidue = function(callback) {
  for (var i = 0; i < this._residues.length; i+=1) {
    if (callback(this._residues[i]) === false) {
      return false;
    }
  }
};



ChainBase.prototype.residues = function() { return this._residues; };

ChainBase.prototype.structure = function() { return this._structure; };


ChainBase.prototype.asView = function() {
  var view = new MolView(this.structure().full());
  view.addChain(this, true);
  return view;

};

ChainBase.prototype.residueByRnum = function(rnum) {
  var residues = this.residues();
  if (this._rnumsOrdered) {
    var index = binarySearch(residues, numify(rnum), rnumComp);
    if (index === -1) {
      return null;
    }
    return residues[index];
  } else {
    for (var i = 0; i < residues.length; ++i) {
      if (residues[i].num() === rnum) {
        return residues[i];
      }
    }
    return null;
  }
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
    if (callback(this._atoms[i], index) === false) {
      return false;
    }
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
    return null;
  }
  if (index_or_name >= this._atoms.length && index_or_name < 0) {
    return null;
  }
  return this._atoms[index_or_name]; 
};

// CA for amino acids, P for nucleotides, nucleosides
ResidueBase.prototype.centralAtom = function() {
  if (this.isAminoacid()) {
    return this.atom('CA');
  }
  if (this.isNucleotide()) {
    return this.atom('C3\'');
  }
  return null;
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
  return this._isAminoacid;
};

ResidueBase.prototype.isNucleotide = function() { 
  return this._isNucleotide;
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

AtomBase.prototype.bondCount = function() { return this.bonds().length; };
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
  this._assemblies = [];
  this._pv = pv;
  this._nextAtomIndex = 0;
}

derive(Mol, MolBase);



Mol.prototype.addAssembly = function(assembly) { 
  this._assemblies.push(assembly); 
};

Mol.prototype.setAssemblies = function(assemblies) { 
  this._assemblies = assemblies; 
};

Mol.prototype.assemblies = function() { return this._assemblies; };

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

// determine connectivity structure. for simplicity only connects atoms of the 
// same residue and peptide bonds
Mol.prototype.deriveConnectivity = function() {
  console.time('Mol.deriveConnectivity');
  var this_structure = this;
  var prevResidue = null;
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
    res._deduceType();
    if (prevResidue !== null) {
      if (res.isAminoacid() && prevResidue.isAminoacid()) {
        connectPeptides(this_structure, prevResidue, res);
      }
      if (res.isNucleotide() && prevResidue.isNucleotide()) {
        connectNucleotides(this_structure, prevResidue, res);
      }
    }
    prevResidue = res;
  });
  console.timeEnd('Mol.deriveConnectivity');
};

function Chain(structure, name) {
  ChainBase.prototype.constructor.call(this);
  this._structure = structure;
  this._name = name;
  this._cachedTraces = [];
  this._residues = [];
  this._rnumsOrdered = true;
}

derive(Chain, ChainBase);

Chain.prototype.name = function() { return this._name; };

Chain.prototype.full = function() { return this; };

Chain.prototype.addResidue = function(name, num, insCode) {
  insCode = insCode || '\0';
  var residue = new Residue(this, name, num, insCode);
  if (this._residues.length > 0 && this._rnumsOrdered) {
    var combinedRNum = rnumInsCodeHash(num, insCode);
    var last = this._residues[this._residues.length-1];
    var lastCombinedRNum = rnumInsCodeHash(last.num(),last.insCode());
    this._rnumsOrdered = lastCombinedRNum < combinedRNum;
  }
  this._residues.push(residue);
  return residue;
};


Chain.prototype.residuesInRnumRange = function(start, end) {
  // FIXME: this currently only works with the numeric part, insertion
  // codes are not honoured.
  var matching = [];
  var i, e;
  if (this._rnumsOrdered === true) {
    // binary search our way to heaven
    var startIdx = indexFirstLargerEqualThan(this._residues, numify(start), 
                                             rnumComp);
    if (startIdx === -1) {
      return matching;
    }
    var endIdx = indexLastSmallerEqualThan(this._residues, numify(end), 
                                           rnumComp);
    if (endIdx === -1) {
      return matching;
    }
    for (i = startIdx; i <= endIdx; ++i) {
      matching.push(this._residues[i]);
    }
  } else {
    for (i = 0, e = this._residues.length; i !== e; ++i) {
      var res = this._residues[i];
      if (res.num() >= start && res.num() <= end) {
        matching.push(res);
      }
    }
  }
  return matching;
};

// assigns secondary structure to residues in range from_num to to_num.
Chain.prototype.assignSS = function(fromNumAndIns, toNumAndIns, ss) {
  // FIXME: when the chain numbers are completely ordered, perform binary 
  // search to identify range of residues to assign secondary structure to.
  var from = rnumInsCodeHash(fromNumAndIns[0], fromNumAndIns[1]);
  var to = rnumInsCodeHash(toNumAndIns[0], toNumAndIns[1]);
  for (var i = 1; i < this._residues.length-1; ++i) {
    var res = this._residues[i];
    // FIXME: we currently don't set the secondary structure of the first and 
    // last residue of helices and sheets. that takes care of better 
    // transitions between coils and helices. ideally, this should be done
    // in the cartoon renderer, NOT in this function.
    var combined = rnumInsCodeHash(res.num(), res.insCode());
    if (combined <=  from || combined >= to) {
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
  var stretch = new BackboneTrace();
  // true when the stretch consists of amino acid residues, false
  // if the stretch consists of nucleotides. 
  var aaStretch = null;
  for (var i = 0; i < this._residues.length; i+=1) {
    var residue = this._residues[i];
    var isAminoacid = residue.isAminoacid();
    var isNucleotide = residue.isNucleotide();
    if ((aaStretch  === true && !isAminoacid) ||
        (aaStretch === false && !isNucleotide) ||
        (aaStretch === null && !isNucleotide && !isAminoacid)) {
      // a break in the trace: push stretch if there were enough residues
      // in it and create new backbone trace.
      if (stretch.length() > 1) {
        this._cachedTraces.push(stretch);
      }
      aaStretch = null;
      stretch = new BackboneTrace();
      continue;
    }
    if (stretch.length() === 0) {
      stretch.push(residue);
      aaStretch = residue.isAminoacid();
      continue;
    }
    // these checks are on purpose more relaxed than the checks we use in 
    // deriveConnectivity(). We don't really care about correctness of bond 
    // lengths here. The only thing that matters is that the residues are 
    // more or less close so that they could potentially/ be connected.
    var prevAtom, thisAtom;
    if (aaStretch) {
      prevAtom = this._residues[i-1].atom('C');
      thisAtom = residue.atom('N');
    } else {
      prevAtom = this._residues[i-1].atom('O3\'');
      thisAtom = residue.atom('P');
    }
    var sqrDist = vec3.sqrDist(prevAtom.pos(), thisAtom.pos());
    if (Math.abs(sqrDist - 1.5*1.5) < 1) {
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

function Residue(chain, name, num, insCode) {
  ResidueBase.prototype.constructor.call(this);
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

derive(Residue, ResidueBase);

Residue.prototype._deduceType = function() {
  this._isNucleotide = this.atom('P')!== null && this.atom('C3\'') !== null;
  this._isAminoacid = this.atom('N') !== null && this.atom('CA') !== null && 
                      this.atom('C') !== null && this.atom('O') !== null;
};

Residue.prototype.name = function() { return this._name; };
Residue.prototype.insCode = function() { return this._insCode; };

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

MolView.prototype.assemblies = function() { return this._mol.assemblies(); };

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

ResidueView.prototype.insCode = function() { 
  return this._residue.insCode(); 
};
ResidueView.prototype.ss = function() { return this._residue.ss(); };
ResidueView.prototype.index = function() { return this._residue.index(); };
ResidueView.prototype.chain = function() { return this._chainView; };
ResidueView.prototype.name = function() { return this._residue.name(); };

ResidueView.prototype.atoms = function() { return this._atoms; };
ResidueView.prototype.qualifiedName = function() {
  return this._residue.qualifiedName();
};

ResidueView.prototype.containsResidue = function(residue) {
  return this._residue.full() === residue.full();
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



var zhangSkolnickSS = (function() {
  var posOne = vec3.create();
  var posTwo = vec3.create();
  return function(trace, i, distances, delta) {
    for (var j = Math.max(0, i-2); j <= i; ++j) {
      for (var k = 2;  k < 5; ++k) {
        if (j+k >= trace.length()) {
          continue;
        }
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

function traceAssignHelixSheet(trace) {
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
}


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
    chain.eachBackboneTrace(traceAssignHelixSheet);
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
exports.mol.assignHelixSheet = assignHelixSheet;

return true;

})(this);
