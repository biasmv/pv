var pv = require("bio-pv");

var viewer = pv.Viewer(document.getElementById('hereGoesTheViewer'), {
  quality: 'medium',
  width: 'auto',
  height: 'auto',
  antialias: true,
  outline: true,
  slabMode: 'auto'
});

function load(name, pdbId) {
  pv.io.fetchPdb('../pdbs/' + pdbId + '.pdb', function(structure) {
    // render everything as helix/sheet/coil cartoon, coloring by secondary 
    // structure succession
    var go = viewer.cartoon('structure', structure, {
      color: pv.color.ssSuccession(),
      showRelated: '1',
    });

    // find camera orientation such that the molecules biggest extents are 
    // aligned to the screen plane.
    var rotation = pv.viewpoint.principalAxes(go);
    viewer.setRotation(rotation)

    // adapt zoom level to contain the whole structure
    viewer.autoZoom();
  });
}


// load default
load('kinase', '1ake');

// tell viewer to resize when window size changes.
window.onresize = function(event) {
  viewer.fitParent();
}
