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

// contains the standard residue data which is represented using a dictionary
// in the compressed structure file. atoms of a certain residue are sorted 
// according to the ordinal defined in the mmCIF components dictionary. 
var STANDARD_RESIDUES = [
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["OXT", "O"], ["H", "H"], ["H2", "H"], ["HA", "H"], ["HB1", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HXT", "H"]], "name": "ALA"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD", "C"], ["NE", "N"], ["CZ", "C"], ["NH1", "N"], 
            ["NH2", "N"], ["OXT", "O"], ["H", "H"], ["H2", "H"], ["HA", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HG2", "H"], ["HG3", "H"], 
            ["HD2", "H"], ["HD3", "H"], ["HE", "H"], ["HH11", "H"], 
            ["HH12", "H"], ["HH21", "H"], ["HH22", "H"], ["HXT", "H"]], 
           "name": "ARG"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["OD1", "O"], ["ND2", "N"], ["OXT", "O"], ["H", "H"], 
            ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], 
            ["HD21", "H"], ["HD22", "H"], ["HXT", "H"]], "name": "ASN"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["OD1", "O"], ["OD2", "O"], ["OXT", "O"], ["H", "H"], 
            ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], ["HD2", "H"], 
            ["HXT", "H"]], "name": "ASP"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["SG", "S"], ["OXT", "O"], ["H", "H"], ["H2", "H"], ["HA", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HG", "H"], ["HXT", "H"]], 
             "name": "CYS"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD", "C"], ["OE1", "O"], ["NE2", "N"], ["OXT", "O"], 
            ["H", "H"], ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], 
            ["HG2", "H"], ["HG3", "H"], ["HE21", "H"], ["HE22", "H"], 
            ["HXT", "H"]], "name": "GLN"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD", "C"], ["OE1", "O"], ["OE2", "O"], ["OXT", "O"], 
            ["H", "H"], ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], 
            ["HG2", "H"], ["HG3", "H"], ["HE2", "H"], ["HXT", "H"]], 
            "name": "GLU"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["OXT", "O"], 
            ["H", "H"], ["H2", "H"], ["HA2", "H"], ["HA3", "H"], 
            ["HXT", "H"]], "name": "GLY"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["ND1", "N"], ["CD2", "C"], ["CE1", "C"], 
            ["NE2", "N"], ["OXT", "O"], ["H", "H"], ["H2", "H"], ["HA", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HD1", "H"], ["HD2", "H"], 
            ["HE1", "H"], ["HE2", "H"], ["HXT", "H"]], "name": "HIS"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG1", "C"], ["CG2", "C"], ["CD1", "C"], ["OXT", "O"], 
            ["H", "H"], ["H2", "H"], ["HA", "H"], ["HB", "H"], ["HG12", "H"], 
            ["HG13", "H"], ["HG21", "H"], ["HG22", "H"], ["HG23", "H"], 
            ["HD11", "H"], ["HD12", "H"], ["HD13", "H"], ["HXT", "H"]], 
            "name": "ILE"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD1", "C"], ["CD2", "C"], ["OXT", "O"], ["H", "H"], 
            ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], ["HG", "H"], 
            ["HD11", "H"], ["HD12", "H"], ["HD13", "H"], ["HD21", "H"], 
            ["HD22", "H"], ["HD23", "H"], ["HXT", "H"]], "name": "LEU"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD", "C"], ["CE", "C"], ["NZ", "N"], ["OXT", "O"], 
            ["H", "H"], ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], 
            ["HG2", "H"], ["HG3", "H"], ["HD2", "H"], ["HD3", "H"], 
            ["HE2", "H"], ["HE3", "H"], ["HZ1", "H"], ["HZ2", "H"], 
            ["HZ3", "H"], ["HXT", "H"]], "name": "LYS"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["SD", "S"], ["CE", "C"], ["OXT", "O"], ["H", "H"], 
            ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], ["HG2", "H"], 
            ["HG3", "H"], ["HE1", "H"], ["HE2", "H"], ["HE3", "H"], 
            ["HXT", "H"]], "name": "MET"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD1", "C"], ["CD2", "C"], ["CE1", "C"], ["CE2", "C"], 
            ["CZ", "C"], ["OXT", "O"], ["H", "H"], ["H2", "H"], ["HA", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HD1", "H"], ["HD2", "H"], ["HE1", "H"], 
            ["HE2", "H"], ["HZ", "H"], ["HXT", "H"]], "name": "PHE"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD", "C"], ["OXT", "O"], ["H", "H"], ["HA", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HG2", "H"], ["HG3", "H"], 
            ["HD2", "H"], ["HD3", "H"], ["HXT", "H"]], "name": "PRO"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["OG", "O"], ["OXT", "O"], ["H", "H"], ["H2", "H"], ["HA", "H"], 
            ["HB2", "H"], ["HB3", "H"], ["HG", "H"], ["HXT", "H"]], 
            "name": "SER"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["OG1", "O"], ["CG2", "C"], ["OXT", "O"], ["H", "H"], ["H2", "H"], 
            ["HA", "H"], ["HB", "H"], ["HG1", "H"], ["HG21", "H"], 
            ["HG22", "H"], ["HG23", "H"], ["HXT", "H"]], "name": "THR"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD1", "C"], ["CD2", "C"], ["NE1", "N"], ["CE2", "C"], 
            ["CE3", "C"], ["CZ2", "C"], ["CZ3", "C"], ["CH2", "C"], ["OXT", "O"], 
            ["H", "H"], ["H2", "H"], ["HA", "H"], ["HB2", "H"], ["HB3", "H"], 
            ["HD1", "H"], ["HE1", "H"], ["HE3", "H"], ["HZ2", "H"], ["HZ3", "H"], 
            ["HH2", "H"], ["HXT", "H"]], "name": "TRP"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG", "C"], ["CD1", "C"], ["CD2", "C"], ["CE1", "C"], ["CE2", "C"], 
            ["CZ", "C"], ["OH", "O"], ["OXT", "O"], ["H", "H"], ["H2", "H"], 
            ["HA", "H"], ["HB2", "H"], ["HB3", "H"], ["HD1", "H"], ["HD2", "H"], 
            ["HE1", "H"], ["HE2", "H"], ["HH", "H"], ["HXT", "H"]], "name": "TYR"}, 
 {"atoms": [["N", "N"], ["CA", "C"], ["C", "C"], ["O", "O"], ["CB", "C"], 
            ["CG1", "C"], ["CG2", "C"], ["OXT", "O"], ["H", "H"], ["H2", "H"], 
            ["HA", "H"], ["HB", "H"], ["HG11", "H"], ["HG12", "H"], 
            ["HG13", "H"], ["HG21", "H"], ["HG22", "H"], ["HG23", "H"], 
            ["HXT", "H"]], "name": "VAL"}
];

function CsfReader(data) {
  this._data = data;
  this._toc = null;
  this._offset = 0;
}

CsfReader.prototype.read = function() {
  // read table of contents
  this._version = this._readHeader();
  if (this._version === null) {
    return null;
  }
  this._toc = this._readTableOfContents();
  if (!this._toc) {
    return null;
  }
  // read structure section
  return this._readStructure();
};

CsfReader.prototype._setReadPosition = function(offset) {
  this._offset = offset;
};

CsfReader.prototype._readStructure = function() {
  var structure = new mol.Mol();
  for (var i = 0; i < this._toc.length; ++i) {
    var entry = this._toc[i];
    if (!this._readChain(structure, entry)) {
      return null;
    }
  }
  return structure;
};

CsfReader.prototype._readChain = function(structure, entry) {
  this._setReadPosition(entry.offset);
  var chain = structure.addChain(entry.chainName);
  var residueCount =  this._readUint32();
  for (var i =0; i < residueCount; ++i) {
    this._readResidue(chain);
  }
  return true;
};

CsfReader.prototype._readInt16 = function() {
  var data = this._data.getInt16(this._offset);
  this._offset += 2;
  return data;
};

CsfReader.prototype._readInt16Vec = function() {
  return [this._readInt16(), this._readInt16(), this._readInt16()];
}

CsfReader.prototype._readResidue = function(chain) {
  var flags = this._readUint8();
  var DICT_BIT = 0x01;
  var HELICAL_BIT = 0x02;
  var EXTENDED_BIT = 0x04;
  var dictResidue = flags & DICT_BIT;
  var ssType = 'C';
  if (flags & HELICAL_BIT) {
    ssType = 'H';
  }
  if (flags & EXTENDED_BIT) {
    ssType = 'E';
  }
  var number = this._readInt32();
  if (dictResidue) {
    var index = this._readUint8();
    var dict = STANDARD_RESIDUES[index];
    var name = dict.name;
    var residueCenter = this._readInt16Vec();
    var residue = chain.addResidue(name, number);
    residue.setSS(ssType);
    // handle dictionary residue
    var atomCount = this._readUint8();
    for (var i = 0; i < atomCount; ++i) {
      this._readDictAtom(residue, residueCenter, dict);
    }
    return true;
  } 
  var name = this._readShortString();
  var residue = chain.addResidue(name, number);
  residue.setSS(ssType);
  var residueCenter = this._readInt16Vec();
  var atomCount = this._readUint8();
  for (var i = 0; i < atomCount; ++i) {
    this._readAtom(residue, residueCenter);
  }
  return true;
}

CsfReader.prototype._readAtomPos = function(residueCenter) {
  var relativePos = this._readInt16Vec();
  var oneOver256 = 1.0/256;
  return [
    residueCenter[0] + relativePos[0] * oneOver256,
    residueCenter[1] + relativePos[1] * oneOver256,
    residueCenter[2] + relativePos[2] * oneOver256
  ];
};

CsfReader.prototype._readAtom = function(residue, residueCenter) {
  var name = this._readShortString();
  var element = this._readShortString();
  var pos = this._readAtomPos(residueCenter);
  residue.addAtom(name, pos, element);
};

CsfReader.prototype._readDictAtom = function(residue, residueCenter, dict) {
  var ordinal = this._readUint8();
  var nameAndElement = dict.atoms[ordinal];
  var pos = this._readAtomPos(residueCenter);
  residue.addAtom(nameAndElement[0], pos, nameAndElement[1]);
};

CsfReader.prototype._readShortString = function() {
  var string = '';
  var length = this._readUint8();
  for (var i = 0; i < length; ++i) {
    string += this._readChar();
  }
  return string;
}

CsfReader.prototype._readUint8 = function() {
  var result = this._data.getUint8(this._offset);
  this._offset += 1;
  return result;
};

CsfReader.prototype._readChar = function() {
  return String.fromCharCode(this._readUint8());
};

CsfReader.prototype._readUint16 = function() {
  var result = this._data.getUint16(this._offset);
  this._offset += 2;
  return result;
};

CsfReader.prototype._readUint32 = function() {
  var result = this._data.getUint32(this._offset);
  this._offset += 4;
  return result;
};

CsfReader.prototype._readInt32 = function() {
  var result = this._data.getInt32(this._offset);
  this._offset += 4;
  return result;
}

CsfReader.prototype._readHeader = function() {
  var magicWord = '';
  for (var i = 0; i < 3; ++i) {
      magicWord += this._readChar();
  }
  if (magicWord !== 'CSF') {
    console.error('wrong magic number at beginning of CSF file');
    return  null;
  }
  var version = this._readUint8();
  if (version !== 1) {
    console.error('I only understand version 1 CSF files');
  }
  return version;
};

CsfReader.prototype._readTableOfContents = function() {
  var chainCount = this._readUint16();
  var toc = [];
  for (var i =0; i < chainCount; ++i) {
    var chainName = this._readChar();
    var offset = this._readUint32();
    var size = this._readUint32();
    toc.push({ name :chainName, offset : offset, size: size });
  }
  return toc;
};

if (exports.io === undefined) {
  exports.io = { };
}
exports.io.CsfReader = CsfReader;

}(this));

