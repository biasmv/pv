The Viewer
================================================================================


The 3D molecules are managed and rendered by an instance of the viewer class. It serves as the main entry point for the protein viewer and is where most of the action happens. Before being able to use any of the render-related functions, a viewer must be constructed first. In the following, the full API of :class:`~pv.Viewer` is described. The methods are roughly categorized into the following sections:

 * :ref:`pv.viewer.init`
 * :ref:`pv.viewer.rendering`
 * :ref:`pv.viewer.management`


.. _pv.viewer.init:

Initialization and Configuration
--------------------------------------------------------------------------------

.. class:: pv.Viewer(parentElement[,options])

  Construct a new viewer, inserting it as the last child of parentElement. *options* is as dictionary that allows to control the initial settings for the viewer. Many of these settings can be changed later. The default options are chosen very restrictive on purpose. Valid options are:

  * *width* The width (in pixels) of the viewer. The special value 'auto' can be used to set the width to the width of the parent element. Defaults to 500.
  * *height* The height (in pixels) of the viewer. The special value 'auto' can be used to set the height to the height of the parent element. Defaults to 500.
  * *antialias*: whether full-scene antialiasing should be enabled. When available, antialiasing will use the built-in WebGL antialiasing. When not, it will fall back to a manual supersampling of the scene. Enabling antialiasing improve the visual results considerably, but also slows down rendering. When rendering speed is a concern, the *antialias* option should be set to false. Defaults to false.
  * *quality* the level of detail for the geometry. Accepted values are *low*, *medium*, and *high*. See :func:`~pv.Viewer.quality` for a description of these values. Defaults to *low*.


The following code defines a new viewer. This can be done during page load time, before the DOMContentLoaded event has been emitted. Render objects can only be added once the DOMContentLoaded event has fired. Typically it's best to put any object loading and display code into a DOMContentLoaded event handler.

.. code-block:: javascript

  // override the default options with something less restrictive.
  var options = {
    width: 600,
    height: 600,
    antialias: true,
    quality : 'medium'
  };
  // insert the viewer under the Dom element with id 'gl'.
  var viewer = pv.Viewer(document.getElementById('gl'), options);

.. function:: pv.Viewer.quality([value])

  Gets (or sets) the default level of detail for the render geometry. This property sets the default parameters for constructing render geometry, for example the number of arcs that are used for tubes, or the number of triangles for one sphere. Accepted values are

  * *low* The geometry uses as few triangles as possible. This is the fastest, but also visually least pleasing option. Use this option, when it can be assumed that very large molecules are to be rendered.

  * *medium* provides a good tradeoff between visual fidelity and render speed. This options should work best for typical proteins.

  * *high* render the scene with maximum detail.


.. _pv.viewer.rendering:

Rendering
--------------------------------------------------------------------------------

This section describes the high-level API for displaying molecular structures on screen. The interface consists of render methods part of :class:`~pv.Viewer` which accept a name and a structure and create a graphical representation out of it. For example, to create a cartoon representation, the following code will do:

.. code-block:: javascript

  // creates a cartoon representation with standard parameters
  var myCartoon = viewer.cartoon('molecule', myMolecule);


These methods will automatically add the object to the viewer, there is not need to call :func`pv.Viewer.add` on the object.


.. function:: pv.Viewer.lines(name, structure[, options])

  Renders the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) at full connectivity level, using lines for the bonds. Atoms with no bonds are represented as small crosses. Valid *options* are:

  * *color*: the color operation to be used. Defaults to :func:`color.byElement`.
  * *lineWidth*: The line width for bonds and atoms. Defaults to 4.0

  :returns: The geometry of the object. 

.. function:: pv.Viewer.spheres(name, structure[, options])

  Renders the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) at full-atom level using a sphere for each atom. Valid *options* are:

  * *color*: the color operation to be used. Defaults to :func:`color.byElement`.
  * *sphereDetail*: the number of horizontal and vertical arcs for the sphere. The default *sphereDetail* is determined by :func:`pv.Viewer.quality()`.


.. function:: pv.Viewer.lineTrace(name, structure[, options])

  Renders the protein part of the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) as a Carbon-alpha trace using lines. Consecutive carton alpha atoms are connected by a straight line. For a mesh-based version of the Carbon-alpha trace, see :func:`pv.Viewer.trace`.

  * *color*: the color operation to be used. Defaults to :func:`color.uniform`.
  * *lineWidth*: The line width for bonds and atoms. Defaults to 4.0

.. function:: pv.Viewer.sline(name, structure[, options])

  Renders the protein part of the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) as a smooth line trace. The Carbon-alpha atoms are used as the control points for a Catmull-Rom spline. For a mesh-based version of the smooth line trace, see :func:`pv.Viewer.tube`.

  * *color*: the color operation to be used. Defaults to :func:`color.uniform`.
  * *lineWidth*: The line width for bonds and atoms. Defaults to 4.0
  * *strength*: influences the magnitude of the tangents for the Catmull-Rom spline. Defaults to 0.5. Meaningful values are between 0 and 1.
  * *splineDetail*: Number of subdivision per Carbon alpha atom. The default value is is determined by :func:`pv.Viewer.quality`.

.. function:: pv.Viewer.trace(name, structure[, options])

  Renders the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) as a carbon-alpha trace. Consecutive Carbon alpha atoms (CA) are connected by a cylinder. For a line-based version of the trace render style, see :func:`pv.viewer.lineTrace`. Accepted *options* are:

  * *color*: the color operation to be used. Defaults to :func:`color.uniform`.
  * *radius*: Radius of the tube. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *sphereDetail* number of vertical and horizontal arcs for the spheres.




.. function:: pv.Viewer.tube(name, structure[, options])

  Renders the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) as a smoothly interpolated tube. 

  * *color*: the color operation to be used. Defaults to :func:`color.bySS`.
  * *radius*: Radius of the tube. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *strength*: influences the magnitude of the tangents for the Catmull-Rom spline. Defaults to 1.0. Meaningful values are between 0 and 1.
  * *splineDetail* number of subdivisions per Carbon-alpha atom. The default is termined by :func:`pv.Viewer.quality`.

.. function:: pv.Viewer.cartoon(name, structure[, options])

  Renders the structure (:class:`~mol.Mol`, or :class:`~mol.MolView`) as a 
  helix, strand coil cartoon. Accepted *options* are:

  * *color*: the color operation to be used. Defaults to :func:`color.bySS`.
  * *radius*: Radius of the tube profile. Also influences the profile thickness for helix and strand profiles. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *strength*: influences the magnitude of the tangents for the Catmull-Rom spline. Defaults to 1.0. Meaningful values are between 0 and 1.
  * *splineDetail* number of subdivisions per Carbon-alpha atom. The default is termined by :func:`pv.Viewer.quality`.



.. _pv.viewer.management:

Object Management
--------------------------------------------------------------------------------

Multiple render objects can be displayed at once. To be able to refer to these objects, all objects need to be assigned a name that uniquely identifies them. :class:`~pv.Viewer` offers methods to conveniently add, retrieve objects, or remove them from the viewer. 


.. function:: pv.Viewer.add(name, obj)

  Add a new object to the viewer. The object's name property will be set to name, under which it can be referenced in the future. Typically, there is no need to call add, since the objecs will be automatically added to the viewer when they are created.

  :returns: A reference to *obj*.

.. function:: pv.Viewer.get(name)

  Retrieve the reference to an object that has previously been added to the viewer. When an object matching the name could be found, it is returned. Otherwise, null is returned.

.. function:: pv.Viewer.hide(globPattern)
              pv.Viewer.show(globPattern)

  Hide/show objects matching glob pattern. The render geometry of hidden objects is retrained, but is not longer visible on the screen, nor are they available for object picking.

.. function:: pv.Viewer.rm(globPattern)

  Remove objects matching glob pattern from the viewer.

