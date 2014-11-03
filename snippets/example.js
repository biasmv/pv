var activeTab = 'styleTab';
$('#colorTab').hide();

var app = require("bio-pv");

var width = document.getElementById('gl').offsetWidth;
var height = document.getElementById('gl').offsetHeight;

var pv = app.Viewer(document.getElementById('gl'), 
    { quality : 'high', width: width, height : height,
      antialias : true, outline : false,
      background : 'white',
      slabMode : 'auto'});

var structure;
function lines() {
  pv.clear();
  pv.lines('structure', structure, { 
    color: color.byResidueProp('num'),
    showRelated : '1' });
}
function cartoon() {
  pv.clear();
  pv.cartoon('structure', structure, { 
    color : color.ssSuccession(), showRelated : '1', 
  });
}
function lineTrace() {
  pv.clear();
  pv.lineTrace('structure', structure, { showRelated : '1' });
}

function spheres() {
  pv.clear();
  pv.spheres('structure', structure, { showRelated : '1' });
}

function sline() {
  pv.clear();
  pv.sline('structure', structure, 
      { color : color.uniform('red'), showRelated : '1'});
}

function tube() {
  pv.clear();
  pv.tube('structure', structure);
  pv.lines('structure.ca', structure.select({aname :'CA'}), 
      { color: color.uniform('blue'), lineWidth : 1,
        showRelated : '1' });
}

function trace() {
  pv.clear();
  pv.trace('structure', structure, { showRelated : '1' });
}
function ballsAndSticks() {
  pv.clear();
  pv.ballsAndSticks('structure', structure, { showRelated : '1' });
}

function preset() {
  pv.clear();
  var ligand = structure.select({'rnames' : ['SAH', 'RVP']});
  pv.ballsAndSticks('structure.ligand', ligand, { 
  });
  pv.cartoon('structure.protein', structure, { boundingSpheres: false });
}

function load(pdb_id) {
  $.ajax({ url : '../pdbs/'+pdb_id+'.pdb', success : function(data) {
    structure = io.pdb(data);
    //mol.assignHelixSheet(structure);
    cartoon();
    pv.autoZoom();
  }});
}
function kinase() {
  load('1ake');
}

$(function() {
  $( "#slider" ).slider({
    slide: function(event, ui) {

      pv.forEach(function(go) {
        go.setOpacity(1.0 - ui.value/100. , go);
      });
      pv.requestRedraw();
    }
  })
});

function showTab(tabName) {
  $('#'+activeTab).hide();
  $('#'+tabName).show();
  activeTab = tabName;
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
  load('4c46');
}

function ssSuccession() {
  pv.forEach(function(go) {
    go.colorBy(color.ssSuccession());
  });
  pv.requestRedraw();
}

function uniform() {
  pv.forEach(function(go) {
    go.colorBy(color.uniform([0,1,0]));
  });
  pv.requestRedraw();
}
function byElement() {
  pv.forEach(function(go) {
    go.colorBy(color.byElement());
  });
  pv.requestRedraw();
}

function ss() {
  pv.forEach(function(go) {
    go.colorBy(color.bySS());
  });
  pv.requestRedraw();
}

function proInRed() {
  pv.forEach(function(go) {
    go.colorBy(color.uniform('red'), go.select({rname : 'PRO'}));
  });
  pv.requestRedraw();
}
function rainbow() {
  pv.forEach(function(go) {
    go.colorBy(color.rainbow());
  });
  pv.requestRedraw();
}

function byChain() {
  pv.forEach(function(go) {
    go.colorBy(color.byChain());
  });
  pv.requestRedraw();
}

var auto = true;
function test() {
  if (auto) {
    pv.slabMode('fixed', { near: 0.1, far : 400.0});
  } else {
    pv.slabMode('auto');
  }
  auto = !auto;
}

$('#cartoon').click(cartoon);
$('#line-trace').click(lineTrace);
$('#preset').click(preset);
$('#lines').click(lines);
$('#trace').click(trace);
$('#sline').click(sline);
$('#spheres').click(spheres);
$('#balls-and-sticks').click(ballsAndSticks);
$('#test').click(test);
$('#tube').click(tube);
$('#1ake').click(kinase);
$('#1r6a').click(transferase);
$('#1crn').click(crambin);
$('#2por').click(porin);
$('#1rb8').click(function() { load('1rb8'); });
$('#2f8v').click(telethonin);
$('#4c46').click(longHelices);
$('#rainbow').click(rainbow);
$('#ss').click(ss);
$('#uniform').click(uniform);
$('#by-ele').click(byElement);
$('#ss-suc').click(ssSuccession);
$('#by-chain').click(byChain);
$('#pro-in-red').click(proInRed);
$('#pdbid').change(function() {
  var st = $('#status')
    st.show();
  var pdbId = this.value;
  this.value = '';
  this.blur();
  st.text('retrieving file from pdb.org. This may take a while');
  $.ajax('http://pdb.org/pdb/files/'+pdbId+'.pdb')
    .done(function(data) {
      st.text('loaded');
      structure = io.pdb(data);
      cartoon();
      pv.autoZoom();
      st.fadeOut(2000);
    })
  .fail(function() {
    st.text('could not load '+pdbId+' from PDB.org');
    st.fadeOut(2000);
  });
});
$('#save').click(function() {
  var imgDataURL = pv.imageData();
  window.open(imgDataURL);
});
$('#showOutline').change(function() {
  pv.options('outline', this.checked);
  pv.requestRedraw();
});
$('#fog').change(function() {
  pv.options('fog', this.checked);
  pv.requestRedraw();
});

document.addEventListener('DOMContentLoaded', crambin);
/*
   window.addEventListener('resize', function() {
   pv.fitParent();
   });
   */

