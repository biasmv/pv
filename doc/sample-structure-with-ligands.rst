Display protein together with ligands
========================================

This sample shows how to render a protein in cartoon mode and display the contained ligands as balls-and-sticks. For this particular example, we have chosen the dengue methyl transferase structure (1r6a) which contains a s-adenosyl homocysteine and the inhibitor ribavirin 5' triphosphate.


.. pv-sample:: 

  <script>
  var parent = document.getElementById('viewer');
  var viewer = pv.Viewer(parent,
                        { width : 300, height : 300, antialias : true });
  pv.io.fetchPdb('_static/1r6a.pdb', function(structure) {
    // select the two ligands contained in the methyl transferase by name, so
    // we can display them as balls and sticks.
    viewer.on('viewerReady', function() {
      var ligand = structure.select({rnames : ['RVP', 'SAH']});
      viewer.ballsAndSticks('ligand', ligand);
      // display the whole protein as cartoon
      viewer.cartoon('protein', structure);

      // set camera orientation to pre-determined rotation, zoom and
      // center values that are optimal for this very protein
      var rotation = [
        0.1728139370679855, 0.1443438231945038,  0.974320650100708,
        0.0990324765443802, 0.9816440939903259, -0.162993982434272,
        -0.9799638390541077, 0.1246569454669952,  0.155347332358360
      ];
      var center = [6.514, -45.571, 2.929];
      viewer.setCamera(rotation, center, 73);
    });
  });
  </script>
