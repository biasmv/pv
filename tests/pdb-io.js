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
  'REMARK 350   BIOMT1   1  1.000000  0.000000  0.000000        0.00000  \n',
  'REMARK 350   BIOMT2   1  0.000000  1.000000  0.000000        0.00000  \n',
  'REMARK 350   BIOMT3   1  0.000000  0.000000  1.000000        0.00000  \n',
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

  var m1 = mat4.fromValues( 1.000000,  0.000000,  0.000000,  0.000000,
                            0.000000,  1.000000,  0.000000,  0.000000,
                            0.000000,  0.000000,  1.000000,  0.000000,
                            0.000000,  0.000000,  0.000000,  1.000000);

  assert.mat4Equal(gen.matrix(0), m1);

  var m2 = mat4.fromValues( 0.500000, -0.809017,  0.309017,  0.000000,
                            0.809017,  0.309017, -0.500000,  0.000000,
                            0.309017,  0.500000,  0.809017,  0.00000,
                            0.000000,  0.000000,  0.000000,  1.00000);
  assert.mat4Equal(gen.matrix(1), m2);

});



