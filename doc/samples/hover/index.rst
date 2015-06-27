Get name of atom under mouse cursor
=================================================

This sample shows how to get the name of the atom under the mouse cursor. The code also shows how to change color of an individual atom.

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

  var prevPicked = null;
  // add mouse move event listener to the div element containing the viewer. Whenever 
  // the mouse moves, use viewer.pick() to get the current atom under the cursor. We 
  // display the atom's name in the span below the viewer.
  parent.addEventListener('mousemove', function(event) {
      var rect = viewer.boundingClientRect();
      var picked = viewer.pick({ x : event.clientX - rect.left, 
                                 y : event.clientY - rect.top });
      if (prevPicked !== null && picked != null && 
          picked.target() === prevPicked.atom) {
        return;
      }
      if (prevPicked !== null) {
        // reset color of previously picked atom.
        setColorForAtom(prevPicked.node, prevPicked.atom, prevPicked.color);
      }
      if (picked) {
        var atom = picked.target();
        document.getElementById('picked-atom-name').innerHTML = atom.qualifiedName();
        // set color of current picked atom to red and store the current color so we 
        // know what it was.
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
  pv.io.fetchPdb('http://www.rcsb.org/pdb/files/1crn.pdb', function(structure) {
      // object before the viewer is ready. In case the viewer is completely 
      // loaded, the function will be immediately executed.
      viewer.on('viewerReady', function() {
        var go = viewer.cartoon('structure', structure); 
        // adjust center of view and zoom such that all structures can be seen.
        viewer.autoZoom();
      });
  });
  </script>

