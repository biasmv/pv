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
  * *antialias*: whether full-scene antialiasing should be enabled. When available, antialiasing will use the built-in WebGL antialiasing. When not, it will fall back to a manual supersampling of the scene. Manual antialiasing can be disabled by setting the *forceManualAntialiasing* option to false. Enabling antialiasing improve the visual results considerably, but also slows down rendering. When rendering speed is a concern, the *antialias* option should be set to false. Defaults to false.
  * *forceManualAntialiasing*: whether manual antialiasing should be enabled. Manual antialiasing is used when the WebGL context does not support antialiasing. Set this option to false to disable the fallback behavior and only enable antialising when the WebGL context supports it. Defaults to true. 
  * *quality* the level of detail for the geometry. Accepted values are *low*, *medium*, and *high*. See :func:`~pv.Viewer.quality` for a description of these values. Defaults to *low*.
  * *slabMode* sets the default slab mode for the viewer. See :func:`~pv.Viewer.slabMode` for possible values. Defaults to 'auto'.
  * *background* set the default background color of the viewer. Defaults to 'white'. See :ref:`pv.color.notation`
  * *doubleClick* set the event handler for an atom double click/touch event. When the parameter is a function it is added as a new 'doubleClick' event handler. See :func:`~pv.Viewer.addListener` for details. If it is set to the special value 'center', an event listener is installed that centers the viewer on the double clicked atom, residue. The default is 'center'.
  * *click* set the event handler for an atom click/touch event (see *doubleClick*). The default is null (no listener).
  * *animateTime* controls the default animation duration in milliseconds. By default, the animation is set to 0 (no animation). By setting it to higher values, rotation, zoom and shift are animated. Note that enabling this can have negative impact on performance, especially with large molecules and on low-end devices.
  * *fog* whether depth-cue ('fog') should be enabled. By default, fog is enabled. Pass false to disable fog.
  * *fov* the field of view in degrees. Default is 45 degrees.
  * *outline* whether outline rendering should be enabled. When enabled, outline rendering draws a uniformly colored outline around the mesh geometries to improve contrast. By default outline rendering is enabled.
  * *outlineColor* the color of the outline. Default is black. When outline rendering is disabled, setting this value has no effect.
  * *outlineWidth* the width of the outline in pixels. Default is 1.5. When outline rendering is disabled, setting this value has no effect.


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

  viewer.on('viewerReady', function() {
    // add structure here
  });

.. function:: pv.Viewer.quality([value])

  Gets (or sets) the default level of detail for the render geometry. This property sets the default parameters for constructing render geometry, for example the number of arcs that are used for tubes, or the number of triangles for one sphere. Accepted values are

  * *low* The geometry uses as few triangles as possible. This is the fastest, but also visually least pleasing option. Use this option, when it can be assumed that very large molecules are to be rendered.

  * *medium* provides a good tradeoff between visual fidelity and render speed. This options should work best for typical proteins.

  * *high* render the scene with maximum detail.

  Changes to the quality only affect newly created objects/geometries. Already existing objects/geometries are not affected.


.. _pv.viewer.rendering:

Rendering
--------------------------------------------------------------------------------

This section describes the high-level API for displaying molecular structures on screen. The interface consists of render methods part of :class:`~pv.Viewer` which accept a name and a structure and create a graphical representation out of it. For example, to create a cartoon representation, the following code will do:

.. code-block:: javascript

  // creates a cartoon representation with standard parameters
  var myCartoon = viewer.cartoon('molecule', myMolecule);


These methods will automatically add the object to the viewer, there is not need to call :func:`pv.Viewer.add` on the object.


.. function:: pv.Viewer.lines(name, structure[, options])

  Renders the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) at full connectivity level, using lines for the bonds. Atoms with no bonds are represented as small crosses. Valid *options* are:

  * *color*: the color operation to be used. Defaults to :func:`pv.color.byElement`.
  * *lineWidth*: The line width for bonds and atoms. Defaults to 4.0

  :returns: The geometry of the object. 

.. function:: pv.Viewer.points(name, structure[, options])

  Renders the atoms of a structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a point cloud. Valid *options* are:

  * *color*: the color operation to be used. Defaults to :func:`pv.color.byElement`.
  * *pointSize* relative point size of the points to be rendered. Defaults to 1.0

  :returns: The geometry of the object. 


.. function:: pv.Viewer.spheres(name, structure[, options])

  Renders the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) at full-atom level using a sphere for each atom. Valid *options* are:

  * *color*: the color operation to be used. Defaults to :func:`pv.color.byElement`.
  * *sphereDetail*: the number of horizontal and vertical arcs for the sphere. The default *sphereDetail* is determined by :func:`pv.Viewer.quality()`.


.. function:: pv.Viewer.lineTrace(name, structure[, options])

  Renders the protein part of the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a Carbon-alpha trace using lines. Consecutive carton alpha atoms are connected by a straight line. For a mesh-based version of the Carbon-alpha trace, see :func:`pv.Viewer.trace`.

  * *color*: the color operation to be used. Defaults to :func:`~pv.color.uniform`.
  * *lineWidth*: The line width for bonds and atoms. Defaults to 4.0

.. function:: pv.Viewer.sline(name, structure[, options])

  Renders the protein part of the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a smooth line trace. The Carbon-alpha atoms are used as the control points for a Catmull-Rom spline. For a mesh-based version of the smooth line trace, see :func:`pv.Viewer.tube`.

  * *color*: the color operation to be used. Defaults to :func:`~pv.color.uniform`.
  * *lineWidth*: The line width for bonds and atoms. Defaults to 4.0
  * *strength*: influences the magnitude of the tangents for the Catmull-Rom spline. Defaults to 0.5. Meaningful values are between 0 and 1.
  * *splineDetail*: Number of subdivision per Carbon alpha atom. The default value is is determined by :func:`pv.Viewer.quality`.

.. function:: pv.Viewer.trace(name, structure[, options])

  Renders the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a carbon-alpha trace. Consecutive Carbon alpha atoms (CA) are connected by a cylinder. For a line-based version of the trace render style, see :func:`pv.Viewer.lineTrace`. Accepted *options* are:

  * *color*: the color operation to be used. Defaults to :func:`~pv.color.uniform`.
  * *radius*: Radius of the tube. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *sphereDetail* number of vertical and horizontal arcs for the spheres.




.. function:: pv.Viewer.tube(name, structure[, options])

  Renders the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a smoothly interpolated tube. 

  * *color*: the color operation to be used. Defaults to :func:`pv.color.bySS`.
  * *radius*: Radius of the tube. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *strength*: influences the magnitude of the tangents for the Catmull-Rom spline. Defaults to 1.0. Meaningful values are between 0 and 1.
  * *splineDetail* number of subdivisions per Carbon-alpha atom. The default is termined by :func:`pv.Viewer.quality`.

.. function:: pv.Viewer.cartoon(name, structure[, options])

  Renders the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a 
  helix, strand coil cartoon. Accepted *options* are:

  * *color*: the color operation to be used. Defaults to :func:`pv.color.bySS`.
  * *radius*: Radius of the tube profile. Also influences the profile thickness for helix and strand profiles. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *strength*: influences the magnitude of the tangents for the Catmull-Rom spline. Defaults to 1.0. Meaningful values are between 0 and 1.
  * *splineDetail* number of subdivisions per Carbon-alpha atom. The default is termined by :func:`pv.Viewer.quality`.

.. function:: pv.Viewer.ballsAndSticks(name, structure[,options])

  Renders the structure (:class:`~pv.mol.Mol`, or :class:`~pv.mol.MolView`) as a 
  ball and stick model. Accepted *options* are:

  * *color*: the color operation to be used. Defaults to :func:`pv.color.byElement`.
  * *cylRadius*: Radius of the tube profile. Defaults to 0.1.
  * *sphereRadius*: Radius of the sphere profile. Defaults to 0.3.
  * *arcDetail*: number of vertices on the tube. The default is determined by :func:`pv.Viewer.quality`.
  * *sphereDetail* number of vertical and horizontal arcs for the spheres.
  * *scaleByAtomRadius* Whether to scale spheres by atom's van der Waals radius. Defaults to true.

.. function:: pv.Viewer.renderAs(name, structure, mode[,options])

  Function to render the structure in any of the supported render styles. This essentially makes it possible to write code that is independent of the particular chosen render style.

  :param mode: One of 'sline', 'lines', 'trace', 'lineTrace', 'cartoon', 'tube', 'spheres', ballsAndSticks'
  :param options: options dictionary passed to the chosen render mode. Refer to the documentation for the specific mode for a list of supported options.
  :returns: The created geometry object.


.. function:: pv.Viewer.label(name, text, pos[, options])

  Places a label with *text* at the given position in the scene

  :param name: Uniquely identifies the label
  :param text: The text to be shown
  :param pos: An array of length 3 holding the x, y, and z coordinate of the label's center.
  :param options: Optional dictionary to control the font, text style and size of the label (see below)

  Accepted *options* are:

  * *font*: name of the font. Accepted values are all HTML/CSS font families. Default is 'Verdana'.
  * *fontSize*: the size of the font in pixels. Default is 24.
  * *fontColor*: the CSS color to be used for rendering the text. Default is black.
  * *fontStyle* the font style. Can by any combination of 'italic', 'bold'. Default is 'normal'. 

  :returns: the created label. 

.. function:: pv.Viewer.customMesh(name)

  Creates a new object to hold user-defined collection of geometric shapes. For details on how to add shapes, see :ref:`pv.scene.geometric-shapes`

  :param name: uniquely identifies the custom mesh.

  :returns: A new :class:`pv.CustomMesh` instance.

.. _pv.viewer.camera:

Camera Positioning/Orientation
---------------------------------------------------------------------------------

.. function:: pv.Viewer.setCamera(rotation, center, zoom[, ms])

  Function to directly set the rotation, center and zoom of the camera. 


  The combined transformation matrix for the camera is calculated as follows: First the origin is shifted to the center, then the rotation is applied, and lastly the camera is translated away from the center by the negative zoom along the rotated Z-axis.

  :param rotation: Either a 4x4 or 3x3 matrix in the form of a one-dimensional array of length 16 or 9. It is up to the caller to ensure the matrix is a valid rotation matrix.
  :param center: the new camera center.
  :param zoom: distance of the eye position from the viewing center
  :param ms: if provided and non-zero defines the animation time for moving/rotating/zooming the camera from the current position to the new rotation,center and zoom. If zero, the rotation/center and zoom factors are directly set to the desired values. The default is zero.


.. function:: pv.Viewer.setRotation(rotation[, ms])

  Function to directly set the rotation of the camera. This is identical to calling :class:`~pv.Viewer.setCamera` with the current center and zoom values.

  :param rotation: Either a  4x4 or 3x3 matrix in the form of a one-dimensional array of length 16 or 9. It is up to the caller to make sure the matrix is a rotation matrix.
  :param ms: if provided and non-zero defines the animation time rotating the camera from the current rotation to the target rotation. If zero, the rotation is immediately set to the target rotation. The default is zero.

.. function:: pv.Viewer.setCenter(center[, ms])

  Function to directly set the center of view of the camera. This is identical to calling :class:`~pv.Viewer.setCamera` with the current rotation and zoom values.

  :param center: The new center of view of the "center". 
  :param ms: if provided and non-zero defines the time in which the camera center moves from the current center the target center. If zero, the center is immediately set to the target center. The default is zero.


.. function:: pv.Viewer.setZoom(zoom[, ms])

  Function to directly set the zoom factor of the camera. This is identical to calling :class:`~pv.Viewer.setCamera` with the current rotation and center values.

  :param zoom: The distance of the camera from the "center". Only positive values are allowed.
  :param ms: if provided and non-zero defines the time in which the camera zoom level moves from thecurrent zoom level to the target zoom. If zero, the zoom is immediately set to the target zoom. The default is zero.

.. function:: pv.Viewer.centerOn(obj)

  Center the camera on a given object, leaving the zoom level and orientation untouched.

  :param obj: Must be an object implementing a *center* method returning the center of the object, e.g. an instance of :class:`pv.mol.MolView`, :class:`pv.mol.Mol`

  
.. function:: pv.Viewer.autoZoom([ms])

  Adjusts the zoom level such that all objects are visible on screen and occupy as much space as possible. The center and orientation of the camera are not modified.  
  
  :param ms: if provided and non-zero defines the time in which the camera zoom level moves from the current zoom level to the target zoom. If zero, the zoom is immediately set to the target zoom. If no value is provided it use the default animation time of the viewer.

.. function:: pv.Viewer.fitTo(obj [, ms])

  Adjust the zoom level and center of the camera to fit the viewport to a given object. The method supports fitting to selections, or arbitrary SceneNodes. To fit to a subset of atoms, pass the selection as the *obj* argument:

  :param ms: if provided and non-zero defines the time in which the camera zoom level moves from the current zoom level to the target zoom. If zero, the zoom is immediately set to the target zoom. If no value is provided it will use the default animation time of the viewer.

  .. code-block:: javascript

    viewer.fitTo(structure.select({rname : 'RVP'});
  
  To fit to an entire render objects, pass the object as the *obj* argument:

  .. code-block:: javascript

    var obj = viewer.cartoon('obj', structure);
    viewer.fitTo(obj);

  :param what: must be an object which implements updateProjectionInterval, e.g. a SceneNode, a :class:`pv.mol.MolView`, or :class:`pv.mol.Mol`.


.. function:: pv.Viewer.translate(vector, ms)

  Translate the viewer center.

  :param vector: The 3-dimensional vector to translate by. The vector is in screen coordinates, e.g. the vector [1,0,0] is aligned to the X-axis as currently seen on screen.
  :param ms: When provided, the translation is animated from the current to the target position. When omitted (or 0) the camera is immediately set to the target position. 


.. function:: pv.Viewer.rotate(axis, angle, ms)

  Rotate the viewer around an axis by a certain amount.

  :param axis: 3-dimensional axis to rotate around. The axes are in the screen coordinate system, meaning the X- and Y-axes are aligned to the screen's X and Y axes and the Z axis points towards the camera's eye position. The default rotation axis is [0,1,0]. The axis must be normalized.

  :param angle: the rotation angle in radians. When positive, the rotation is in counter-clockwise direction, when negative, the rotation is in clockwise-direction. The rotation angle is always used modulo 2π.

  :param ms: When provided, the rotation is animated from the current to the target rotation. When omitted (or 0) the camera is immediately rotation to the target rotation. 

.. function:: pv.Viewer.spin(enable)
              pv.Viewer.spin(speed[, axis])

    Enable/disable spinning of the viewer around a screen axis.

    The first signature enables/disables spinning with default parameters, the second allows to control the speed as well as the axis to rotate around.

    :param enable: whether spinning should be enabled. When false, spinning is disabled. When true, spinning is enabled around the y axis with a default speed of Math.PI/8, meaning a full rotation takes 16 seconds.
    :param axis: 3 dimensional axis to rotate around. The axes are in the screen coordinate system, meaning the X- and Y-axes are aligned to the screen's X and Y axes and the Z axis points towards the camera's eye position. The default rotation axis is [0,1,0]. The axis must be normalized.

    :param speed: The number of radians per second to rotate. When positive, rotation is in counter-clockwise direction, when negative rotation is in clockwise direction.

    :return: true when spinning is enabled, false if not.

.. function:: pv.Viewer.requestRedraw()

  Request a redraw of the viewer, e.g. to refresh the content visible on the screen. Most of the time, you will not have to call this function directly. However, if you notice that a certain change is not taking effect, try adding requestRedraw().


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

Custom viewer event handlers can be registered by calling :func:`pv.Viewer.addListener`. These callbacks have the following form.

.. function:: pv.Viewer.addListener(type, callback)
              pv.Viewer.on(type, callback)

  :param type: The type of event to listen to. Must be either 'atomClicked', 'atomDoubleClicked', 'viewerReady', 'keypress', 'keydown', 'keyup', 'mousemove', 'mousedown', 'mouseup', or 'viewpointChanged'.

  When an event fires, callbacks registered for that event type are invoked with type-specific arguments. See documentation for the individual events for more details


.. _pv.viewer.events.init:

Initialization Event (viewerReady)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Invoked when the viewer is completely initialized and is ready for displaying of structures. It's recommended to put calls to any of the :ref:`geometry-creating funtions<pv.viewer.rendering>` into a viewerReady callback as they expect a completely constructed viewer. It's however possible to start loading the structure data before 'viewerReady', as long as they are not added to the viewer.

Callbacks receive the initialized viewer as the first argument. 

When the 'viewerReady' callback is registered *after* the page has finished loading, the event callback is directly invoked from :func:`addListener/on<pv.Viewer.addListener>`.

The following code example shows how to add a yellow sphere to the center of the scene:

.. code-block:: javascript
  
  // insert the viewer under the Dom element with id 'gl'.
  var viewer = pv.Viewer(document.getElementById('gl'), options);

  viewer.on('viewerReady', function(viewer) {
    var customMesh = viewer.customMesh('yellowSphere');
    customMesh.addSphere([0,0,0], 5, { color : 'yellow' });
  });


.. _pv.viewer.events.mouse:

Mouse Interaction Events (click, doubleClick)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Mouse selection events are fired when the user clicks or double clicks on the viewer. 

The arguments of the callback function are *picked*, and *originalEvent* which is the original mouse event. Picked contains information about the scene nodes that was clicked/doubleClicked as well as target of the event. For representations of molecules, the target is always an atom, for custom meshes target is set to the user-specified data stored in the mesh when calling :func:`~pv.CustomMesh.addTube`, or :func:`~pv.CustomMesh.addSphere`. When no object was under the cursor, picked is null.

It also contains a transformation matrix, that if set needs to be applied to the atom's position to get the correct position in global coordinates. This is illustrated in the second example below.

The following code simply logs the clicked atom to the console when an atom is clicked and does nothing otherwise.

.. code-block:: javascript

  viewer.addListener('click', function(picked) {
    if (picked === null) return;
    var target = picked.target();
    if (target.qualifiedName !== undefined) {
      console.log('clicked atom', target.qualifiedName(), 'on object',
                  picked.node().name());
    }
  });

The following code shows how to listen for double click events to either make the selection the focal point and center of zoom, or zoom out to the whole structure if the background is double clicked.

.. code-block:: javascript

  var structure = .... // point to what you want the default background selection to view
  viewer.on('doubleClick', function(picked) {
    if (picked === null) {
      viewer.fitTo(structure);
      return;
    }
    viewer.setCenter(picked.pos(), 500);
  });



Camera Position/Rotation/Zoom Changed Event (experimental)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The *viewpointChanged* event is fired whenever the camera orientation/center or zoom changes. The callback is invoked with the camera object as the first argument. As an example, the following code shows how to synchronize the orientation of two viewers. Whenever the orientation of one of them changes, the other is updated as well:

.. code-block:: javascript

  viewer1.on('viewpointChanged', function(cam) {
    viewer2.setCenter(cam.center());
    viewer2.setCamera(cam.rotation(), cam.center(), cam.zoom());
  });
  viewer2.on('viewpointChanged', function(cam) {
    viewer1.setCenter(cam.center());
    viewer1.setCamera(cam.rotation(), cam.center(), cam.zoom());
  });

This is an experimental feature and might change in future releases.

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

.. function:: pv.Viewer.clear()

  Remove all objects from the viewer. In case you are calling this function, but are not adding new content after that, you will need to call :func:`~pv.Viewer.requestRedraw` to update the content of the screen.

