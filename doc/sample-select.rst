Select atoms/residues using mouse and keyboard
=======================================================


This sample demonstrates how to select residues with mouse an keyboard by using the selection highlighting introduced in PV 1.8 to visually highlight a subset of residues and atoms. 


Usage
-------------------------------------------------------

* **click:** select clicked residue/atom
* **shift click:** select clicked residue/atom an extend selection
* **return**: center view on selected atoms


.. pv-sample::

  <script>
  viewer = pv.Viewer(document.getElementById('viewer'), { 
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

  // register a keypressed listener and check for return key 
  // presses. Whenever the return key is pressed,  the camera zooms
  // in on the currently selected residues.
  document.addEventListener('keypress', function(ev) {
    if (ev.keyCode === 13) {
      var allSelections = [];
      viewer.forEach(function(go) {
        if (go.selection !== undefined) {
          allSelections.push(go.selection());
        }
      });
      viewer.fitTo(allSelections);
    }
  });

  viewer.on('click', function(picked, ev) {
    if (picked === null || picked.target() === null) {
      return;
    }
    // don't to anything if the clicked structure does not have an atom.
    if (picked.node().structure === undefined) {
      return;
    }
    // when the shift key is pressed, extend the selection, otherwise 
    // only select the clicke atom.
    var extendSelection = ev.shiftKey;
    var sel;
    if (extendSelection) {
      var sel = picked.node().selection();
    } else {
      var sel = picked.node().structure().createEmptyView();
    }
    // in case atom was not part of the view, we have to add it, because 
    // it wasn't selected before. Otherwise removeAtom took care of it 
    // and we don't have to do anything.
    if (!sel.removeAtom(picked.target(), true)) {
      sel.addAtom(picked.target());
    } 
    picked.node().setSelection(sel);
    viewer.requestRedraw();
  });

  </script>


