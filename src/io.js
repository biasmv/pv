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

function PDBReader() {
}

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

function Remark350Reader() {
  this._units = {};
  this._current = null;
}

Remark350Reader.prototype.assemblies = function() { 
  var assemblies = [];
  for (var c in this._units) {
    assemblies.push(this._units[c]);
  }
  return assemblies;
};

Remark350Reader.prototype.assembly = function(id) {
  return this._units[id];
};


Remark350Reader.prototype.nextLine = function(line) {
  line = line.substr(11);
  if (line[0] === 'B' && line.substr(0, 12) === 'BIOMOLECULE:') {
    var name =  line.substr(13).trim();
    this._current = {
      name: name, chains : [], matrices : []
    };
    this._units[name] =  this._current;
    return;
  }
  if (line.substr(0, 30) === 'APPLY THE FOLLOWING TO CHAINS:' ||
      line.substr(0, 30) === '                   AND CHAINS:') {
    var chains = line.substr(30).split(',');
    for (var i = 0; i < chains.length; ++i) {
      var trimmedChainName = chains[i].trim();
      if (trimmedChainName.length) {
        this._current.chains.push(trimmedChainName);
      }
    }
    return;
  }
  if (line.substr(0, 7) === '  BIOMT') {
    var row = parseInt(line[7], 10) - 1;
    if (row === 0) {
      this._current.matrices.push(mat4.create());
    }
    // FIXME: don't base matrix number of BIOMT1
    var x = parseFloat(line.substr(13, 9));
    var y = parseFloat(line.substr(23, 9));
    var z = parseFloat(line.substr(33, 9));
    var w = parseFloat(line.substr(46, 12).trim());
    var matrix =  this._current.matrices[this._current.matrices.length-1];
    matrix[4*row+0] = x;
    matrix[4*row+1] = y;
    matrix[4*row+2] = z;
    matrix[4*row+3] = w;
    return;
  }
};

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
  var structure = new mol.Mol();
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
    var resName = line.substr(17, 3).trim();
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
      currRes = currChain.addResidue(resName, rnumNum,
                                       currChain.residues().length);
    }
    var pos = vec3.create();
    for (var i=0;i<3;++i) {
      pos[i] = (parseFloat(line.substr(30+i*8, 8)));
    }
    currRes.addAtom(atomName, pos, line.substr(76, 2).trim());
  }
  var biounitReader = new Remark350Reader();
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
    if (recordName === 'REMARK') {
      // for now we are only interested in the biological assembly information
      // contained in remark 350.
      var remarkNumber = line.substr(7, 3);
      if (remarkNumber === '350') {
        biounitReader.nextLine(line);
      }
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

exports.io = {};
exports.io.pdb = pdb
exports.io.Remark350Reader = Remark350Reader;
}(this));

