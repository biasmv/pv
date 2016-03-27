define(function() {

function fulfillsPredicates(obj, predicates) {
  for (var i = 0; i < predicates.length; ++i) {
    if (!predicates[i](obj)) {
      return false;
    }
  }
  return true;
}

function _atomPredicates(dict) {
  var predicates = [];
  if (dict.aname !== undefined) {
    predicates.push(function(a) { return a.name() === dict.aname; });
  }
  if (dict.hetatm !== undefined) {
    predicates.push(function(a) { return a.isHetatm() === dict.hetatm; });
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
}

// extracts the residue predicates from the dictionary. 
// ignores rindices, rindexRange because they are handled separately.
function _residuePredicates(dict) {
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
  if (dict.rnum !== undefined) {
    predicates.push(function(r) {
      return r.num() === dict.rnum;
    });
  }
  if (dict.rtype !== undefined) {
    predicates.push(function(r) {
      return r.ss() === dict.rtype;
    });
  }
  return predicates;
}

function _chainPredicates(dict) {
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
}


// handles all residue predicates that can be done through either index-
// based lookups, or optimized searches of some sorts.
function _filterResidues(chain, dict) {
  var residues = chain.residues();
  if (dict.rnumRange) {
    residues =
        chain.residuesInRnumRange(dict.rnumRange[0], dict.rnumRange[1]);
  }
  var selResidues = [], i, e;
  if (dict.rindexRange !== undefined) {
    for (i = dict.rindexRange[0],
        e = Math.min(residues.length - 1, dict.rindexRange[1]);
        i <= e; ++i) {
      selResidues.push(residues[i]);
    }
    return selResidues;
  } 
  if (dict.rindices) {
    if (dict.rindices.length !== undefined) {
      selResidues = [];
      for (i = 0; i < dict.rindices.length; ++i) {
        selResidues.push(residues[dict.rindices[i]]);
      }
      return selResidues;
    }
  }
  return residues;
}

// helper function to perform selection by predicates
function dictSelect(structure, view, dict) {
  var residuePredicates = _residuePredicates(dict);
  var atomPredicates = _atomPredicates(dict);
  var chainPredicates = _chainPredicates(dict);

  if (dict.rindex) {
    dict.rindices = [dict.rindex];
  }
  for (var ci = 0; ci < structure._chains.length; ++ci) {
    var chain = structure._chains[ci];
    if (!fulfillsPredicates(chain, chainPredicates)) {
      continue;
    }
    var residues = _filterResidues(chain, dict);
    var chainView = null;
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
}


function polymerSelect(structure, view) {
  for (var ci = 0; ci < structure._chains.length; ++ci) {
    var chain = structure._chains[ci];
    var traces = chain.backboneTraces();
    if (traces.length === 0) {
      continue;
    }
    var chainView = view.addChain(chain);
    for (var bi = 0; bi < traces.length; ++bi) {
      var residues = traces[bi].residues();
      for (var ri = 0; ri < residues.length; ++ri) {
        chainView.addResidue(residues[ri], true);
      }
    }
  }
  return view;
}

return {
  dict : dictSelect,
  polymer : polymerSelect
};

});
