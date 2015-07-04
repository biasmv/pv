
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
    background : '#fff', animateTime: 500, doubleClick : null
});

viewer.addPlugin();
viewer.on('viewerReady', function() {
});


});
