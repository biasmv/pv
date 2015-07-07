Display an NMR ensemble
=================================================

In this sample we are going to use the *loadAllModels* option of the :func:`PDB parser<pv.io.fetchPdb>` to load all structures present in a multi-model PDB file. The models are then displayed together in the viewer using the :func:`cartoon render mode <pv.Viewer.cartoon>`.

.. pv-sample::

  <script>
  var viewer = pv.Viewer(document.getElementById('viewer'), 
                        { width : 300, height : 300, antialias : true });

  pv.io.fetchPdb('_static/1nmr.pdb', function(structures) {
      // put this in the viewerReady block to make sure we don't try to add the 
      // object before the viewer is ready. In case the viewer is completely 
      // loaded, the function will be immediately executed.
      viewer.on('viewerReady', function() {
        var index = 0;
        structures.forEach(function(s) { 
          viewer.cartoon('structure_' + (index++), s); 
        });
        // adjust center of view and zoom such that all structures can be seen.
        var rotation = pv.viewpoint.principalAxes(viewer.all()[0]);
        viewer.setRotation(rotation)
        viewer.autoZoom();
      });
  },  { loadAllModels : true });
  </script>

