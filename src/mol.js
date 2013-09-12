(function(exports) {
"use strict";




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
  var count = 1;
  this.eachAtom(function(atom) {
    vec3.add(sum, sum, atom.pos());
    count+=1;
  });
  if (count) {
    vec3.scale(sum, sum, 1/count);
  }
  return sum;
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

// invokes a callback for each connected stretch of amino acids. these 
// stretches are used for all trace-based rendering styles, e.g. sline, 
// line_trace, tube, cartoon etc. 
ChainBase.prototype.eachBackboneTrace = function(callback) {
  var  stretch = [];
  for (var i = 0; i < this._residues.length; i+=1) {
    var residue = this._residues[i];
    if (!residue.isAminoacid()) {
      if (stretch.length > 1) {
        callback(stretch);
        stretch = [];
      }
      continue;
    }
    if (stretch.length === 0) {
      stretch.push(residue);
      continue;
    }
    var ca_prev = this._residues[i-1].atom('C');
    var n_this = residue.atom('N');
    if (Math.abs(vec3.sqrDist(ca_prev.pos(), n_this.pos()) - 1.5*1.5) < 1) {
      stretch.push(residue);
    } else {
      if (stretch.length > 1) {
        callback(stretch);
        stretch = [];
      }
    }
  }
  if (stretch.length > 1) {
    callback(stretch);
  }
};


// returns all connected stretches of amino acids found in this chain as 
// a list.
ChainBase.prototype.backboneTraces = function() {
  var traces = [];
  this.eachBackboneTrace(function(trace) { traces.push(trace); });
  return traces;

};

function ResidueBase() {

}

ResidueBase.prototype.isWater = function() {
  return this.name() == 'HOH' || this.name() == 'DOD';
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
  if (typeof index_or_name == 'string') {
    for (var i =0; i < this._atoms.length; ++i) {
     if (this._atoms[i].name() == index_or_name) {
       return this._atoms[i];
     }
    }
  }
  return this._atoms[index_or_name]; 
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

AtomBase.prototype.eachBond = function(callback) {
  for (var i = 0; i < this._bonds.length; ++i) {
    callback(this._bonds[i]);
  }
};

//-----------------------------------------------------------------------------
// Mol, Chain, Residue, Atom, Bond
//-----------------------------------------------------------------------------

function Mol(pv) {
  this._chains = [];
  this._pv = pv;
  this._nextAtomIndex = 0;
}

Mol.prototype = new MolBase();


Mol.prototype.chains = function() { return this._chains; };
Mol.prototype.full = function() { return this; };



Mol.prototype.residueSelect = function(predicate) {
  console.time('Mol.residueSelect');
  var view = new MolView(this);
  for (var ci = 0; ci < this._chains.length; ++ci) {
    var chain = this._chains[ci];
    var chain_view = null;
    var residues = chain.residues();
    for (var ri = 0; ri < residues.length; ++ri) {
      if (predicate(residues[ri])) {
        if (!chain_view) {
          chain_view = view.addChain(chain, false);
        }
        chain_view.addResidue(residues[ri], true);
      }
    }
  }
  console.timeEnd('Mol.residueSelect');
  return view;
};

Mol.prototype._atomPredicates = function(dict) {

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
Mol.prototype._residuePredicates = function(dict) {

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

Mol.prototype._chainPredicates = function(dict) {
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

Mol.prototype._dictSelect = function(dict) {
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
    }  else if (dict.rindex) {
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

Mol.prototype.select = function(what) {

  if (what == 'protein') {
    return this.residueSelect(function(r) { return r.isAminoacid(); });
  }
  if (what == 'water') {
    return this.residueSelect(function(r) { return r.isWater(); });
  }
  if (what == 'ligand') {
    return this.residueSelect(function(r) { 
      return !r.isAminoacid() && !r.isWater();
    });
  }
  // when what is not one of the simple strings above, we assume what
  // is a dictionary containing predicates which have to be fulfilled.
  return this._dictSelect(what);
};

Mol.prototype.chain = function(name) { 
  for (var i = 0; i < this._chains.length; ++i) {
    if (this._chains[i].name() == name) {
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
      for (var j = 0; j < i; j+=1) {
        sqr_dist = vec3.sqrDist(res.atom(i).pos(), res.atom(j).pos());
        if (sqr_dist < 1.6*1.6) {
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
  this._structure = structure;
  this._name = name;
  this._residues = [];
}

Chain.prototype = new ChainBase();

Chain.prototype.name = function() { return this._name; };

Chain.prototype.full = function() { return this; };

Chain.prototype.addResidue = function(name, num) {
  var residue = new Residue(this, name, num);
  this._residues.push(residue);
  return residue;
};

// assigns secondary structure to residues in range from_num to to_num.
Chain.prototype.assign_ss = function(from_num, to_num, ss) {
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
    res.set_ss(ss);
  }
};

function Residue(chain, name, num) {
  this._name = name;
  this._num = num;
  this._atoms = [];
  this._ss = 'C';
  this._chain = chain;
  this._index = chain.residues().length;
}

Residue.prototype = new ResidueBase();

Residue.prototype.name = function() { return this._name; };

Residue.prototype.num = function() { return this._num; };

Residue.prototype.full = function() { return this; };

Residue.prototype.addAtom = function(name, pos, element) {
  var atom = new Atom(this, name, pos, element, this.structure().nextAtomIndex());
  this._atoms.push(atom);
  return atom;
};

Residue.prototype.ss = function() { return this._ss; };
Residue.prototype.set_ss = function(ss) { this._ss = ss; };
Residue.prototype.index = function() { return this._index; };

Residue.prototype.atoms = function() { return this._atoms; };
Residue.prototype.chain = function() { return this._chain; };


Residue.prototype.structure = function() { 
  return this._chain.structure(); 
};

function Atom(residue, name, pos, element, index) {
  this._residue = residue;
  this._bonds = [];
  this._name = name;
  this._pos = pos;
  this._index = index;
  this._element = element;
}

Atom.prototype = new AtomBase();

Atom.prototype.addBond = function(bond) { this._bonds.push(bond); };
Atom.prototype.name = function() { return this._name; };
Atom.prototype.bonds = function() { return this._bonds; };
Atom.prototype.residue = function() { return this._residue; };
Atom.prototype.structure = function() { return this._residue.structure(); };
Atom.prototype.full = function() { return this; };

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
 this._mol = mol; 
 this._chains = [];
}

MolView.prototype = new MolBase();

MolView.prototype.full = function() { return this._mol; };

// add chain to view
MolView.prototype.addChain = function(chain, recurse) {
  var chain_view = new ChainView(this, chain.full());
  this._chains.push(chain_view);
  if (recurse) {
    var residues = chain.residues();
    for (var i = 0; i< residues.length; ++i) {
      chain_view.addResidue(residues[i], true);
    }
  }
  return chain_view;
};


MolView.prototype.chains = function() { return this._chains; };

function ChainView(mol_view, chain) {
  this._chain = chain;
  this._residues = [];
  this._mol_view = mol_view;

}


ChainView.prototype = new ChainBase();

ChainView.prototype.addResidue = function(residue, recurse) {
  var res_view = new ResidueView(this, residue.full());
  this._residues.push(res_view);
  if (recurse) {
    var atoms = residue.atoms();
    for (var i = 0; i < atoms.length; ++i) {
      res_view.addAtom(atoms[i].full());
    }
  }
  return res_view;
};

ChainView.prototype.full = function() { return this._chain; };

ChainView.prototype.structure = function() { return this._mol_view; };

function ResidueView(chain_view, residue) {
  this._chain_view = chain_view;
  this._atoms = [];
  this._residue = residue;
}

ResidueView.prototype = new ResidueBase();

ResidueView.prototype.addAtom = function(atom) {
  var atom_view = new AtomView(this, atom.full());
  this._atoms.push(atom_view);
};

ResidueView.prototype.full = function() { return this._residue; };
ResidueView.prototype.num = function() { return this._residue.num(); };
ResidueView.prototype.ss = function() { return this._residue.ss(); };
ResidueView.prototype.index = function() { return this._residue.index(); };
ResidueView.prototype.chain = function() { return this._chain_view; };

ResidueView.prototype.atoms = function() { return this._atoms; };


ChainView.prototype.name = function () { return this._chain.name(); };

function AtomView(res_view, atom) {
  this._res_view = res_view;
  this._atom = atom;
  this._bonds = [];
}


AtomView.prototype = new AtomBase();
AtomView.prototype.full = function() { return this._atom; };
AtomView.prototype.name = function() { return this._atom.name(); };
AtomView.prototype.pos = function() { return this._atom.pos(); };
AtomView.prototype.element = function() { return this._atom.element(); };
AtomView.prototype.residue = function() { return this._res_view; };
AtomView.prototype.bonds = function() { return this._bonds; };
AtomView.prototype.index = function() { return this._atom.index(); };


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
    if (alt_loc!=' ' && alt_loc!='A') {
      return;
    }
    var chainName = line[21];
    var res_name = line.substr(17, 3);
    var atomName = line.substr(12, 4).trim();
    var rnumNum = parseInt(line.substr(22, 4), 10);
    var ins_code = line[26];
    var updateResidue = false;
    var updateChain = false;
    if (!currChain || currChain.name() != chainName) {
      updateChain = true;
      updateResidue = true;
    }
    if (!currRes || currRes.num() != rnumNum) {
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

    if (recordName == 'ATOM  ') {
      parseAndAddAtom(line, false);
      continue;
    }
    if (recordName == 'HETATM') {
      parseAndAddAtom(line, true);
      continue;
    }
    if (recordName == 'HELIX ') {
      helices.push(parseHelixRecord(line));
      continue;
    }
    if (recordName == 'SHEET ') {
      sheets.push(parseSheetRecord(line));
      continue;
    }
    if (recordName == 'END') {
      break;
    }
  }
  var chain = null;
  for (i = 0; i < sheets.length; ++i) {
    var sheet = sheets[i];
    chain = structure.chain(sheet.chainName);
    if (chain) {
      chain.assign_ss(sheet.first, sheet.last, 'E');
    }
  }
  for (i = 0; i < helices.length; ++i) {
    var helix = helices[i];
    chain = structure.chain(helix.chainName);
    if (chain) {
      chain.assign_ss(helix.first, helix.last, 'H');
    }
  }
  structure.deriveConnectivity();
  console.timeEnd('PV.pdb');

  return structure;
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

return true;

})(this);
