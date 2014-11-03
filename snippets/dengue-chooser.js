var app = require("bio-pv");
var pv = app.Viewer(document.getElementById('gl'), 
    { quality : 'high', width: 'auto', height : 'auto',
      antialias : true, outline : true});
var structure;
function lines() {
  pv.clear();
  pv.lines('structure', structure);
}
function cartoon() {
  pv.clear();
  pv.cartoon('structure', structure, { color: color.ssSuccession() });
}
function lineTrace() {
  pv.clear();
  pv.lineTrace('structure', structure);
}
function sline() {
  pv.clear();
  pv.sline('structure', structure);
}
function tube() {
  pv.clear();
  pv.tube('structure', structure);
}
function trace() {
  pv.clear();
  pv.trace('structure', structure);
}
function preset() {
  pv.clear();
  var ligand = structure.select({rnames : ['RVP', 'SAH']});
  pv.ballsAndSticks('ligand', ligand);
  pv.cartoon('protein', structure);
}
function load(pdb_id) {
  document.getElementById('status').innerHTML ='loading '+pdb_id;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '../pdbs/'+pdb_id+'.pdb');
  xhr.setRequestHeader('Content-type', 'application/x-pdb');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      structure = io.pdb(xhr.responseText);
      preset();
      pv.centerOn(structure);
    }
    document.getElementById('status').innerHTML = '';
  }
  xhr.send();
}
function transferase() {
  load('1r6a');
}
document.getElementById('cartoon').onclick = cartoon;
document.getElementById('line-trace').onclick = lineTrace;
document.getElementById('preset').onclick = preset;
document.getElementById('lines').onclick = lines;
document.getElementById('trace').onclick = trace;
document.getElementById('sline').onclick = sline;
document.getElementById('tube').onclick = tube;
window.onresize = function(event) {
  pv.fitParent();
}
document.addEventListener('DOMContentLoaded', transferase);
