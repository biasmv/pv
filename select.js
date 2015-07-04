
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
    background : '#333', animateTime: 500, doubleClick : null
});

pv.io.fetchPdb('/pdbs/1r6a.pdb', function(s) {
  viewer.on('viewerReady', function() {
    viewer.cartoon('crambin', s);
    viewer.autoZoom();
  });
});

document.addEventListener('keypress', function(ev) {
});

viewer.on('click', function(picked, ev) {
  // FIXME: figure out how to prevent context menu from popping up when Ctrl 
  // is pressed.
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
  sel.addAtom(picked.target());
  picked.node().setSelection(sel);
  viewer.requestRedraw();
});


});
