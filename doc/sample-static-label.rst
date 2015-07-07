Displaying a static label on top of the viewer
=======================================================

This sample demonstrates how to add a custom static label on top of the viewer. 

The label is added as the first child of the element containing the viewer and is positioned with absolute coordinates. The background is set to have an alpha component of 0, so that the viewer shines through the label.

In the sample code, the label is inserted using JavaScript. That's not a requirement and you can also just define it inside the viewer element directly. The important part is that it is placed using absolute coordinates on top of the viewer.


.. pv-sample::

  <style>
  .static-label {
    position:absolute;
    background: #0000;
    text-align:right;
    z-index: 1;
    font-weight:bold;
    width:290px;
  }
  </style>
  <script>
  var parent = document.getElementById('viewer');
  var staticLabel = document.createElement('div');
  staticLabel.innerHTML = 'crambin';
  staticLabel.className = 'static-label';
  parent.appendChild(staticLabel);
  viewer = pv.Viewer(parent, { 
      width : '300', height: '300', antialias : true, 
      outline : true, quality : 'medium', style : 'hemilight',
      background : 'white', animateTime: 500,
      selectionColor : '#f00'
  });

  pv.io.fetchPdb('_static/1crn.pdb', function(s) {
    viewer.on('viewerReady', function() {
      viewer.cartoon('crambin', s);
      viewer.autoZoom();
    });
  });

  </script>


