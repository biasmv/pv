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

(function(exports) {

"use strict";

function Remark350Reader() {
  this._assemblies = {};
  this._current = null;
}

Remark350Reader.prototype = {

  assemblies : function() { 
    var assemblies = [];
    for (var c in this._assemblies) {
      if (this._assemblies.hasOwnProperty(c)) {
        // We are sure that obj[key] belongs to the object and was not 
        // inherited.
        assemblies.push(this._assemblies[c]);
      }
    }
    return assemblies;
  },

  assembly : function(id) {
    return this._assemblies[id];
  },


  nextLine : function(line) {
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
  }
};

// Very simple heuristic to determine the element from the atom name.
// This at the very least assume that people have the decency to follow 
// the standard naming conventions for atom names when they are too 
// lazy to write down elements
function guessAtomElementFromName(fourLetterName) {
  if (fourLetterName[0] !== ' ') {
    var trimmed = fourLetterName.trim();
    if (trimmed.length === 4) {
      // look for first character in range A-Z or a-z and use that 
      // for the element. 
      var i = 0;
      var charCode = trimmed.charCodeAt(i);
      while (i < 4 && (charCode < 65 || charCode > 122 ||
             (charCode > 90 && charCode < 97))) {
        ++i;
        charCode = trimmed.charCodeAt(i);
      }
    }
    // when first character is not empty and length is smaller than 4,
    // assume it's a "heavy" atom and use the first two letters as the 
    // atom name. That's not always correct
    return trimmed.substr(0, 2);
  }
  return fourLetterName[1];
}

function PDBReader(options) {
  this._helices = [];
  this._sheets = [];
  this._conect = [];
  this._serialToAtomMap = {};
  this._structure = new mol.Mol();
  this._remark350Reader = new Remark350Reader();
  this._currChain =  null;
  this._currRes = null;
  this._currAtom = null;
  this._options = {};
  this._options.conectRecords = !!options.conectRecords;
}

PDBReader.prototype = {

  parseHelixRecord : function(line) {
    var frstNum = parseInt(line.substr(21, 4), 10);
    var frstInsCode = line[25] === ' ' ? '\0' : line[25];
    var lastNum = parseInt(line.substr(33, 4), 10);
    var lastInsCode = line[37] === ' ' ? '\0' : line[37];
    var chainName = line[19];
    this._helices.push({ first : [frstNum, frstInsCode], 
            last : [lastNum, lastInsCode], chainName : chainName 
    });
    return true;
  },

  parseSheetRecord : function(line) {
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
  },

  parseAndAddAtom : function(line) {
    var alt_loc = line[16];
    if (alt_loc !== ' ' && alt_loc !== 'A') {
      return true;
    }
    var chainName = line[21];
    var resName = line.substr(17, 3).trim();
    var fullAtomName = line.substr(12, 4);
    var atomName = fullAtomName.trim();
    var rnumNum = parseInt(line.substr(22, 4), 10);
    // check for NaN
    if (rnumNum !== rnumNum) {
      rnumNum = 1;
    }
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
    for (var i = 0; i < 3; ++i) {
      pos[i] = (parseFloat(line.substr(30 + i * 8, 8)));
    }
    var element = line.substr(76,2).trim();
    if (element === '') {
      element = guessAtomElementFromName(fullAtomName);
    }
    var atom = this._currRes.addAtom(atomName, pos, element);
    // in case parseConect records is set to true, store away the atom serial
    if (this._options.conectRecords) {
      var serial = parseInt(line.substr(6,5).trim(), 10);
      this._serialToAtomMap[serial] = atom;
    }
    return true;
  },
  parseConectRecord : function(line) {
    var atomSerial = parseInt(line.substr(6,5).trim(), 10);
    var bondPartnerIds = [];
    for (var i = 0; i < 4; ++i) {
      var partnerId = parseInt(line.substr(11 + i * 5, 6).trim(), 10);
      if (isNaN(partnerId)) {
        continue;
      }
      // bonds are listed twice, so to avoid duplicate bonds, only keep bonds 
      // with the lower serials as the first atom.
      if (partnerId > atomSerial) {
        continue;
      }
      bondPartnerIds.push(partnerId);
    }
    this._conect.push( { from : atomSerial, to : bondPartnerIds });
    return true;
  },

  processLine : function(line) {
    var recordName = line.substr(0, 6);
    if (recordName === 'ATOM  ' || recordName === 'HETATM') {
      return this.parseAndAddAtom(line);
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
    if (this._options.conectRecords && recordName === 'CONECT') {
      return this.parseConectRecord(line);
    }
    if (recordName === 'END   ' || recordName === 'ENDMDL') {
      return false;
    }
    return true;
  },

  // called after parsing to perform any work that requires the complete 
  // structure to be present:
  // (a) assigns the secondary structure information found in the helix 
  // sheet records, (b) derives connectivity and (c) assigns assembly 
  // information.
  finish : function() {
    var chain = null;
    var i;
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
    if (this._options.conectRecords) {
      this._assignBondsFromConectRecords(this._structure);
    }
    this._structure.deriveConnectivity();
    console.log('imported', this._structure.chains().length, 'chain(s),',
                this._structure.residueCount(), 'residue(s)');
    return this._structure;
  },
  _assignBondsFromConectRecords : function(structure) {
    for (var i = 0; i < this._conect.length; ++i) {
      var record = this._conect[i];
      var fromAtom = this._serialToAtomMap[record.from];
      for (var j = 0; j < record.to.length; ++j) {
        var toAtom = this._serialToAtomMap[record.to[j]];
        structure.connect(fromAtom, toAtom);
      }
    }
  },
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
function pdb(text, options) {
  console.time('pdb'); 
  var opts = options || {};
  var reader = new PDBReader(opts);
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

function fetchPdb(url, callback, options) {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", url, true);
  oReq.onload = function() {
    if (oReq.response) {
      var structure= io.pdb(oReq.response, options);
      callback(structure);
    }
  };
  oReq.send(null);
}

exports.io = {};
exports.io.pdb = pdb;
exports.io.Remark350Reader = Remark350Reader;
exports.io.fetchPdb = fetchPdb;


}(this));




