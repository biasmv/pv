Measure distance between two atoms
=================================================

This sample shows how add support for measuring the distance between two atoms.

Usage
--------------------------------------------------

Click on two atoms to measure the distance between them. After clicking the second atom, a line will be drawn that connects the two atoms with the distance displayed in a label.

.. pv-sample::

  <script>
  var parent = document.getElementById('viewer');
  var viewer = pv.Viewer(parent,
                         { width : 300, height : 300, antialias : true, 
                           selectionColor : 'red' });

  pv.io.fetchPdb('_static/1crn.pdb', function(structure) {
    viewer.on('viewerReady', function() {
      viewer.cartoon('crambin', structure);
      viewer.autoZoom();
    });
  });

  var lastAtom = null;
  

  // register click handler that does all the distance-measure-foo
  viewer.addListener('click', function(picked) {
    if (picked === null) return;
    var target = picked.target();
    if (target.qualifiedName === undefined) {
      return;
    }
    var node = picked.node();
    var view = node.structure().createEmptyView();
    if (lastAtom !== null) {
      // remove distance-related objects from previous distance 
      // measurements.
      viewer.rm('dist.*');
      var g = viewer.customMesh('dist.line');
      var midPoint = pv.vec3.clone(lastAtom.pos());
      pv.vec3.add(midPoint, midPoint, target.pos());
      pv.vec3.scale(midPoint, midPoint, 0.5);
      // add a tube to connect the two atoms
      g.addTube(lastAtom.pos(), target.pos(), 0.1, 
                { cap : true, color : 'white' });
      var d = pv.vec3.distance(lastAtom.pos(), target.pos());
      var l = viewer.label('dist.label', d.toFixed(2), midPoint);
      lastAtom = null;
    } else {
      lastAtom = target;
      view.addAtom(target);
    }
    node.setSelection(view);
    viewer.requestRedraw();
  });
  </script>
