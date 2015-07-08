Displaying a label on an atom
=======================================================

This sample demonstrates how to add a label in the 3d scene to annotate an atom.

.. pv-sample::

  <script>
  var parent = document.getElementById('viewer');
  viewer = pv.Viewer(parent, { 
      width : '300', height: '300', antialias : true, 
      outline : true, quality : 'medium', style : 'hemilight',
      background : 'white', animateTime: 500,
      selectionColor : '#f00'
  });

  pv.io.fetchPdb('_static/1crn.pdb', function(s) {
    viewer.on('viewerReady', function() {
      viewer.cartoon('crambin', s);
      var carbonAlpha = s.atom('A.31.CA');
      // override a few default options to show their effect
      var options = {
       fontSize : 16, fontColor: '#f22', backgroundAlpha : 0.4
      };
      viewer.label('label', carbonAlpha.qualifiedName(), 
                   carbonAlpha.pos(), options);
      viewer.autoZoom();
    });
  });

  </script>


