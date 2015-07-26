
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
viewer = pv.Viewer(document.getElementById('viewer'), { 
    width : 'auto', height: 'auto', antialias : true, 
    outline : true, quality : 'medium', style : 'hemilight',
    selectionColor : 'red',
    background : '#333', animateTime: 500, doubleClick : null
});

viewer.options('selectionColor', '#f00');

pv.io.fetchPdb('/pdbs/1crn.pdb', function(s) {
  viewer.on('viewerReady', function() {
    var go = viewer.spheres('crambin', s, { showRelated: '1'});
    go.setSelection(go.select({rnumRange : [15,20]}));
    viewer.autoZoom();
  });
});

document.addEventListener('keypress', function(ev) {
  if (ev.charCode === 13) {
    var allSelections = [];
    viewer.forEach(function(go) {
      if (go.selection !== undefined) {
        allSelections.push(go.selection());
      }
    });
    viewer.fitTo(allSelections);
  }
});

viewer.on('click', function(picked, ev) {
  if (picked === null || picked.target() === null) {
    return;
  }
  if (picked.node().structure === undefined) {
    return;
  }
  var extendSelection = ev.shiftKey;
  var sel;
  if (extendSelection) {
    var sel = picked.node().selection();
  } else {
    var sel = picked.node().structure().createEmptyView();
  }
  if (!sel.removeAtom(picked.target(), true)) {
    // in case atom was not part of the view, we have to add it, because it 
    // wasn't selected before. Otherwise removeAtom took care of it.
    sel.addAtom(picked.target());
  } 
  picked.node().setSelection(sel);
  viewer.requestRedraw();
});


});
