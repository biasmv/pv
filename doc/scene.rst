Rendered Molecules
=========================================================================================

The displaying of molecules is handled by :class:`pv.BaseGeom`, and subclasses. The two subclasses ``LineGeom`` and ``MeshGeom`` are use for line and mesh-based render styles, respectively.The former for render styles which are based on simple lines (e.g. lines, smooth line trace and line trace), the latter for all other render styles, e.g. cartoon, balls and sticks, spheres, tube and trace. 

.. class:: pv.BaseGeom()

  Represents a geometric object. Note that this class is not part of the public API. New instances are create by calling one of the :ref:`render functions <pv.viewer.rendering>`.

.. function:: pv.BaseGeom.showRelated()
              pv.BaseGeom.setShowRelated(what)

  Controls the display of symmetry-related copies of a molecular structure. When set to 'asym', no symmetry-related copies are rendered, even when they are available. When set to a non-empty string, the Assembly of the given name is used. In case no such assembly exists, the asymmetric unit is shown. See symmetry for a more detailed description.

  :param what: the new name of the symmetry related copies to be displayed
  :return: the name of the symmetry related copy shown.

.. function:: pv.BaseGeom.setOpacity(alpha)

  Set the opacity of the whole geometry to a constant value. See :ref:`pv.color.opacity` for details.

  :param alpha: The new opacity in the range between 0 and 1.

.. function:: pv.BaseGeom.colorBy(colorOp)
              pv.BaseGeom.colorBy(colorOp, view)

  Color the geometry by the given color operation. For a description of available color operations, see :doc:`coloring`.

  :param colorOp: The color operation to be applied to the structure.

  :param view: when specified, the color operation will only be applied to parts contained in the view. Other parts will be left untouched. When omitted, the color operation will be applied to the whole structure.

.. function:: pv.BaseGeom.getColorForAtom(atom, color)

  Convenience function to obtain the current color of a given atom.

  :param atom: the atom for which to retrieve the color. Can be an :class:`~pv.mol.AtomView`, 
      or :class:`~pv.mol.Atom` instance, independent of whether the geometry was created
      with a :class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`
  :param color: array of length 4 into which the color is placed
  :returns: the array holding the color, or null if the atom is not part of the rendered geometry

.. function:: pv.BaseGeom.setSelection(selection)
              pv.BaseGeom.selection()

   Get/set selection of the render geometry, e.g. the part of the structure that is drawn as selected. The viewer draws a halo around the selected parts of the structure using the current highlight color. 

   :param selection: the subset of the structure to be selected/highlighted.

.. function:: pv.BaseGeom.eachCentralAtom(callback) 
  
  Helper function for looping over all visible central atoms, including symmetry related ones

  This function invokes the callback function for all symmetry copies of every visible central atom contained in this object. The callback takes two arguments, the first being the central atom, the second the atom position with the symmetry-operator's transformation matrix applied. Note that the transformed atom position is only to be used inside the callback. If you want to store the transformed position, or modify it, a copy must be obtained first.

  **Example:**

  .. code-block:: javascript

    var obj = viewer.get('my.object');
    var sum = vec3.create();
    var count = 0;
    obj.eachCentralAtom(function(atom, transformedPos) {
      count += 1;
      vec3.add(sum, sum, transformedPos);
    });
    var center = vec3.scale(sum, sum, 1.0/count);
    viewer.setCenter(center);


.. _pv.scene.geometric-shapes: 

Drawing Geometric Shapes
=========================================================================================

Geometric shapes can be added to the 3D scene through :class:`pv.CustomMesh`. At the moment, only two shapes are supported: tubes and spheres. More can be added on request. A new :class:`pv.CustomMesh` instance can be obtained by calling :func:`pv.Viewer.customMesh`.

**Example**


.. code-block:: javascript

  var cm = viewer.customMesh('cross');
  cm.addTube([-50,0,0], [50,0,0], 1, { cap : true, color : 'red' });
  cm.addTube([0,-50,0], [0,50,0], 1, { cap : true, color : 'green' });
  cm.addTube([0,0, -50], [0,0,50], 1, { cap : true, color : 'blue' });
  cm.addSphere([0, 0, 0], 3, { color : 'yellow' });

.. class:: pv.CustomMesh

  Holds a collection of user-defined geometric shapes


.. function:: pv.CustomMesh.addTube(start, end, radius[, options])

  Adds a tube (open or capped) to the custom mesh container

  :param start: 3-dimensional start coordinate of the tube
  :param end: 3-dimensional end coordinate of the tube
  :param radius: radius in Angstrom
  :param options: a dictionary with the following keys. *color*: when provided, used as the color for the tube, *cap* when set to false, the tube is left open, meaning the ends are not capped. *userData*: when provided the user data is added to the object. This data is available when a pick event (click/double click occurs on the object as the target of the pick event. When not provided, userData is set to null.

.. function:: pv.CustomMesh.addSphere(center, radius[, options])

  Adds a sphere to the custom mesh container

  :param center: 3-dimensional center coordinate for the sphere
  :param radius: radius in Angstrom
  :param options: a dictionary with the following keys. *color*: when provided, used as the color for the tube. *userData*: when provided the user data is added to the object. This data is available when a pick event (click/double click occurs on the object as the target of the pick event. When not provided, userData is set to null.

