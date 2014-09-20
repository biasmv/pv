#!/usr/bin/env ost
"""
Converts structure contained in a set of PDB files into the PV multi resolution model
file format.
"""
import sys
import os
from struct import pack 

def print_usage(code=0):
    print 'usage: pdb2mrm.py <inputs...> <output>'
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
  def __init__(self, name, pieces):
    self.name = name
    self.pieces = pieces

class Coil:
  def __init__(self,positions):
    # a connected piece of coil residues
    self.positions = positions
  def write(self, out):
    out.write(pack('!BI', 2, len(self.positions)))
    for p in self.positions:
      out.write(pack('!3f', p[0], p[1], p[2]))

class SS:
  def __init__(self, ss_type, start, end):
    self.ss_type = ss_type
    self.start = start
    self.end = end
  def write(self, out):
    out.write(pack('!BB6f', 1, ord(self.ss_type), 
                   self.start[0], self.start[1], self.start[2], self.end[0],
                   self.end[1], self.end[2]))


class LowResChain:
  def __init__(self, chain):
    self.name = chain.name

def process_ss_element(residues):
  if len(residues) == 0:
    return
  ss = str(residues[0].sec_structure)
  vec3_list = geom.Vec3List()
  for r in residues:
    vec3_list.append(r.FindAtom('CA').pos)
  if ss == 'C':
    return Coil(vec3_list)
  start = geom.Vec3()
  end = geom.Vec3()
  cyl = vec3_list.FitCylinder(vec3_list[-1]-vec3_list[0])[0]
  # get start/end of secondary structure element
  p = project(cyl, vec3_list[0])
  mmin = p
  mmax = p
  assert project(cyl, vec3_list[0]) < project(cyl, vec3_list[-1])
  for p in vec3_list:
    p2 = project(cyl, p)
    if p2 < mmin:
      mmin = p2
    if p2 > mmax:
      mmax = p2
  start = cyl.origin + mmin * cyl.direction
  end = cyl.origin + mmax * cyl.direction
  return SS(ss, start, end)


    
def writestr(s):
  data = pack('!B', len(s))
  for c in s:
    data += pack('!B', ord(c))
  return data
def process_chain(pdb_id, chain):
  same_ss = []
  pieces = []
  for res in chain.residues:
    ss = res.sec_structure
    if len(same_ss) == 0: 
      same_ss.append(res)
      continue
    if str(same_ss[0].sec_structure) == str(ss):
      same_ss.append(res)
      continue
    pieces.append(process_ss_element(same_ss))
    same_ss = [res]
  if len(same_ss):
    pieces.append(process_ss_element(same_ss))
  return Chain('%s:%s' % (pdb_id, chain.name), pieces)

def convert(pdb_id, ent):
  chains = []
  for chain in ent.chains:
    chains.append(process_chain(pdb_id, chain))
  return chains
  
def main(args):
  BIN_VERSION = 1
  if len(args) < 3:
      print_usage(-1)
  input_file_names = args[1:-1]
  output_file_name = args[-1]
  print output_file_name
  for file_name in input_file_names:
    if not check_readable(file_name):
      sys.exit(-1)
  out = open(output_file_name, 'wb')
  chains = []
  center = geom.Vec3()
  for file_name in input_file_names:
    print ' - processing input %s' % file_name
    ent = io.LoadPDB(file_name)
    center += ent.center_of_mass
    pdb_id = os.path.basename(os.path.splitext(file_name)[0])
    chains += convert(pdb_id, ent)
  center /= len(input_file_names)
  print 'center of structure: ', center
  version = 2
  out.write(pack('!I', version))
  out.write(pack('!I', len(chains)))
  print 'writing a total of %d chains' % len(chains)
  for chain in chains:
    out.write(pack('!I', len(chain.pieces)))
    print chain.name;
    out.write(writestr(chain.name))
    for piece in chain.pieces:
      piece.write(out)
  out.close()


if __name__ == '__main__':
    main(sys.argv)


