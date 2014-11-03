var app = require("bio-pv");

var pv = app.Viewer(yourDiv, 
    { quality : 'high', width: 600, height : 600,
      antialias : true, outline : false,
      background : 'white',
      slabMode : 'auto'});


function load(pdb_id) {
  $.ajax({ url : '../pdbs/'+pdb_id+'.pdb', success : function(data) {
    structure = io.pdb(data);
    //mol.assignHelixSheet(structure);
    cartoon();
    pv.autoZoom();
  }});
}

function cartoon() {
  pv.clear();
  pv.cartoon('structure', structure, { 
    color : color.ssSuccession(), showRelated : '1', 
  });
}

// load default
load('1crn');
