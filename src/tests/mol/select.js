define(['io'], function(io) { 

var SELECT_HETATM='\
ATOM   3316  C   GLY B 214      24.173   7.911  -3.276  1.00 94.23           C\n\
ATOM   3317  O   GLY B 214      24.730   8.496  -4.208  1.00 94.94           O\n\
ATOM   3318  OXT GLY B 214      23.962   8.474  -2.196  1.00 95.71           O\n\
TER    3319      GLY B 214                                                    \n\
HETATM 3320  PA  AP5 A 215      18.089  46.955  20.531  1.00 17.77           P\n\
HETATM 3321  O1A AP5 A 215      17.885  47.954  21.576  1.00 16.47           O\n\
HETATM 3322  O2A AP5 A 215      18.847  47.325  19.359  1.00 15.16           O\n\
ATOM   3317  O   GLY A 216      24.730   8.496  -4.208  1.00 94.94           O\n\
END\n\
'

var CRAMBIN_CALPHA='\
ATOM      2  CA  THR A   1      16.967  12.784   4.338  1.00 10.80           C\n\
ATOM      9  CA  THR A   2      13.856  11.469   6.066  1.00  8.31           C\n\
ATOM     16  CA  CYS A   3      13.660  10.707   9.787  1.00  5.39           C\n\
ATOM     22  CA  CYS A   4      10.646   8.991  11.408  1.00  4.24           C\n\
ATOM     28  CA  PRO A   5       9.448   9.034  15.012  1.00  4.25           C\n\
ATOM     35  CA  SER A   6       8.673   5.314  15.279  1.00  4.45           C\n\
ATOM     41  CA  ILE A   7       8.912   2.083  13.258  1.00  6.33           C\n\
ATOM     49  CA  VAL A   8       5.145   2.209  12.453  1.00  6.93           C\n\
ATOM     56  CA  ALA A   9       5.598   5.767  11.082  1.00  3.56           C\n\
ATOM     61  CA  ARG A  10A      8.496   4.609   8.837  1.00  3.38           C\n\
ATOM     72  CA  SER A  10B      6.500   1.584   7.565  1.00  4.60           C\n\
ATOM     78  CA  ASN A  12       3.545   3.935   6.751  1.00  4.57           C\n\
ATOM     86  CA  PHE A  13       5.929   6.358   5.055  1.00  3.49           C\n\
ATOM     97  CA  ASN A  14       7.331   3.607   2.791  1.00  4.31           C\n\
ATOM    105  CA  VAL A  15       3.782   2.599   1.742  1.00  3.98           C\n\
ATOM    112  CA  CYS A  16       2.890   6.285   1.126  1.00  3.54           C\n\
ATOM    118  CA  ARG A  17       5.895   6.489  -1.213  1.00  3.83           C\n\
ATOM    129  CA  LEU A  18       4.933   3.431  -3.326  1.00  5.46           C\n\
ATOM    137  CA  PRO A  19       2.792   5.376  -5.797  1.00  5.38           C\n\
ATOM    144  CA  GLY A  20       5.366   8.191  -6.018  1.00  5.39           C\n\
ATOM    148  CA  THR A  21       3.767  10.609  -3.513  1.00  3.94           C\n\
ATOM    155  CA  PRO A  22       6.143  13.513  -2.696  1.00  4.69           C\n\
ATOM    162  CA  GLU A  23       8.114  13.103   0.500  1.00  5.31           C\n\
ATOM    171  CA  ALA A  24       6.614  16.317   1.913  1.00  4.49           C\n\
ATOM    176  CA  ILE A  25       3.074  14.894   1.756  1.00  5.44           C\n\
ATOM    184  CA  CYS A  26       4.180  11.549   3.187  1.00  4.37           C\n\
ATOM    190  CA  ALA A  27       5.879  13.502   6.026  1.00  4.43           C\n\
ATOM    195  CA  THR A  28       2.691  15.221   7.194  1.00  5.08           C\n\
ATOM    202  CA  TYR A  29       0.715  12.045   6.657  1.00  6.60           C\n\
ATOM    214  CA  THR A  30       2.986   9.994   8.950  1.00  5.70           C\n\
ATOM    221  CA  GLY A  31       4.769  12.336  11.360  1.00  5.50           C\n\
ATOM    225  CA  CYS A  32       8.140  11.694   9.635  1.00  4.89           C\n\
ATOM    231  CA  ILE A  33      10.280  14.760   8.823  1.00  5.24           C\n\
ATOM    239  CA  ILE A  34      12.552  15.877   6.036  1.00  6.82           C\n\
ATOM    247  CA  ILE A  35      15.930  17.454   6.941  1.00  7.52           C\n\
ATOM    255  CA  PRO A  36      18.635  18.861   4.738  1.00  8.78           C\n\
ATOM    262  CA  GLY A  37      21.452  16.969   6.513  1.00  9.20           C\n\
ATOM    266  CA  ALA A  38      22.019  13.242   7.020  1.00  9.24           C\n\
ATOM    271  CA  THR A  39      21.936  12.911  10.809  1.00  9.46           C\n\
ATOM    278  CA  CYS A  40      18.504  12.312  12.298  1.00  8.05           C\n\
ATOM    284  CA  PRO A  41      17.924  13.421  15.877  1.00  8.96           C\n\
ATOM    291  CA  GLY A  42      17.334  10.956  18.691  1.00  8.00           C\n\
ATOM    295  CA  ASP A  43      13.564  11.573  18.836  1.00  5.85           C\n\
ATOM    303  CA  TYR A  44      13.257  10.745  15.081  1.00  5.56           C\n\
ATOM    315  CA  ALA A  45      15.445   7.667  15.246  1.00  5.89           C\n\
ATOM    320  CA  ASN A  46      13.512   5.395  12.878  1.00  6.15           C\n\
END\n\
'

test('dict select by hetatm flag', function(assert) {
  var structure = io.pdb(SELECT_HETATM);
  var view = structure.select({ hetatm: true });
  assert.strictEqual(view.atomCount(), 3);
  view = structure.select({ hetatm: false });
  assert.strictEqual(view.atomCount(), 4);

});

test('dict select by residue index range', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rindexRange : [1,6] });
  assert.strictEqual(view.chains().length, 1);
  var residues = [];
  view.eachResidue(function(r) { residues.push(r); });

  assert.strictEqual(residues.length, 6);
  assert.strictEqual(residues[0].index(), 1);
  assert.strictEqual(residues[1].index(), 2);
  assert.strictEqual(residues[2].index(), 3);
  assert.strictEqual(residues[3].index(), 4);
  assert.strictEqual(residues[4].index(), 5);
  assert.strictEqual(residues[5].index(), 6);
});

test('dict select by residue indices', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rindices : [1,3,5,6] });
  assert.strictEqual(view.chains().length, 1);
  var residues = [];
  view.eachResidue(function(r) { residues.push(r); });

  assert.strictEqual(residues.length, 4);
  assert.strictEqual(residues[0].index(), 1);
  assert.strictEqual(residues[1].index(), 3);
  assert.strictEqual(residues[2].index(), 5);
  assert.strictEqual(residues[3].index(), 6);
});

test('dict select by residue number', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [10,15,4,6] });
  assert.strictEqual(view.chains().length, 1);
  var residues = [];
  view.eachResidue(function(r) { residues.push(r); });

  assert.strictEqual(residues.length, 5);
  assert.strictEqual(residues[0].num(), 4);
  assert.strictEqual(residues[1].num(), 6);
  assert.strictEqual(residues[2].num(), 10);
  assert.strictEqual(residues[2].insCode(), 'A');
  assert.strictEqual(residues[3].num(), 10);
  assert.strictEqual(residues[3].insCode(), 'B');
  assert.strictEqual(residues[4].num(), 15);
});

test('dict select by residue number', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnumRange : [10,15] });
  assert.strictEqual(view.chains().length, 1);
  var residues = [];
  view.eachResidue(function(r) { residues.push(r); });

  assert.strictEqual(residues.length, 6);
  assert.strictEqual(residues[0].num(), 10);
  assert.strictEqual(residues[0].insCode(), 'A');
  assert.strictEqual(residues[1].num(), 10);
  assert.strictEqual(residues[1].insCode(), 'B');
  assert.strictEqual(residues[2].num(), 12);
  assert.strictEqual(residues[3].num(), 13);
  assert.strictEqual(residues[4].num(), 14);
  assert.strictEqual(residues[5].num(), 15);
});

test('select within single atom small radius', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [12] });
  var within = structure.selectWithin(view, { radius : 1.0 });
  var atoms = within.atoms();
  assert.strictEqual(atoms.length, 1);
  assert.strictEqual(atoms[0].qualifiedName(), 'A.ASN12.CA');

});

test('select within single atom larger radius', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [12] });
  var within = structure.selectWithin(view, { radius : 4.0 });
  var atoms = within.atoms();
  assert.strictEqual(atoms.length, 3);
  assert.strictEqual(atoms[0].qualifiedName(), 'A.SER10B.CA');
  assert.strictEqual(atoms[1].qualifiedName(), 'A.ASN12.CA');
  assert.strictEqual(atoms[2].qualifiedName(), 'A.PHE13.CA');
});

test('select within two atoms small radius', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [12, 13] });
  var within = structure.selectWithin(view, { radius : 1.0 });
  var atoms = within.atoms();
  assert.strictEqual(atoms.length, 2);
  assert.strictEqual(atoms[0].qualifiedName(), 'A.ASN12.CA');
  assert.strictEqual(atoms[1].qualifiedName(), 'A.PHE13.CA');
});

test('select within two atoms larger radius', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [12, 13] });
  var within = structure.selectWithin(view, { radius : 4.0 });
  var atoms = within.atoms();
  assert.strictEqual(atoms.length, 4);
  assert.strictEqual(atoms[0].qualifiedName(), 'A.SER10B.CA');
  assert.strictEqual(atoms[1].qualifiedName(), 'A.ASN12.CA');
  assert.strictEqual(atoms[2].qualifiedName(), 'A.PHE13.CA');
  assert.strictEqual(atoms[3].qualifiedName(), 'A.ASN14.CA');
});

test('select within two atoms default radius', function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [12, 13] });
  var within = structure.selectWithin(view);
  var atoms = within.atoms();
  assert.strictEqual(atoms.length, 4);
  assert.strictEqual(atoms[0].qualifiedName(), 'A.SER10B.CA');
  assert.strictEqual(atoms[1].qualifiedName(), 'A.ASN12.CA');
  assert.strictEqual(atoms[2].qualifiedName(), 'A.PHE13.CA');
  assert.strictEqual(atoms[3].qualifiedName(), 'A.ASN14.CA');
});

test('select within applied to view returns only subset of view atoms', 
     function(assert) {
  var structure = io.pdb(CRAMBIN_CALPHA);
  var view = structure.select({ rnums : [12, 13] });
  var within = view.selectWithin(view);
  var atoms = within.atoms();
  assert.strictEqual(atoms.length, 2);
  assert.strictEqual(atoms[0].qualifiedName(), 'A.ASN12.CA');
  assert.strictEqual(atoms[1].qualifiedName(), 'A.PHE13.CA');
});


});
