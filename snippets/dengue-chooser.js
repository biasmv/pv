var pv = require("bio-pv");

var viewer = pv.Viewer(document.getElementById('gl'), 
    { quality : 'high', width: 'auto', height : 'auto',
      antialias : true, outline : true});

var structure;

function lines() {
  viewer.clear();
  viewer.lines('structure', structure);
}

function cartoon() {
  viewer.clear();
  viewer.cartoon('structure', structure, { color: pv.color.ssSuccession() });
}

function lineTrace() {
  viewer.clear();
  viewer.lineTrace('structure', structure);
}

function sline() {
  viewer.clear();
  viewer.sline('structure', structure);
}

function tube() {
  viewer.clear();
  viewer.tube('structure', structure);
}

function trace() {
  viewer.clear();
  viewer.trace('structure', structure);
}

function preset() {
  viewer.clear();
  var ligand = structure.select({rnames : ['RVP', 'SAH']});
  viewer.ballsAndSticks('ligand', ligand);
  viewer.cartoon('protein', structure);
}

function loadTransferase() {
  document.getElementById('status').innerHTML ='loading transferase';
  pv.io.fetchPdb('../pdbs/1r6a.pdb', function(molecule) {
    structure = molecule;
    preset();
    // set camera orientation to pre-determined rotation, zoom and 
    // center values that are optimal for this very molecule
    var rotation = [ 
       0.1728139370679855, 0.1443438231945038,  0.974320650100708, 
       0.0990324765443802, 0.9816440939903259, -0.162993982434272, 
      -0.9799638390541077, 0.1246569454669952,  0.155347332358360
    ];
    var center = [6.514, -45.571, 2.929];
    viewer.setCamera(rotation, center, 73);
    document.getElementById('status').innerHTML = '&nbsp;';
  });
}

document.getElementById('cartoon').onclick = cartoon;
document.getElementById('line-trace').onclick = lineTrace;
document.getElementById('preset').onclick = preset;
document.getElementById('lines').onclick = lines;
document.getElementById('trace').onclick = trace;
document.getElementById('sline').onclick = sline;
document.getElementById('tube').onclick = tube;

window.onresize = function(event) {
  viewer.fitParent();
}

viewer.on('viewerReady', loadTransferase);
