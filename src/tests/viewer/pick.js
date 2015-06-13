require(['viewer', 'io', 'color', 'gl-matrix'], 
        function(pv, io, color, glMatrix) { 

var mat4 = glMatrix.mat4;

var ALL_STYLES = [
  'cartoon', 'tube', 'lines', 'spheres', 'ballsAndSticks',
  'sline', 'trace', 'lineTrace', 'points'
];

function createViewer() {
  var options =  {
    width: '300', height : '300', 
    background : '#333'
  };
  return pv.Viewer(document.getElementById('viewer'), options);
}

test('pick custom mesh', function(assert) {
  var viewer = createViewer();
  var go = viewer.customMesh('custom');

  go.addSphere([0, 0, 0], 2, { userData : 'one' } );
  viewer.setCenter([0,0,0], 2, { userData : 'seven' } );
  viewer.setZoom(20);
  var picked = viewer.pick( { x: 150, y : 150 });
  assert.strictEqual(picked.target(), 'one');
  assert.strictEqual(picked.symIndex(), null);
  assert.strictEqual(picked.node(), go);
});

test('pick atom', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  var go = viewer.customMesh('custom');
  io.fetchPdb('/pdbs/1crn.pdb', function(s) {
    var go = viewer.spheres('spheres', s, { showRelated : '1' });
    var firstAtom = s.atoms()[0];
    viewer.setCenter(firstAtom.pos());
    viewer.setZoom(10);
    var picked = viewer.pick( { x: 150, y : 150 });
    assert.strictEqual(picked.target(), firstAtom);
    assert.strictEqual(picked.symIndex(), 0);
    assert.strictEqual(picked.node(), go);
    // the following lines test for the deprecated interface
    assert.strictEqual(picked.object().atom, firstAtom);
    assert.mat4Equal(picked.transform(), mat4.create());
    done();
  });
});

test('pick nothing', function(assert) {
  var viewer = createViewer();
  var go = viewer.customMesh('custom');

  go.addSphere([0, 0, 0], 2, { userData : 'one' } );
  viewer.setCenter([0,0,0], 2, { userData : 'seven' } );
  viewer.setZoom(20);
  // use a point that does not have an object beneath.
  var picked = viewer.pick( { x: 50, y : 50 });
  assert.strictEqual(picked, null);
});

});


