require(['viewer', 'io', 'color'], function(pv, io, color) { 

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

test('renders structure subset asymmetric units in all styles', function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1r6a.pdb', function(structure) {
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var view = structure.select({ rnumRange : [40, 60] })
      var obj = viewer.renderAs(ALL_STYLES[i], view, ALL_STYLES[i]);
      obj.setSelection(obj.selection());
      assert.ok(!!obj);
    }
    viewer.autoZoom();
    // this make sure we get one draw before tearing everything down and
    // increases code coverage.
    setTimeout(function() {
      viewer.destroy();
      done();
    }, 100);
  });
});

test('renders structure subset assembly 1 in all styles', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  io.fetchPdb('/pdbs/1r6a.pdb', function(structure) {
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var view = structure.select({ rnumRange : [40, 60] })
      var obj = viewer.renderAs(ALL_STYLES[i], view, 
                                ALL_STYLES[i], { showRelated : '1'});
      obj.setSelection(obj.selection());
      assert.ok(!!obj);
    }
    viewer.autoZoom();
    // this make sure we get one draw before tearing everything down and
    // increases code coverage.
    setTimeout(function() {
      viewer.destroy();
      done();
    }, 100);
  });
});

test('renders full structure asymmetric units in all styles', function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1r6a.pdb', function(structure) {
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var obj = viewer.renderAs(ALL_STYLES[i], structure, ALL_STYLES[i]);
      obj.setSelection(obj.selection());
      assert.ok(!!obj);
    }
    viewer.autoZoom();
    // this make sure we get one draw before tearing everything down and
    // increases code coverage.
    setTimeout(function() {
      viewer.destroy();
      done();
    }, 100);
  });
});

test('renders full structure assembly 1 in all styles', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  io.fetchPdb('/pdbs/1r6a.pdb', function(structure) {
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var obj = viewer.renderAs(ALL_STYLES[i], structure, 
                                ALL_STYLES[i], { showRelated : '1'});
      obj.setSelection(obj.selection());
      assert.ok(!!obj);
    }
    viewer.autoZoom();
    // this make sure we get one draw before tearing everything down and
    // increases code coverage.
    setTimeout(function() {
      viewer.destroy();
      done();
    }, 100);
  });
});

test('apply coloring full', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  io.fetchPdb('/pdbs/1r6a.pdb', function(structure) {
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var obj = viewer.renderAs(ALL_STYLES[i], structure, 
                                ALL_STYLES[i], { showRelated : '1'});
      assert.ok(!!obj);
      obj.colorBy(color.uniform());
      obj.colorBy(color.byChain());
      obj.colorBy(color.bySS());
      obj.colorBy(color.ssSuccession());
      obj.colorBy(color.rainbow());
      obj.colorBy(color.byElement());
      obj.colorBy(color.byResidueProp('num'));
      obj.colorBy(color.byAtomProp('index'));
      viewer.clear();
    }
    viewer.destroy();
    done();
  });
});

test('apply coloring partial', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  io.fetchPdb('/pdbs/1r6a.pdb', function(structure) {
    var view = structure.select({rnumRange : [50, 75]});
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var obj = viewer.renderAs(ALL_STYLES[i], structure, 
                                ALL_STYLES[i], { showRelated : '1'});
      assert.ok(!!obj);
      obj.colorBy(color.uniform(), view);
      obj.colorBy(color.byChain(), view);
      obj.colorBy(color.bySS(), view);
      obj.colorBy(color.ssSuccession(), view);
      obj.colorBy(color.rainbow(), view);
      obj.colorBy(color.byElement(), view);
      obj.colorBy(color.byResidueProp('num'));
      obj.colorBy(color.byAtomProp('index'));
      viewer.clear();
    }
    viewer.destroy();
    done();
  });
});


test('renders labels', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  var label = viewer.label('my.label', 
                          'somewhere over the rainbow', [0,0,0]);
  assert.ok(!!label);
  setTimeout(function() {
    viewer.destroy();
    done();
  }, 100);
});

test('renders custom meshes', function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  var mesh = viewer.customMesh('my.label');
  mesh.addTube([0,0,0], [50,0,0], 3, { color : 'red', cap : true });
  mesh.addTube([0,0,0], [0,50,0], 3, { color : 'green', cap : true });
  mesh.addTube([0,0,0], [0,0,50], 3, { color : 'blue', cap : true });
  mesh.addSphere([0,0,0], 5, {color:'yellow'});
  assert.ok(!!mesh);
  setTimeout(function() {
    viewer.destroy();
    done();
  }, 100);
});

});


