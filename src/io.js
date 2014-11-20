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


function Remark350Reader() {
  this._assemblies = {};
  this._current = null;
}

Remark350Reader.prototype.assemblies = function() { 
  var assemblies = [];
  for (var c in this._assemblies) {
    assemblies.push(this._assemblies[c]);
  }
  return assemblies;
};

Remark350Reader.prototype.assembly = function(id) {
  return this._assemblies[id];
};


Remark350Reader.prototype.nextLine = function(line) {
  line = line.substr(11);
  if (line[0] === 'B' && line.substr(0, 12) === 'BIOMOLECULE:') {
    var name =  line.substr(13).trim();
    this._currentAssembly = new Assembly(name); 
    this._assemblies[name] =  this._currentAssembly;
    return;
  }
  if (line.substr(0, 30) === 'APPLY THE FOLLOWING TO CHAINS:' ||
      line.substr(0, 30) === '                   AND CHAINS:') {
    var chains = line.substr(30).split(',');
    if (line[0] === 'A') {
      this._currentSymGen = new SymGenerator();
      this._currentAssembly.addGenerator(this._currentSymGen);
    }
    this._currentMatrix = mat4.create();
    for (var i = 0; i < chains.length; ++i) {
      var trimmedChainName = chains[i].trim();
      if (trimmedChainName.length) {
        this._currentSymGen.addChain(trimmedChainName);
      }
    }
    return;
  }
  if (line.substr(0, 7) === '  BIOMT') {
    var col = parseInt(line[7], 10) - 1;
    var offset = 0;
    // for PDB files with 100 or more BIOMT matrices, the columns are 
    // shifted to the right by one digit (see PDB entry 1m4x, for 
    // example). The offset increases by one for every additional 
    // digit.
    while (line[12 + offset] !== ' ') {
      offset += 1;
    }
    var x = parseFloat(line.substr(13 + offset, 9));
    var y = parseFloat(line.substr(23 + offset, 9));
    var z = parseFloat(line.substr(33 + offset, 9));
    var w = parseFloat(line.substr(43 + offset, 14));
    var l = x*x + y*y + z*z;
    this._currentMatrix[4*0+col] = x;
    this._currentMatrix[4*1+col] = y;
    this._currentMatrix[4*2+col] = z;
    this._currentMatrix[4*3+col] = w;
    if (col === 2) {
      this._currentSymGen.addMatrix(this._currentMatrix);
      this._currentMatrix = mat4.create();
    }
    return;
  }
};

function PDBReader() {
  this._helices = [];
  this._sheets = [];
  this._structure = new mol.Mol();
  this._remark350Reader = new Remark350Reader();
  this._currChain =  null;
  this._currRes = null;
  this._currAtom = null;
}

PDBReader.prototype.parseHelixRecord = function(line) {
  var frstNum = parseInt(line.substr(21, 4), 10);
  var frstInsCode = line[25] === ' ' ? '\0' : line[25];
  var lastNum = parseInt(line.substr(33, 4), 10);
  var lastInsCode = line[37] === ' ' ? '\0' : line[37];
  var chainName = line[19];
  this._helices.push({ first : [frstNum, frstInsCode], 
           last : [lastNum, lastInsCode], chainName : chainName 
  });
  return true;
};

PDBReader.prototype.parseSheetRecord = function(line) {
  var frstNum = parseInt(line.substr(22, 4), 10);
  var frstInsCode = line[26] === ' ' ? '\0' : line[26];
  var lastNum = parseInt(line.substr(33, 4), 10);
  var lastInsCode = line[37] === ' ' ? '\0' : line[37];
  var chainName = line[21];
  this._sheets.push({ 
    first : [frstNum, frstInsCode],
    last : [lastNum, lastInsCode],
    chainName : chainName
  });
  return true;
};

PDBReader.prototype.parseAndAddAtom = function(line, hetatm) {
  var alt_loc = line[16];
  if (alt_loc !== ' ' && alt_loc !== 'A') {
    return true;
  }
  var chainName = line[21];
  var resName = line.substr(17, 3).trim();
  var atomName = line.substr(12, 4).trim();
  var rnumNum = parseInt(line.substr(22, 4), 10);
  var insCode = line[26] === ' ' ? '\0' : line[26];
  var updateResidue = false;
  var updateChain = false;
  if (!this._currChain || this._currChain.name() !== chainName) {
    updateChain = true;
    updateResidue = true;
  }
  if (!this._currRes || this._currRes.num() !== rnumNum || 
      this._currRes.insCode() !== insCode) {
    updateResidue = true;
  }
  if (updateChain) {
    // residues of one chain might appear interspersed with residues from
    // other chains.
    this._currChain = this._structure.chain(chainName) || 
                      this._structure.addChain(chainName);
  }
  if (updateResidue) {
    this._currRes = this._currChain.addResidue(resName, rnumNum, insCode);
  }
  var pos = vec3.create();
  for (var i=0;i<3;++i) {
    pos[i] = (parseFloat(line.substr(30+i*8, 8)));
  }
  this._currRes.addAtom(atomName, pos, line.substr(76, 2).trim());
  return true;
};

PDBReader.prototype.processLine = function(line) {
  var recordName = line.substr(0, 6);
  if (recordName === 'ATOM  ') {
    return this.parseAndAddAtom(line, false);
  }
  if (recordName === 'HETATM') {
    return this.parseAndAddAtom(line, true);
  }
  if (recordName === 'REMARK') {
    // for now we are only interested in the biological assembly information
    // contained in remark 350.
    var remarkNumber = line.substr(7, 3);
    if (remarkNumber === '350') {
      this._remark350Reader.nextLine(line);
    }
    return true;
  }
  if (recordName === 'HELIX ') {
    return this.parseHelixRecord(line);
  }
  if (recordName === 'SHEET ') {
    return this.parseSheetRecord(line);
  }
  if (recordName === 'END   ' || recordName === 'ENDMDL') {
    return false;
  }
  return true;
};

// assigns the secondary structure information found in the helix sheet records, 
// derives connectivity and assigns assembly information.
PDBReader.prototype.finish = function() {
  var chain = null;
  for (i = 0; i < this._sheets.length; ++i) {
    var sheet = this._sheets[i];
    chain = this._structure.chain(sheet.chainName);
    if (chain) {
      chain.assignSS(sheet.first, sheet.last, 'E');
    }
  }
  for (i = 0; i < this._helices.length; ++i) {
    var helix = this._helices[i];
    chain = this._structure.chain(helix.chainName);
    if (chain) {
      chain.assignSS(helix.first, helix.last, 'H');
    }
  }
  this._structure.setAssemblies(this._remark350Reader.assemblies());
  this._structure.deriveConnectivity();
  console.log('imported', this._structure.chains().length, 'chain(s),',
              this._structure.residueCount(), 'residue(s)');
  return this._structure;
};

// a truly minimalistic PDB parser. It will die as soon as the input is 
// not well-formed. it only reads ATOM, HETATM, HELIX, SHEET and REMARK 
// 350 records, everything else is ignored. in case of multi-model 
// files, only the first model is read.
//
// FIXME: load PDB currently spends a substantial amount of time creating
// the vec3 instances for the atom positions. it's possible that it's
// cheaper to initialize a bulk buffer once and create buffer views to
// that data for each atom position. since the atom's lifetime is bound to
// the parent structure, the buffer could be managed on that level and
// released once the structure is deleted.
function pdb(text) {
  console.time('pdb'); 
  var reader = new PDBReader();
  var lines = text.split(/\r\n|\r|\n/g);
  var i = 0;
  for (i = 0; i < lines.length; i++) {
    if (!reader.processLine(lines[i])) {
      break;
    }
  }
  var structure = reader.finish();
  console.timeEnd('pdb');
  return structure;
}


exports.io = {};
exports.io.pdb = pdb;
exports.io.Remark350Reader = Remark350Reader;


}(this));




