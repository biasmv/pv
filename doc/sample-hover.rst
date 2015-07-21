Highlight atom under mouse cursor
=================================================

This sample shows how to highlight the atom under the mouse cursor by changing it's color to red and display it's name.

.. note::

  While it's possible to temporarily change the color for highlighting purposes, it's recommended to use the :func:`selection highlighting functionality <pv.BaseGeom.setSelection>` added in in PV 1.8.0 instead.

This sample requires PV 1.7.0 and higher to work as it relies on functionality that was added in 1.7.0.


.. pv-sample::

  <div id='picked-atom-name' style='text-align:center;'>&nbsp;</div>
  <script>
  var parent = document.getElementById('viewer');
  var viewer = pv.Viewer(parent,
                        { width : 300, height : 300, antialias : true });


  function setColorForAtom(go, atom, color) {
      var view = go.structure().createEmptyView();
      view.addAtom(atom);
      go.colorBy(pv.color.uniform(color), view);
  }

  // variable to store the previously picked atom. Required for resetting the color 
  // whenever the mouse moves.
  var prevPicked = null;
  // add mouse move event listener to the div element containing the viewer. Whenever 
  // the mouse moves, use viewer.pick() to get the current atom under the cursor. 
  parent.addEventListener('mousemove', function(event) {
      var rect = viewer.boundingClientRect();
      var picked = viewer.pick({ x : event.clientX - rect.left, 
                                 y : event.clientY - rect.top });
      if (prevPicked !== null && picked !== null && 
          picked.target() === prevPicked.atom) {
        return;
      }
      if (prevPicked !== null) {
        // reset color of previously picked atom.
        setColorForAtom(prevPicked.node, prevPicked.atom, prevPicked.color);
      }
      if (picked !== null) {
        var atom = picked.target();
        document.getElementById('picked-atom-name').innerHTML = atom.qualifiedName();
        // get RGBA color and store in the color array, so we know what it was 
        // before changing it to the highlight color.
        var color = [0,0,0,0];
        picked.node().getColorForAtom(atom, color);
        prevPicked = { atom : atom, color : color, node : picked.node() };

        setColorForAtom(picked.node(), atom, 'red');
      } else {
        document.getElementById('picked-atom-name').innerHTML = '&nbsp;';
        prevPicked = null;
      }
      viewer.requestRedraw();
  });
  pv.io.fetchPdb('_static/1crn.pdb', function(structure) {
      // put this in the viewerReady block to make sure we don't try to add the 
      // object before the viewer is ready. In case the viewer is completely 
      // loaded, the function will be immediately executed.
      viewer.on('viewerReady', function() {
        var go = viewer.cartoon('structure', structure); 
        // adjust center of view and zoom such that all structures can be seen.
        viewer.autoZoom();
      });
  });
  </script>

