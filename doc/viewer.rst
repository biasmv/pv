The Viewer
================================================================================


The 3D molecules are managed and rendered by an instance of the viewer class. It serves as the main entry point for the protein viewer and is where most of the action happens. In the following, the full API of :class:`~pv.Viewer` is described. The methods are roughly categorized into the following sections:

 * :ref:`pv.viewer.init`
 * :ref:`pv.viewer.rendering`
 * :ref:`pv.viewer.camera`
 * :ref:`pv.viewer.events`
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
  * *slabMode* sets the default slab mode for the viewer. See :func:`~pv.Viewer.slabMode` for possible values. Defaults to 'auto'.
  * *background* set the default background color of the viewer. Defaults to 'white'. See :ref:`pv.color.notation`
  * *atomDoubleClick* set the event handler for an atom double clicked event. When the parameter is a function it is added as a new 'atomDoubleClicked' event handler. See :func:`~pv.Viewer.addListener` for details. If it is set to the special value 'center', an event listener is installed that centers the viewer on the double clicked atom, residue. The default is 'center'.
  * *atomClicked* set the event handler for an atom double clicked event (see *atomDoubleClick*). The default is null (no listener).
  * *animateTime* controls the default animation duration in milliseconds. By default, the animation is set to 0 (no animation). By setting it to higher values, rotation, zoom and shift are animated. Note that enabling this can have negative impact on performance, especially with large molecules and on low-end devices.
  * *fog* whether depth-cue ('fog') should be enabled. By default, fog is enabled. Pass false to disable fog.


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


These methods will automatically add the object to the viewer, there is not need to call :func:`pv.Viewer.add` on the object.


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

.. function:: pv.Viewer.label(name, text, pos)

  Places a label with *text* at the given position. At the moment, there is no way to control the size and color of the text.

  :param name: Uniquely identifies the label
  :param text: The text to be shown
  :param pos: A :class:`vec3`, or array of length 3 holding the x, y, and z coordinate of the label's center.
  :returns: the created label. 

.. _pv.viewer.camera:

Camera Positioning/Orientation
---------------------------------------------------------------------------------

.. function:: pv.Viewer.centerOn(obj)

  Center the camera on a given object, leaving the zoom level and orientation untouched.

  :param obj: Must be an object implementing a *center* method returning the center of the object, e.g. an instance of :class:`mol.MolView`, :class:`mol.Mol`

  
.. function:: pv.Viewer.autoZoom()

  Adjusts the zoom level such that all objects are visible on screen and occupy as much space as possible. The center and orientation of the camera are not modified.  
.. function:: pv.Viewer.fitTo(obj)

  Adjust the zoom level and center of the camera to fit the viewport to a given object. The method supports fitting to selections, or arbitrary SceneNodes. To fit to a subset of atoms, pass the selection as the *obj* argument:

  .. code-block:: javascript

    viewer.fitTo(structure.select({rname : 'RVP'});
  
  To fit to an entire render objects, pass the object as the *obj* argument:

  .. code-block:: javascript

    var obj = viewer.cartoon('obj', structure);
    viewer.fitTo(obj);

  :param what: must be an object which implements updateProjectionInterval, e.g. a SceneNode, a :class:`mol.MolView`, or :class:`mol.Mol`.

.. function:: pv.Viewer.setCamera(rotation, center, zoom, ms)

  Function to directly set the rotation, center and zoom of the camera. 


  The combined transformation matrix for the camera is calculated as follows: First the origin is shifted to the center, then the rotation is applied, and lastly the camera is translated away from the center by the negative zoom along the rotated Z-axis.

  :param rotation: Either a 4x4 or 3x3 matrix, e.g. as returned by :func:`mat4.create` or :func:`mat3.create` that contains the rotation.
  :param center: the new camera center.
  :param zoom: distance of the eye position from the viewing center
  :param ms: if provided and non-zero defines the animation time for moving/rotating/zooming the camera from the current position to the new rotation,center and zoom.

.. function:: pv.setCenter(center, ms)

  Convenience function to set the camera center.
  
  :param center: the new camera center.
  :param ms: if provided and non-zero defines the animation time for moving the camera from the current position to the new center.

.. function:: pv.setRotation(rotation, ms)

  Convenience function to set the camera rotation.
  
  :param rotation: Either a 4x4 or 3x3 matrix, e.g. as returned by :func:`mat4.create` or :func:`mat3.create` that contains the rotation.
  :param ms: if provided and non-zero defines the animation time for moving the camera from the current position to the new center.

.. function:: pv.computeEntropy(rotation)

  Computes the viewpoint-entropy of the view after applying a rotation.
  The viewpoint-entropy is a measure for the amount of information shown by a view, based on the number of visible pixels
  for each object. High viewpoint-entropies result in more information shown.
  A typical use case of this function is to sample a number of camera positions, evaluate the entropy, and chose the
  maximum for the final view.
  
  :param rotation: Either a 4x4 or 3x3 matrix, e.g. as returned by :func:`mat4.create` or :func:`mat3.create` that contains the rotation.

Fog and Slab Modes
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Proteins come in all sizes and shapes. For optimal viewing, some camera parameters must thus be adjusted for each molecule. Two of these parameters are the near and far clipping planes of the camera. Only geometry between the near and far clipping plane are visible on the screen. Geometry in front of the near and at the back of the far clipping planes are clipped away. Typically, the near and far clipping planes must be set such that contain all visible geometry in front of the camera. However, sometimes it is desired to only show a certain 'slab' of the molecule. To support both of these scenarios, PV has multiple modes, called slab modes.


.. function:: pv.Viewer.slabMode(mode[,options)

  Sets the current active slab mode of the viewer. *mode* must be one of 'fixed' or 'auto'.

  * When slab mode is set to 'auto', the near and far clipping planes as well as fog are adjusted based on the visible geometry. This causes the clipping planes to be updated on every rotation of the camera, change of camera's viewing center and when objects are added/removed.

  * When the slab mode is set to 'fixed', automatic adjustment of the near and far clipping planes as well as fog is turned off. The values are kept constant and can be set by the user. To set specific near and far clipping planes provide them in a dictionary as the option argument when calling slabMode:

    .. code-block:: javascript

      viewer.slabMode('fixed', { near: 1, far : 100 });




.. _pv.viewer.events:

Viewer Events
---------------------------------------------------------------------------------
Mouse selection events are fired when the user clicks or double clicks a residue/atom. 

.. function:: pv.Viewer.addListener(type, callback)

  Add a new listener for *atomClicked* or *atomDoubleClicked* events.

  :param type: The type of event to listen to. Must be either 'atomClicked' or 'atomDoubleClicked' 
  :param callback: The function to receive the callback. If the special value 'center' is passed to the callback, a event handler is installed that centers the viewer on the clicked atom/residue. 

  The arguments of the callback function are *picked*, and *originalEvent* which is the original mouse event. Picked contains information about the scene nodes that was clicked/doubleClicked as well as the actual clicked atom. It also contains a transformation matrix, that if set needs to be applied to the atom's position to get the correct position in global coordinates. This is illustrated in the second example below.

The following code simply logs the clicked residue to the console when an atom is clicked.

.. code-block:: javascript

  viewer.addListener("atomClicked", function(picked, originalEvent) {

    if (picked) {
      var newAtom = picked.object().atom;
      var geom = picked.object().geom;
      
      console.log(" Residue number=" + newAtom.residue().num());
    }
  });

The following code shows how to listen for double click events to either make the selection the focal point and center of zoom, or zoom out to the whole structure if the background is double clicked.

.. code-block:: javascript

  var structure = .... // point to what you want the default background selection to view
  viewer.addListener("atomDoubleClicked", function(picked, originalEvent) {
    if (picked === null) {
      viewer.fitTo(structure);
      return;
    }
    var transformedPos = vec3.create();
    var newAtom = picked.object().atom;
    var pos = newAtom.pos();
    if (picked.transform()) {
        vec3.transformMat4(transformedPos, pos, picked.transform());
      viewer.setCenter(transformedPos, 500);
    } else {
      viewer.setCenter(pos, 500);
    }
  });


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

