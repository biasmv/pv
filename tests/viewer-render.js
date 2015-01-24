var ALL_STYLES = [
  'cartoon', 'tube', 'lines', 'spheres', 'ballsAndSticks',
  'sline', 'trace', 'lineTrace'
];

function createViewer() {
  var options =  {
    width: 'auto', height : 'auto', 
    background : '#333'
  };
  return pv.Viewer(document.getElementById('viewer'), options);
}

test("renders molecule asymmetric units in all styles", function(assert) {
  var done = assert.async();

  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
    console.log(structure);
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var obj = viewer.renderAs(ALL_STYLES[i], structure, ALL_STYLES[i]);
      assert.ok(!!obj);
      viewer.clear();
    }
    viewer.destroy();
    
    done();
  });
});

test("renders molecule assembly 1 in all styles", function(assert) {
  var done = assert.async();
  var viewer = createViewer();
  io.fetchPdb('/pdbs/1crn.pdb', function(structure) {
    console.log(structure);
    for (var i = 0; i < ALL_STYLES.length; ++i) {
      var obj = viewer.renderAs(ALL_STYLES[i], structure, 
                                ALL_STYLES[i], { showRelated : '1'});
      assert.ok(!!obj);
      viewer.clear();
    }
    viewer.destroy();
    done();
  });
});

