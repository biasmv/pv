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

test('dict select select by hetatm flag', function(assert) {
  var structure = io.pdb(HETATM);
  var view = structure.select({ hetatm: true });
  assert.strictEqual(view.atomCount(), 3);
  view = structure.select({ hetatm: false });
  assert.strictEqual(view.atomCount(), 4);

});

