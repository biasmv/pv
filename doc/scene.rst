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







