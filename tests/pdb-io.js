var MULTI_LINE_MT = [
  'REMARK 350 BIOMOLECULE: 1                 \n',
  'REMARK 350 AUTHOR DETERMINED BIOLOGICAL UNIT: 55-MERIC       \n',
  'REMARK 350 APPLY THE FOLLOWING TO CHAINS: A, B, C, D, E, F, G, H, I, \n',
  'REMARK 350                    AND CHAINS: J, K, L, M, N, O, P, Q, R, \n',
];
test("parses remark 350 with multi-line chain definitions", function() {
  var reader = new io.Remark350Reader();
  for (var i = 0; i < MULTI_LINE_MT.length; ++i) {
    reader.nextLine(MULTI_LINE_MT[i]);
  }
  strictEqual(reader.assemblies().length, 1);
  var assembly = reader.assembly('1');
  strictEqual(assembly.generators().length, 1);
  var gen = assembly.generators()[0];
  deepEqual(gen.chains(), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
            'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R']);
});



var MULTI_MATRICES = [
  'REMARK 350 BIOMOLECULE: 1                                             \n',
  'REMARK 350 APPLY THE FOLLOWING TO CHAINS: F, G, J, X                  \n',
  'REMARK 350   BIOMT1  10 -0.982297 -0.036603  0.183718       10.28017  \n',
  'REMARK 350   BIOMT2  10 -0.036603  0.999324  0.003392        0.18982  \n',
  'REMARK 350   BIOMT3  10 -0.183718 -0.003392 -0.982973     -110.95964  \n',
  'REMARK 350   BIOMT1   2  0.500000 -0.809017  0.309017        0.00000  \n',
  'REMARK 350   BIOMT2   2  0.809017  0.309017 -0.500000        0.00000  \n',
  'REMARK 350   BIOMT3   2  0.309017  0.500000  0.809017        0.00000  \n'
];

test("parses remark 350 with multiple matrices", function(assert) {
  var reader = new io.Remark350Reader();
  for (var i = 0; i < MULTI_MATRICES.length; ++i) {
    reader.nextLine(MULTI_MATRICES[i]);
  }
  strictEqual(reader.assemblies().length, 1);
  var assembly = reader.assembly('1');
  strictEqual(assembly.generators().length, 1);
  var gen = assembly.generator(0);
  strictEqual(gen.matrices().length, 2);

  var m1 = mat4.fromValues(-0.982297, -0.036603,  -0.183718, 0.00000,
                           -0.036603,  0.999324,  -0.003392, 0.00000,
                            0.183718,  0.003392,  -0.982973, 0.00000,
                           10.280170,  0.189820,-110.959640, 1.00000);

  assert.mat4Equal(gen.matrix(0), m1);

  var m2 = mat4.fromValues( 0.500000,  0.809017,  0.309017,  0.00000,
                           -0.809017,  0.309017,  0.500000,  0.00000,
                            0.309017, -0.500000,  0.809017,  0.00000,
                            0.000000,  0.000000,  0.000000,  1.00000);
  assert.mat4Equal(gen.matrix(1), m2);

});

// coordinates are set to zero to have a simple test case when conectRecords 
// is set to false, because this prevents any bonds to be formed between 
// atoms.
var CONECT_RECORDS = '\
HETATM    1  C                   0.000   0.000   0.000\n\
HETATM    2  C                   0.000   0.000   0.000\n\
HETATM    3  C                   0.000   0.000   0.000\n\
HETATM    4  C                   0.000   0.000   0.000\n\
HETATM    5  C                   0.000   0.000   0.000\n\
HETATM    6  C                   0.000   0.000   0.000\n\
HETATM    7  I                   0.000   0.000   0.000\n\
HETATM    8  H                   0.000   0.000   0.000\n\
HETATM    9  O                   0.000   0.000   0.000\n\
CONECT    1    2    6    7\n\
CONECT    2    1    3    8\n\
CONECT    3    2    4    9\n\
';

test('uses conect records when conectRecords flag is set', function(assert) {
  var structure = io.pdb(CONECT_RECORDS, { conectRecords : true });

  var atoms = [];
  structure.eachAtom(function(a) { atoms.push(a) });
  assert.strictEqual(3, atoms[0].bonds().length);
  assert.strictEqual(3, atoms[1].bonds().length);
  assert.strictEqual(3, atoms[2].bonds().length);
  assert.strictEqual(1, atoms[3].bonds().length);
  assert.strictEqual(0, atoms[4].bonds().length);
  assert.strictEqual(1, atoms[5].bonds().length);
  assert.strictEqual(1, atoms[6].bonds().length);
  assert.strictEqual(1, atoms[7].bonds().length);
  assert.strictEqual(1, atoms[8].bonds().length);
});

test('ignores conect records when conectRecords flag is not set', function(assert) {
  var structure = io.pdb(CONECT_RECORDS, { conectRecords : false });
  var atoms = [];
  structure.eachAtom(function(a) { atoms.push(a) });
  assert.strictEqual(0, atoms[0].bonds().length);
  assert.strictEqual(0, atoms[1].bonds().length);
  assert.strictEqual(0, atoms[2].bonds().length);
  assert.strictEqual(0, atoms[3].bonds().length);
  assert.strictEqual(0, atoms[4].bonds().length);
  assert.strictEqual(0, atoms[5].bonds().length);
  assert.strictEqual(0, atoms[6].bonds().length);
  assert.strictEqual(0, atoms[7].bonds().length);
  assert.strictEqual(0, atoms[8].bonds().length);
});



