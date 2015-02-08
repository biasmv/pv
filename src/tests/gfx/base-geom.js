require(['viewer', 'io', 'color'], function(pv, io, color) { 

function createViewer() {
  var options =  {
    width: '300', height : '300', 
    background : '#333'
  };
  return pv.Viewer(document.getElementById('viewer'), options);
}

// the following tests make sure that setOpacity works on mesh and line geoms, 
// using trace-based (trace, lineTrace, sline, tube, cartoon), or 
// atom-based (ballsAndSticks, lines, spheres) vertex assocs. We also test both 
// the setOpacity on complete structure, or on a structural subset.
test('set opacity on line geom with trace assoc on complete structure', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.sline('object', structure, { 
                             color : color.uniform('red') });
      assert.ok(!!obj);
      obj.setOpacity(0.5);
      structure.eachResidue(function(residue) {
        var ca = residue.atom('CA');
        if (ca === null) {
          return;
        }
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(ca, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        assert.strictEqual(atomColor[3], 0.5);
      });
      done();
  });
});

test('set opacity on line geom with atom assoc on complete structure', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.lines('object', structure, { 
                             color : color.uniform('red') });
      assert.ok(!!obj);
      obj.setOpacity(0.5);
      structure.eachAtom(function(atom) {
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(atom, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        assert.strictEqual(atomColor[3], 0.5);
      });
      done();
  });
});

test('set opacity on mesh geom with trace assoc on complete structure', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.cartoon('object', structure, { 
                               color : color.uniform('red') });
      assert.ok(!!obj);
      obj.setOpacity(0.5);
      structure.eachResidue(function(residue) {
        var ca = residue.atom('CA');
        if (ca === null) {
          return;
        }
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(ca, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        assert.strictEqual(atomColor[3], 0.5);
      });
      done();
  });
});

test('set opacity on mesh geom with atom assoc on complete structure', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.spheres('object', structure, { 
                               color : color.uniform('red') });
      assert.ok(!!obj);
      obj.setOpacity(0.5);
      structure.eachAtom(function(atom) {
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(atom, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        assert.strictEqual(atomColor[3], 0.5);
      });
      done();
  });
});

// structural subset
test('set opacity on line geom with trace assoc on structural subset', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.sline('object', structure, { 
                             color : color.uniform('red') });
      assert.ok(!!obj);
      var view = structure.select({rnumRange : [ 10, 15 ] });
      obj.setOpacity(0.5, view);
      structure.eachResidue(function(residue) {
        var ca = residue.atom('CA');
        if (ca === null) {
          return;
        }
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(ca, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        if (view.containsResidue(residue)) {
          assert.strictEqual(atomColor[3], 0.5);
        } else {
          assert.strictEqual(atomColor[3], 1.0);
        }
      });
      viewer.destroy();
      done();
  });
});

test('set opacity on line geom with atom assoc on structural subset', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.lines('object', structure, { 
                             color : color.uniform('red') });
      assert.ok(!!obj);
      var view = structure.select({rnumRange : [ 10, 15 ] });
      obj.setOpacity(0.5, view);
      structure.eachAtom(function(atom) {
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(atom, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        if (view.containsResidue(atom.residue())) {
          assert.strictEqual(atomColor[3], 0.5);
        } else {
          assert.strictEqual(atomColor[3], 1.0);
        }
      });
      viewer.destroy();
      done();
  });
});

test('set opacity on mesh geom with trace assoc on structural subset', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.cartoon('object', structure, { 
                               color : color.uniform('red') });
      assert.ok(!!obj);
      var view = structure.select({rnumRange : [ 10, 15 ] });
      obj.setOpacity(0.5, view);
      structure.eachResidue(function(residue) {
        var ca = residue.atom('CA');
        if (ca === null) {
          return;
        }
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(ca, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        if (view.containsResidue(residue)) {
          assert.strictEqual(atomColor[3], 0.5);
        } else {
          assert.strictEqual(atomColor[3], 1.0);
        }
      });
      viewer.destroy();
      done();
  });
});

test('set opacity on mesh geom with atom assoc on structural subset', 
     function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
      var obj = viewer.spheres('object', structure, { 
                               color : color.uniform('red') });
      assert.ok(!!obj);
      var view = structure.select({rnumRange : [ 10, 15 ] });
      obj.setOpacity(0.5, view);
      structure.eachAtom(function(atom) {
        var atomColor = [0, 0, 0, 0];
        obj.getColorForAtom(atom, atomColor);
        assert.strictEqual(atomColor[0], 1.0);
        assert.strictEqual(atomColor[1], 0.0);
        assert.strictEqual(atomColor[2], 0.0);
        if (view.containsResidue(atom.residue())) {
          assert.strictEqual(atomColor[3], 0.5);
        } else {
          assert.strictEqual(atomColor[3], 1.0);
        }
      });
      viewer.destroy();
      done();
  });
});

});


