var activeTab = 'styleTab';
$('#colorTab').hide();

var viewer = pv.Viewer(document.getElementById('gl'), 
    { quality : 'medium', width: 'auto', height : 'auto',
      antialias : true, outline : false,
      background : 'white',
      slabMode : 'auto'});

var structure;

function lines() {
  viewer.clear();
  return viewer.lines('structure', structure, { 
    color: color.byResidueProp('num'),
    showRelated : '1' });
}
function cartoon() {
  viewer.clear();
  return viewer.cartoon('structure', structure, { 
    color : color.ssSuccession(), showRelated : '1', 
  });
}
function lineTrace() {
  viewer.clear();
  return viewer.lineTrace('structure', structure, { showRelated : '1' });
}

function spheres() {
  viewer.clear();
  return viewer.spheres('structure', structure, { showRelated : '1' });
}

function sline() {
  viewer.clear();
  return viewer.sline('structure', structure, 
      { color : color.uniform('red'), showRelated : '1'});
}

function tube() {
  viewer.clear();
  return viewer.tube('structure', structure);
}

function trace() {
  viewer.clear();
  return viewer.trace('structure', structure, { showRelated : '1' });
}
function ballsAndSticks() {
  viewer.clear();
  return viewer.ballsAndSticks('structure', structure, { showRelated : '1' });
}

function preset() {
  viewer.clear();
  var ligand = structure.select('ligand')
  viewer.ballsAndSticks('structure.ligand', ligand, { 
    showRelated : '1'
  });
  return viewer.cartoon('structure.protein', structure, {
    showRelated : '1'
  });
}

function load(pdb_id) {
  $.ajax({ url : '../pdbs/'+pdb_id+'.pdb', success : function(data) {
    structure = pv.io.pdb(data);
    var go = cartoon();
    viewer.setRotation(viewpoint.principalAxes(go));
    viewer.autoZoom();
  }});
}
function kinase() {
  load('1ake');
}

$(function() {
  $( "#slider" ).slider({
    slide: function(event, ui) {

      viewer.forEach(function(go) {
        go.setOpacity(1.0 - ui.value/100. , go);
      });
      viewer.requestRedraw();
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

$('#cartoon').click(cartoon);
$('#line-trace').click(lineTrace);
$('#preset').click(preset);
$('#lines').click(lines);
$('#trace').click(trace);
$('#sline').click(sline);
$('#spheres').click(spheres);
$('#balls-and-sticks').click(ballsAndSticks);
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
      preset();
      viewer.autoZoom();
      st.fadeOut(2000);
    })
  .fail(function() {
    st.text('could not load '+pdbId+' from PDB.org');
    st.fadeOut(2000);
  });
});

$('#save').click(function() {
  var imgDataURL = viewer.imageData();
  window.open(imgDataURL);
});

$('#showOutline').change(function() {
  viewer.options('outline', this.checked);
  viewer.requestRedraw();
});

$('#fog').change(function() {
  viewer.options('fog', this.checked);
  viewer.requestRedraw();
});

viewer.on('viewerReady', crambin);

