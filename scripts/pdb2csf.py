#!/usr/bin/env ost
"""
Converts a PDB file to a compressed structure file. Compressed structure files 
are a representation of molecular information using as little space as possible

The CSF is not entirely lossless but trades some precision with the ability to
use less space. This means that the format should never be used as the sole 
storage of a molecular structure but rather as an secondary storage format.

Oh, and there are many PDBisms in the format, because let's face it, that's
the only format that really matters right now and it's probably a few years to
go until that changes.

The format only works when the PDB files is completely up to spec.

I did a search on the net and could not find any file format with these 
properties, so here we go!
"""

import sys
import os
from struct import pack 
MAPPING = [
    { "C": 2, "CA": 1, "CB": 4, "H": 6, "H2": 7, "HA": 8, "HB1": 9, "HB2": 10, "HB3": 11, "HXT": 12, "N": 0, "O": 3, "OXT": 5},
    {"C": 2, "CA": 1, "CB": 4, "CD": 6, "CG": 5, "CZ": 8, "H": 12, "H2": 13, "HA": 14, "HB2": 15, "HB3": 16, "HD2": 19, "HD3": 20, "HE": 21, "HG2": 17, "HG3": 18, "HH11": 22, "HH12": 23, "HH21": 24, "HH22": 25, "HXT": 26, "N": 0, "NE": 7, "NH1": 9, "NH2": 10, "O": 3, "OXT": 11},
    {"C": 2, "CA": 1, "CB": 4, "CG": 5, "H": 9, "H2": 10, "HA": 11, "HB2": 12, "HB3": 13, "HD21": 14, "HD22": 15, "HXT": 16, "N": 0, "ND2": 7, "O": 3, "OD1": 6, "OXT": 8},
    {"C": 2, "CA": 1, "CB": 4, "CG": 5, "H": 9, "H2": 10, "HA": 11, "HB2": 12, "HB3": 13, "HD2": 14, "HXT": 15, "N": 0, "O": 3, "OD1": 6, "OD2": 7, "OXT": 8},
    {"C": 2, "CA": 1, "CB": 4, "H": 7, "H2": 8, "HA": 9, "HB2": 10, "HB3": 11, "HG": 12, "HXT": 13, "N": 0, "O": 3, "OXT": 6, "SG": 5},
    {"C": 2, "CA": 1, "CB": 4, "CD": 6, "CG": 5, "H": 10, "H2": 11, "HA": 12, "HB2": 13, "HB3": 14, "HE21": 17, "HE22": 18, "HG2": 15, "HG3": 16, "HXT": 19, "N": 0, "NE2": 8, "O": 3, "OE1": 7, "OXT": 9},
    {"C": 2, "CA": 1, "CB": 4, "CD": 6, "CG": 5, "H": 10, "H2": 11, "HA": 12, "HB2": 13, "HB3": 14, "HE2": 17, "HG2": 15, "HG3": 16, "HXT": 18, "N": 0, "O": 3, "OE1": 7, "OE2": 8, "OXT": 9},
    {"C": 2, "CA": 1, "H": 5, "H2": 6, "HA2": 7, "HA3": 8, "HXT": 9, "N": 0, "O": 3, "OXT": 4},
    {"C": 2, "CA": 1, "CB": 4, "CD2": 7, "CE1": 8, "CG": 5, "H": 11, "H2": 12, "HA": 13, "HB2": 14, "HB3": 15, "HD1": 16, "HD2": 17, "HE1": 18, "HE2": 19, "HXT": 20, "N": 0, "ND1": 6, "NE2": 9, "O": 3, "OXT": 10},
    {"C": 2, "CA": 1, "CB": 4, "CD1": 7, "CG1": 5, "CG2": 6, "H": 9, "H2": 10, "HA": 11, "HB": 12, "HD11": 18, "HD12": 19, "HD13": 20, "HG12": 13, "HG13": 14, "HG21": 15, "HG22": 16, "HG23": 17, "HXT": 21, "N": 0, "O": 3, "OXT": 8},
    {"C": 2, "CA": 1, "CB": 4, "CD1": 6, "CD2": 7, "CG": 5, "H": 9, "H2": 10, "HA": 11, "HB2": 12, "HB3": 13, "HD11": 15, "HD12": 16, "HD13": 17, "HD21": 18, "HD22": 19, "HD23": 20, "HG": 14, "HXT": 21, "N": 0, "O": 3, "OXT": 8},
    {"C": 2, "CA": 1, "CB": 4, "CD": 6, "CE": 7, "CG": 5, "H": 10, "H2": 11, "HA": 12, "HB2": 13, "HB3": 14, "HD2": 17, "HD3": 18, "HE2": 19, "HE3": 20, "HG2": 15, "HG3": 16, "HXT": 24, "HZ1": 21, "HZ2": 22, "HZ3": 23, "N": 0, "NZ": 8, "O": 3, "OXT": 9},
    {"C": 2, "CA": 1, "CB": 4, "CE": 7, "CG": 5, "H": 9, "H2": 10, "HA": 11, "HB2": 12, "HB3": 13, "HE1": 16, "HE2": 17, "HE3": 18, "HG2": 14, "HG3": 15, "HXT": 19, "N": 0, "O": 3, "OXT": 8, "SD": 6},
    {"C": 2, "CA": 1, "CB": 4, "CD1": 6, "CD2": 7, "CE1": 8, "CE2": 9, "CG": 5, "CZ": 10, "H": 12, "H2": 13, "HA": 14, "HB2": 15, "HB3": 16, "HD1": 17, "HD2": 18, "HE1": 19, "HE2": 20, "HXT": 22, "HZ": 21, "N": 0, "O": 3, "OXT": 11},
    {"C": 2, "CA": 1, "CB": 4, "CD": 6, "CG": 5, "H": 8, "HA": 9, "HB2": 10, "HB3": 11, "HD2": 14, "HD3": 15, "HG2": 12, "HG3": 13, "HXT": 16, "N": 0, "O": 3, "OXT": 7},
    {"C": 2, "CA": 1, "CB": 4, "H": 7, "H2": 8, "HA": 9, "HB2": 10, "HB3": 11, "HG": 12, "HXT": 13, "N": 0, "O": 3, "OG": 5, "OXT": 6},
    {"C": 2, "CA": 1, "CB": 4, "CG2": 6, "H": 8, "H2": 9, "HA": 10, "HB": 11, "HG1": 12, "HG21": 13, "HG22": 14, "HG23": 15, "HXT": 16, "N": 0, "O": 3, "OG1": 5, "OXT": 7},
    {"C": 2, "CA": 1, "CB": 4, "CD1": 6, "CD2": 7, "CE2": 9, "CE3": 10, "CG": 5, "CH2": 13, "CZ2": 11, "CZ3": 12, "H": 15, "H2": 16, "HA": 17, "HB2": 18, "HB3": 19, "HD1": 20, "HE1": 21, "HE3": 22, "HH2": 25, "HXT": 26, "HZ2": 23, "HZ3": 24, "N": 0, "NE1": 8, "O": 3, "OXT": 14},
    {"C": 2, "CA": 1, "CB": 4, "CD1": 6, "CD2": 7, "CE1": 8, "CE2": 9, "CG": 5, "CZ": 10, "H": 13, "H2": 14, "HA": 15, "HB2": 16, "HB3": 17, "HD1": 18, "HD2": 19, "HE1": 20, "HE2": 21, "HH": 22, "HXT": 23, "N": 0, "O": 3, "OH": 11, "OXT": 12},
    {"C": 2, "CA": 1, "CB": 4, "CG1": 5, "CG2": 6, "H": 8, "H2": 9, "HA": 10, "HB": 11, "HG11": 12, "HG12": 13, "HG13": 14, "HG21": 15, "HG22": 16, "HG23": 17, "HXT": 18, "N": 0, "O": 3, "OXT": 7}
]
def print_usage(code=0):
    print 'usage: pdb2csf.py <inputs>'
    sys.exit(code);

def check_exists(filename):
    if not os.path.exists(filename):
        print '"%s" does not exists' % filename
        return False
    return True

def check_readable(filename):
    if not check_exists(filename):
        return False
    if not os.access(filename, os.R_OK):
        print '"%s" is not readable' % filename
        return False
    return True

def project(line, p):
  return geom.Dot(p - line.origin, line.direction)
  
class Chain:
  def __init__(self, name, residues):
    self.name = name
    self.residues = [Residue(r) for r in residues]
  def data(self):
    return self.chain_data() + ''.join([r.data() for r in self.residues])
  def chain_data(self):
    return pack('!I', len(self.residues))

STANDARD_NAMES = {
    'ALA' :  0,
    'ARG' :  1,
    'ASN' :  2,
    'ASP' :  3,
    'CYS' :  4,
    'GLN' :  5,
    'GLU' :  6,
    'GLY' :  7,
    'HIS' :  8,
    'ILE' :  9,
    'LEU' : 10,
    'LYS' : 11,
    'MET' : 12,
    'PHE' : 13,
    'PRO' : 14,
    'SER' : 15,
    'THR' : 16,
    'TRP' : 17,
    'TYR' : 18,
    'VAL' : 19,
}

class Residue:
  def __init__(self, res):
    self.name = res.name
    self.res = res
    self.atoms = [Atom(a) for a in res.atoms]

  @property
  def compressed_name(self):
    if self.name in STANDARD_NAMES:
      return STANDARD_NAMES[self.name]
  def truncated_center(self):
    center = geom.Vec3()
    for a in self.res.atoms:
      center += a.pos
    center /= len(self.res.atoms)
    center[0] = int(center[0])
    center[1] = int(center[1])
    center[2] = int(center[2])
    return center
  def data(self):
    data = self.residue_data()
    center = self.truncated_center()
    data += pack('!3h', int(center[0]), int(center[1]), int(center[2]))
    assert len(self.atoms) < 256
    data += pack('!B', len(self.atoms))
    is_standard = self.res.name in STANDARD_NAMES
    return data+''.join([a.data(center, is_standard) for a in self.atoms])

  def residue_data(self):
    flags = 0
    if self.name in STANDARD_NAMES:
      flags |= 1
    if self.res.sec_structure.IsHelical():
      flags |= 2
    if self.res.sec_structure.IsExtended():
      flags |= 4
    # FIXME: include insertion code!, possibly by putting the ins code
    # and numeric part into a 32 bit unsigned (24bits for numeric part)
    data = pack('!Bi', flags, self.res.number.num)
    if flags & 0x1:
      data += pack('!B', STANDARD_NAMES[self.res.name])
    else:
      data += writestr(self.res.name)
    return data;

class Atom:
  def __init__(self, atom):
    self.atom = atom
  def compress_attributes(self):
    # returns a compressed representation of the atom's attributes, e.g.
    # occupancy, b-factor, element, name.
    return writestr(self.atom.name)+writestr(self.atom.element)

  def data_compressed(self, residue_center):
    res_id = STANDARD_NAMES[self.atom.residue.name]
    ordinal = MAPPING[res_id][self.atom.name]
    data = pack('!B', ordinal)
    pos = (self.atom.pos - residue_center) * 256
    pos[0] = round(pos[0])
    pos[1] = round(pos[1])
    pos[2] = round(pos[2])
    data += pack('!3h', int(pos[0]), int(pos[1]), int(pos[2]))
    return data

  def data(self, residue_center, compressed):
    if compressed:
      return self.data_compressed(residue_center)
    data = self.compress_attributes()
    # each atom position is stored relative to the (truncated) residue 
    # center. This makes it possible to only use 16bits for each 
    # dimension while still being able to store rather large molecules 
    # in the file.
    pos = (self.atom.pos - residue_center) * 256
    pos[0] = round(pos[0])
    pos[1] = round(pos[1])
    pos[2] = round(pos[2])
    data += pack('!3h', int(pos[0]), int(pos[1]), int(pos[2]))
    return data


def writestr(s):
  data = pack('!B', len(s))
  for c in s:
    data += pack('!B', ord(c))
  return data

def process_chain(chain):
  return Chain(chain.name, chain.residues)

def convert(ent):
  chains = []
  for chain in ent.chains:
    ch = Chain(chain.name, chain.residues)
    chains.append(ch)
  return chains

def main(args):
  BIN_VERSION = 1
  if len(args) < 2:
      print_usage(-1)
  input_file_names = args[1:]
  for file_name in input_file_names:
    if not check_readable(file_name):
      sys.exit(-1)
  for file_name in input_file_names:
    ent = io.LoadPDB(file_name)
    output_file_name = '%s.csf' % os.path.splitext(file_name)[0]
    print output_file_name
    chains_data = convert(ent)
    out = open(output_file_name, 'wb')
    # add version number on top
    out.write(pack('!4B', ord('C'),ord('S'),ord('F'), BIN_VERSION))
    # first write table of contents listing all available chains
    converted_chain_data = []
    # that's the size of the table of contents (assuming chain name is
    # always of size 1!
    current_offset = 4 + 2 + len(chains_data)* (1 + 4 + 4)
    out.write(pack('!H', len(chains_data)))
    for chain in chains_data:
      data = chain.data()
      assert len(chain.name) == 1
      out.write(pack('!BII', ord(chain.name[0]), current_offset, len(data)))
      current_offset += len(data)
      converted_chain_data.append(data)
    for data in converted_chain_data:
      out.write(data)
    out.close()

if __name__ == '__main__':
    main(sys.argv)


