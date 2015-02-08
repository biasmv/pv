require(['mol/all', 'io'], function(mol, io) {

test('assign helix sheet', function(assert) {
  var done = assert.async();
  io.fetchPdb('pdbs/1crn.pdb', function(structure) {
    // clear assigned secondary structure
    structure.eachResidue(function(r) {
      r.setSS('C');
    });
    mol.assignHelixSheet(structure);
    var expected = 'EECCCCCHHHHHHHHHHCCCCCCHHHHHCCCCECCCCCCCCCCCCH';
    var assigned = '';
    structure.eachResidue(function(r) {
      assigned += r.ss();
    });
    assert.strictEqual(assigned, expected);
    done();
  });
});

});
