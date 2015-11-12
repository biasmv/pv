
requirejs.config({
  'baseUrl' : 'src' ,
  // uncomment the following commented-out block to test the contatenated, 
  // minified PV version. Grunt needs to be run before for this to work.
  /*
  paths : {
    pv : '/js/bio-pv.min'
  }
  */
});


// on purpose outside of the require block, so we can inspect the viewer object 
// from the JavaScript console.
var viewer;

var pv;
require(['pv'], function(PV) {

pv = PV;
var io = pv.io;
var viewpoint = pv.viewpoint;
var color = pv.color;

var structure;

function points() {
  viewer.clear();
  var go = viewer.points('structure', structure, {
                         color: color.byResidueProp('num'),
                         showRelated : '1' });
}

function lines() {
  viewer.clear();
  var go = viewer.lines('structure', structure, {
              color: color.byResidueProp('num'),
              showRelated : '1' });
  go.setSelection(go.select({rnumRange : [15,20]}));
  go.setOpacity(0.5, go.select({rnumRange : [25,30]}));
}

function cartoon() {
  viewer.clear();
  var go = viewer.cartoon('structure', structure, {
      color : color.ssSuccession(), showRelated : '1',
  });
  var rotation = viewpoint.principalAxes(go);
  //go.setSelection(go.select({rtype : 'C' }));
  viewer.setRotation(rotation)
}

function lineTrace() {
  viewer.clear();
  var go = viewer.lineTrace('structure', structure, { showRelated : '1' });
}

function spheres() {
  viewer.clear();
  var go = viewer.spheres('structure', structure, { showRelated : '1' });
}

function sline() {
  viewer.clear();
  var go = viewer.sline('structure', structure,
          { color : color.uniform('red'), showRelated : '1'});
}

function tube() {
  viewer.clear();
  var go = viewer.tube('structure', structure);
  viewer.lines('structure.ca', structure.select({aname :'CA'}),
            { color: color.uniform('blue'), lineWidth : 1,
              showRelated : '1' });
}

function trace() {
  viewer.clear();
  var go = viewer.trace('structure', structure, { showRelated : '1' });

}
function ballsAndSticks() {
  viewer.clear();
  var go = viewer.ballsAndSticks('structure', structure, { showRelated : '1' });
}

function preset() {
  viewer.clear();
  var ligand = structure.select({'rnames' : ['SAH', 'RVP']});
  viewer.spheres('structure.ligand', ligand, {
  });
  viewer.cartoon('structure.protein', structure, { boundingSpheres: false });
}

function load(pdb_id) {
  $('#traj-widget').hide();
  $.ajax({ url : 'pdbs/'+pdb_id+'.pdb', success : function(data) {
    structure = io.pdb(data);
    //mol.assignHelixSheet(structure);
    preset();
    //viewer.spheres('helices', structure.select({ aname : 'CA', rtype : 'C'}), { color : color.uniform('red'), radiusMultiplier : 0.3, showRelated : '1' });
    viewer.autoZoom();
  }});
}

function trajectory() {
  viewer.clear();
  $('#traj-widget').show();
  var theTimeOut;
  var intervalFunc;
  $('#traj-button').click(function() {
    var t = $('#traj-button').text();
    if (t === 'Start') {
      $('#traj-button').text('Stop');
      theTimeOut = setInterval(intervalFunc, 1000.0/15.0);
    } else {
      clearInterval(theTimeOut);
      $('#traj-button').text('Start');
    }
  });
  pv.io.fetchCrd('pdbs/trj.crd', function(s) {
    structure = s;
    viewer.ballsAndSticks('trajectory', structure);
    viewer.autoZoom();
    pv.traj.fetchDcd('pdbs/trj.dcd', s, function(cg) {
      var frameId = 0;
      intervalFunc = function() {
        cg.useFrame(frameId);
        frameId += 1;
        frameId = frameId % 32;
        viewer.clear();
        viewer.ballsAndSticks('trajectory', structure);
      };
    });
  });
}

function kinase() {
  load('1ake');
}

function crambin() {
  load('1crn');
}

function transferase() {
  load('1r6a');
}

function telethonin() { load('2f8v'); }

function porin() {
  load('2por');
}
function longHelices() {
  load('4C46');
}

function ssSuccession() {
  viewer.forEach(function(go) {
    go.colorBy(color.ssSuccession());
  });
  viewer.requestRedraw();
}

function uniform() {
  viewer.forEach(function(go) {
    go.colorBy(color.uniform([0,1,0]));
  });
  viewer.requestRedraw();
}
function byElement() {
  viewer.forEach(function(go) {
    go.colorBy(color.byElement());
  });
  viewer.requestRedraw();
}

function ss() {
  viewer.forEach(function(go) {
    go.colorBy(color.bySS());
  });
  viewer.requestRedraw();
}

function proInRed() {
  viewer.forEach(function(go) {
    go.colorBy(color.uniform('red'), go.select({rname : 'PRO'}));
  });
  viewer.requestRedraw();
}
function rainbow() {
  viewer.forEach(function(go) {
    go.colorBy(color.rainbow());
  });
  viewer.requestRedraw();
}

function byChain() {
  viewer.forEach(function(go) {
    go.colorBy(color.byChain());
  });
  viewer.requestRedraw();
}

function polymerase() {
  load('4UBB');
};


function phong() {
  viewer.options('style', 'phong');
  viewer.requestRedraw();
}

function hemilight() {
  viewer.options('style', 'hemilight');
  viewer.requestRedraw();
}


function cross() {
  viewer.clear();
  var go = viewer.customMesh('custom');

  go.addSphere([-10, 0, 0], 2, { userData : 'one' } );
  go.addSphere([10, 0, 0], 2, { userData : 'two' } );
  go.addSphere([0, -10, 0], 2, { userData : 'three' } );
  go.addSphere([0, 10, 0], 2, { userData : 'four' } );
  go.addSphere([0, 0, -10], 2, { userData : 'five' } );
  go.addSphere([0, 0, 10], 2, { userData : 'six' } );
  viewer.setCenter([0,0,0], 2, { userData : 'seven' } );
  viewer.setZoom(20);
}

function ensemble() {
  $('#traj-widget').hide();
  io.fetchPdb('pdbs/1nmr.pdb', function(structures) {
    viewer.clear()
    structure = structures[i];
    for (var i = 0; i < structures.length; ++i) {
      go = viewer.cartoon('ensemble_'+ i, structures[i]);
    }
    viewer.autoZoom();
  }, { loadAllModels : true } );
}
$(document).foundation();
$('#1r6a').click(transferase);
$('#1crn').click(crambin);
$('#1ake').click(kinase);
$('#4ubb').click(polymerase);
$('#4c46').click(longHelices);
$('#2f8v').click(telethonin);
$('#ensemble').click(ensemble);
$('#style-cartoon').click(cartoon);
$('#style-tube').click(tube);
$('#style-line-trace').click(lineTrace);
$('#style-sline').click(sline);
$('#style-trace').click(trace);
$('#style-lines').click(lines);
$('#style-balls-and-sticks').click(ballsAndSticks);
$('#style-points').click(points);
$('#style-spheres').click(spheres);
$('#color-uniform').click(uniform);
$('#color-element').click(byElement);
$('#color-chain').click(byChain);
$('#color-ss-succ').click(ssSuccession);
$('#color-ss').click(ss);
$('#phong').click(phong);
$('#trajectory').click(trajectory);
$('#hemilight').click(hemilight);
$('#color-rainbow').click(rainbow);
$('#load-from-pdb').change(function() {
  var pdbId = this.value;
  this.value = '';
  this.blur();
  var url = 'http://www.rcsb.org/pdb/files/' + pdbId + '.pdb';
  console.log(url)
  io.fetchPdb(url, function(s) {
    structure = s;
    cartoon();
    viewer.autoZoom();
  });
});

viewer = pv.Viewer(document.getElementById('viewer'), { 
    width : 'auto', height: 'auto', antialias : true, fog : true,
    outline : true, quality : 'high', style : 'phong',
    selectionColor : 'white', transparency : 'screendoor', 
    background : '#ccc', animateTime: 500, doubleClick : null
});

viewer.addListener('viewerReady', trajectory);

viewer.on('doubleClick', function(picked) {
  console.log(picked.connectivity());
  if (picked === null) {
    viewer.fitTo(structure);
    return;
  }
  viewer.setCenter(picked.pos(), 500);
});

window.addEventListener('resize', function() {
      viewer.fitParent();
});

});
