Rendered Molecules
=========================================================================================

The displaying of molecules is handled by :class:`BaseGeom`, and subclasses. The two subclasses :class:`LineGeom` and :class:`MeshGeom` are use for line and mesh-based render styles, respectively.The former for render styles which are based on simple lines (e.g. lines, smooth line trace and line trace), the latter for all other render styles, e.g. cartoon, balls and sticks, spheres, tube and trace. 

.. function:: BaseGeom.showRelated()
              BaseGeom.setShowRelated(what)

  Controls the display of symmetry-related copies of a molecular structure. When set to 'asym', no symmetry-related copies are rendered, even when they are available. When set to a non-empty string, the Assembly of the given name is used. In case no such assembly exists, the asymmetric unit is shown. See symmetry for a more detailed description.

  :param what: the new name of the symmetry related copies to be displayed
  :return: the name of the symmetry related copy shown.

.. function:: BaseGeom.setOpacity(alpha)

  Set the opacity of the whole geometry to a constant value. See :ref:`pv.color.opacity` for details.

  :param alpha: The new opacity in the range between 0 and 1.
  :type alpha: floating point number

.. function:: BaseGeom.colorBy(colorOp)
              BaseGeom.colorBy(colorOp, view)

  Color the geometry by the given color operation. For a description of available color operations, see :doc:`coloring`.

  :param colorOp: The color operation to be applied to the structure.

  :param view: when specified, the color operation will only be applied to parts contained in the view. Other parts will be left untouched. When omitted, the color operation will be applied to the whole structure.

.. function:: BaseGeom.getColorForAtom(atom, color)

  Convenience function to obtain the current color of a given atom.

  :param atom: the atom for which to retrieve the color. Can be an :class:`~mol.AtomView`, 
      or :class:`~mol.Atom` instance, independent of whether the geometry was created
      with a :class:`~mol.Mol`, or :class:`~mol.MolView`
  :param color: array of length 4 into which the color is placed
  :returns: the array holding the color, or null if the atom is not part of the rendered geometry

.. function:: BaseGeom.eachCentralAtom(callback) 
  
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
