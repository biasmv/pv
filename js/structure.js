var Structure = function() {
  var  self = {
    chains : []
  };
  return {
    addChain : function(name) {
      chain = Chain(name);
      self.chains.push(chain);
      return chain;
    },
    chains : function() { return self.chains; },
    each_atom : function(callback) {
      for (var i = 0; i < self.chains.length; i+=1) {
        self.chains[i].each_atom(callback);
      }
    }
  };
}

var Chain = function(name) {
  var self = {
    name : name,
    residues: []
  };
  return {
    name : function() { return self.name; },

    addResidue : function(name, num) {
      var residue = Residue(name, num);
      self.residues.push(residue);
      return residue;
    },
    residues : function() { return self.residues; }
  };
}

var Residue = function(name, num) {
  var self = {
       name : name,
       num : num,
       atoms : []
  };

  return {
    name : function() { return self.name; },
    num : function() { return self.num; },
    addAtom : function(name, pos, element) {
      var atom = Atom(name, pos, element);
      self.atoms.push(atom);
      return atom;
    },
    atoms : function() { return self.atoms; }
  }
}

var Atom = function(name, pos, element) {
  var self = {
     name : name,
     pos : pos,
     element : element
  };
  return {
    name : function() { return self.name; },
    pos : function() { return self.pos; },
    element : function() { return self.element; }
  };
}

// a truly minimalistic PDB parser. It will die as soon as the input is not well-formed.
// it only reas ATOM and HETATM records, everyting else is ignored. in case of multi-
// model files, only the first model is read.
var load_pdb = function(text) {
  
  var structure = Structure();
  var curr_chain = null;
  var curr_res = null;
  var curr_atom = null;
  
  function parse_and_add_atom(line, hetatm) {
    var chain_name = line[21];
    var res_name = line.substr(17, 3);
    var atom_name = line.substr(12, 4).trim();
    var rnum_num = parseInt(line.substr(22, 4));
    var ins_code = line[26];
    var update_residue = false;
    var update_chain = false;
    console.log(chain_name, res_name, atom_name, rnum_num, ins_code); 
    if (!curr_chain || curr_chain.name() != chain_name) {
      update_chain = true;
      update_residue = true;
    }
    if (!curr_res || curr_res.num() != rnum_num) {
      update_residue;
    }
    if (update_chain) {
      console.log('adding new chain', chain_name);
      curr_chain = structure.addChain(chain_name);
    }
    if (update_residue) {
      console.log('adding new residue', rnum_num, 'to chain', curr_chain.name());
      curr_res = curr_chain.addResidue(res_name, rnum_num);
    }
    var pos = [];
    for (var i=0;i<3;++i) {
      pos.push(parseFloat(line.substr(30+i*8, 8)));
    }
    curr_res.addAtom(atom_name, pos);
  }

  var lines = text.split(/\r\n|\r|\n/g);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.substr(0, 6) == 'ATOM  ') {
      parse_and_add_atom(line, false);
    }
    if (line.substr(0, 6) == 'HETATM') {
      parse_and_add_atom(line, true);
    }
    if (line.substr(0, 3) == 'END') {
      break;
    }
  }
  return structure;
};
