Color structure by custom property
=======================================================


This sample demonstrates how to color a structure by using a user-defined property on residues. In analogy, these properties may be defined on atoms as well.

.. pv-sample::

  <script>
  viewer = pv.Viewer(document.getElementById('viewer'), { 
      width : '300', height: '300', antialias : true, 
      outline : true, quality : 'medium', style : 'hemilight',
      background : 'white', animateTime: 500,
      selectionColor : '#f00'
  });

  viewer.on('viewerReady', function() {
    pv.io.fetchPdb('_static/1crn.pdb', function(structure) {
      // for demonstration purposes, define a property funky on all residues 
      // that cycles through the values 0-9.
      var index = 0;
      structure.eachResidue(function(r) {
        r.setProp('funky', index++ % 10);
      });
      // use pv.color.byResidueProp in combination with the "funky" property 
      // defined above. Analogously to color by atom property, use 
      // pv.color.byAtomProp()
      viewer.cartoon('structure', structure, { 
        color : pv.color.byResidueProp('funky') 
      });
      viewer.fitTo(structure);
    });
  });
  </script>


