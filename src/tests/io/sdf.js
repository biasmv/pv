define(['gl-matrix', 'io'], function(glMatrix, io) {


var SIMPLE_SDF = [
  'Simple Ligand\n', 
  '\n',
  ' Teststructure\n', 
  '  6  6  0  0  1  0            999 V2000\n', 
  '    0.0000    0.0000    0.0000 N   0  3  0  0  0  0\n', 
  '    1.0000    0.0000    0.0000 C   0  0  0  0  0  0\n', 
  '    0.0000    1.0000    0.0000 O   0  0  0  0  0  0\n', 
  '    1.0000    1.0000    0.0000 S   0  0  0  0  0  0\n', 
  '    2.0000    2.0000    0.0000 C   0  0  0  0  0  0\n', 
  '   -1.0000   -1.0000    0.0000 Cl  0  0  0  0  0  0\n', 
  '  1  2  2  0  0  0\n', 
  '  1  3  1  0  0  0\n', 
  '  1  6  1  0  0  0\n', 
  '  2  4  1  0  0  0\n', 
  '  3  4  1  0  0  0\n', 
  '  4  5  3  0  0  0\n', 
  'M  END\n', 
  '$$$$\n'
];

var TWO_STRUCTURES = [
  'Simple Ligand 1\n',
  '\n',
  ' Teststructure\n',
  '  6  6  0  0  1  0            999 V2000\n',
  '    0.0000    0.0000    0.0000 N   0  3  0  0  0  0\n',
  '    1.0000    0.0000    0.0000 C   0  0  0  0  0  0\n',
  '    0.0000    1.0000    0.0000 O   0  0  0  0  0  0\n',
  '    1.0000    1.0000    0.0000 S   0  0  0  0  0  0\n',
  '    2.0000    2.0000    0.0000 C   0  0  0  0  0  0\n',
  '   -1.0000   -1.0000    0.0000 Cl  0  0  0  0  0  0\n',
  '  1  2  2  0  0  0\n',
  '  1  3  1  0  0  0\n',
  '  1  6  1  0  0  0\n',
  '  2  4  1  0  0  0\n',
  '  3  4  1  0  0  0\n',
  '  4  5  3  0  0  0\n',
  'M  END\n',
  '$$$$\n',
  'Simple Ligand 2\n',
  '\n',
  ' Teststructure\n',
  '  6  6  0  0  1  0            999 V2000\n',
  '    0.0000    0.0000    5.0000 N   0  3  0  0  0  0\n',
  '    1.0000    0.0000    5.0000 C   0  0  0  0  0  0\n',
  '    0.0000    1.0000    5.0000 O   0  0  0  0  0  0\n',
  '    1.0000    1.0000    5.0000 S   0  0  0  0  0  0\n',
  '    2.0000    2.0000    5.0000 C   0  0  0  0  0  0\n',
  '   -1.0000   -1.0000    5.0000 Cl  0  0  0  0  0  0\n',
  '  1  2  2  0  0  0\n',
  '  1  3  1  0  0  0\n',
  '  1  6  1  0  0  0\n',
  '  2  4  1  0  0  0\n',
  '  3  4  1  0  0  0\n',
  '  4  5  3  0  0  0\n',
  'M  END\n',
  '$$$$\n'
];

test('fails on truncated SDF file', function(assert) {
  for (var i = 1; i < SIMPLE_SDF.length - 3; ++i) {
    var data = SIMPLE_SDF.slice(0, i).join('');
    assert.strictEqual(io.sdf(data), null);
  }
});

test('read multi SDF file', function(assert) {
  var structure = io.sdf(TWO_STRUCTURES.join(''));
  assert.strictEqual(structure.chains().length, 2);
  var residues = structure.chains()[0].residues();
  assert.strictEqual(residues.length, 1);
  var atoms = structure.atoms();
  assert.strictEqual(atoms.length, 12);

  assert.strictEqual(atoms[0].name(), 'N');
  assert.strictEqual(atoms[0].element(), 'N');
  assert.vec3Equal(atoms[0].pos(), [0.0, 0.0, 0.0]);
  assert.strictEqual(atoms[0].bonds().length, 3);

  assert.strictEqual(atoms[1].name(), 'C');
  assert.strictEqual(atoms[1].element(), 'C');
  assert.vec3Equal(atoms[1].pos(), [1.0, 0.0, 0.0]);
  assert.strictEqual(atoms[1].bonds().length, 2);

  assert.strictEqual(atoms[2].name(), 'O');
  assert.strictEqual(atoms[2].element(), 'O');
  assert.vec3Equal(atoms[2].pos(), [0.0, 1.0, 0.0]);
  assert.strictEqual(atoms[2].bonds().length, 2);

  assert.strictEqual(atoms[3].name(), 'S');
  assert.strictEqual(atoms[3].element(), 'S');
  assert.vec3Equal(atoms[3].pos(), [1.0, 1.0, 0.0]);
  assert.strictEqual(atoms[3].bonds().length, 3);

  assert.strictEqual(atoms[4].name(), 'C');
  assert.strictEqual(atoms[4].element(), 'C');
  assert.vec3Equal(atoms[4].pos(), [2.0, 2.0, 0.0]);
  assert.strictEqual(atoms[4].bonds().length, 1);

  assert.strictEqual(atoms[5].name(), 'Cl');
  assert.strictEqual(atoms[5].element(), 'Cl');
  assert.vec3Equal(atoms[5].pos(), [-1.0, -1.0, 0.0]);
  assert.strictEqual(atoms[5].bonds().length, 1);

  residues = structure.chains()[1].residues();
  assert.strictEqual(residues.length, 1);

  assert.strictEqual(atoms[6].name(), 'N');
  assert.strictEqual(atoms[6].element(), 'N');
  assert.vec3Equal(atoms[6].pos(), [0.0, 0.0, 5.0]);
  assert.strictEqual(atoms[6].bonds().length, 3);

  assert.strictEqual(atoms[7].name(), 'C');
  assert.strictEqual(atoms[7].element(), 'C');
  assert.vec3Equal(atoms[7].pos(), [1.0, 0.0, 5.0]);
  assert.strictEqual(atoms[7].bonds().length, 2);

  assert.strictEqual(atoms[8].name(), 'O');
  assert.strictEqual(atoms[8].element(), 'O');
  assert.vec3Equal(atoms[8].pos(), [0.0, 1.0, 5.0]);
  assert.strictEqual(atoms[8].bonds().length, 2);

  assert.strictEqual(atoms[9].name(), 'S');
  assert.strictEqual(atoms[9].element(), 'S');
  assert.vec3Equal(atoms[9].pos(), [1.0, 1.0, 5.0]);
  assert.strictEqual(atoms[9].bonds().length, 3);

  assert.strictEqual(atoms[10].name(), 'C');
  assert.strictEqual(atoms[10].element(), 'C');
  assert.vec3Equal(atoms[10].pos(), [2.0, 2.0, 5.0]);
  assert.strictEqual(atoms[10].bonds().length, 1);

  assert.strictEqual(atoms[11].name(), 'Cl');
  assert.strictEqual(atoms[11].element(), 'Cl');
  assert.vec3Equal(atoms[11].pos(), [-1.0, -1.0, 5.0]);
  assert.strictEqual(atoms[11].bonds().length, 1);
});

test('reads simple SDF file', function(assert) {
  var structure = io.sdf(SIMPLE_SDF.join(''));
  assert.strictEqual(structure.chains().length, 1);
  var residues = structure.chains()[0].residues();
  assert.strictEqual(residues.length, 1);
  var atoms = structure.atoms();
  assert.strictEqual(atoms.length, 6);

  assert.strictEqual(atoms[0].name(), 'N');
  assert.strictEqual(atoms[0].element(), 'N');
  assert.vec3Equal(atoms[0].pos(), [0.0, 0.0, 0.0]);
  assert.strictEqual(atoms[0].bonds().length, 3);

  assert.strictEqual(atoms[1].name(), 'C');
  assert.strictEqual(atoms[1].element(), 'C');
  assert.vec3Equal(atoms[1].pos(), [1.0, 0.0, 0.0]);
  assert.strictEqual(atoms[1].bonds().length, 2);

  assert.strictEqual(atoms[2].name(), 'O');
  assert.strictEqual(atoms[2].element(), 'O');
  assert.vec3Equal(atoms[2].pos(), [0.0, 1.0, 0.0]);
  assert.strictEqual(atoms[2].bonds().length, 2);

  assert.strictEqual(atoms[3].name(), 'S');
  assert.strictEqual(atoms[3].element(), 'S');
  assert.vec3Equal(atoms[3].pos(), [1.0, 1.0, 0.0]);
  assert.strictEqual(atoms[3].bonds().length, 3);

  assert.strictEqual(atoms[4].name(), 'C');
  assert.strictEqual(atoms[4].element(), 'C');
  assert.vec3Equal(atoms[4].pos(), [2.0, 2.0, 0.0]);
  assert.strictEqual(atoms[4].bonds().length, 1);

  assert.strictEqual(atoms[5].name(), 'Cl');
  assert.strictEqual(atoms[5].element(), 'Cl');
  assert.vec3Equal(atoms[5].pos(), [-1.0, -1.0, 0.0]);
  assert.strictEqual(atoms[5].bonds().length, 1);
});

});
