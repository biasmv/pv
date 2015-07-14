Adding custom geometry to the 3D scene
=======================================================

This sample demonstrates how to add custom geometry to the 3d scene. The code places small spheres on a helical structure and colors them using a gradient. 

.. pv-sample::

  <script>
  var parent = document.getElementById('viewer');
  viewer = pv.Viewer(parent, { 
      width : '300', height: '300', antialias : true, 
      outline : true, quality : 'high', style : 'hemilight',
  });
  viewer.on('viewerReady', function() {
    var helix = viewer.customMesh('custom');
    for (var i = -50; i < 50; ++i) {
      var x = Math.cos(i * 0.4);
      var y = i * 0.1;
      var z = Math.sin(i * 0.4);
      var color = i * 0.01 + 0.5;
      // add sphere at the given position with a radius of 0.1
      helix.addSphere([x,y,z], 0.1, { color : [color, color, 0]});
      
      // add a capped tube  in the center of the helix with a 
      // radius of 0.1
      helix.addTube([0, -5, 0], [0, 5, 0], 0.1, 
                    { cap : true, color : 'blue' });

      // set zoom to a pre-determined value. Alternatively, 
      // viewer.autoZoom() can be used.
      viewer.setZoom(14);
    }
  });

  </script>


