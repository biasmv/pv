pv - WebGL protein viewer
=========================================

pv  is a WebGL-based protein viewer whose goal is to once-for-all end the reign of Java applets on websites that require visualisation of protein structures. It's not you Java, it's all the annoying security popups and slow loading times. pv implements all major render modes that you would expect, and supports custom color schemes. 

Because there is nothing worse than a unresponsive website, pv has been implemented with maximum performane in mind. Even very large macromolecules can be visualised at interactive framerates.


Trying it out
-----------------------------------------

You can try the [online demo](http://biasmv.github.io/pv/demo.html) or run it locally on your computer.

Clone this repository

```bash
git clone https://github.com/biasmv/pv.git
```

Change to the pv directory and serve the files using the serve script in the source directory. This will start a simple static-file server using Python's SimpleHTTPServer module.

```bash
cd pv
./serve 
```

Open a WebGL-enabled web browser and visit http://localhost:8000

Want to use PV on your website?
----------------------------------------

I would love you to! Most features you would expect from a protein viewer are already present and working. One considerations is important though:

 * WebGL is only supported in a subset of browsers. If you can afford to lose users of IE and older versions of browsers, `pv` is a good solution for protein visualisation.

Citing PV?
----------------------------------------

I'm planning on writing a small application note, but in the mean time, use the following DOI for citing PV in your work.

[![DOI](https://zenodo.org/badge/7050/biasmv/pv.png)](http://dx.doi.org/10.5281/zenodo.12620)



Contributing
-----------------------------------------

Contributions of any kind (bugfixes, documentation, new features etc) are more than welcome. Just file bugs or file bug requests. Before submitting pull requests, please make sure to follow these [guide-lines](https://github.com/biasmv/pv/blob/master/CONTRIBUTE.md).


Acknowledgements
----------------------------------------

PV uses the amazing [gl-matrix](https://github.com/toji/gl-matrix) JavaScript library for matrix and vector operations.


Thanks to @Traksewt, @kozmad, @greenify for their contributions

Documentation
---------------------------------------

Documentation for pv is available [here](http://pv.readthedocs.org). 

Changelog
----------------------------------------

# New in Version 1.8.1

- A few additional improvements to outline rendering quality
- Made a few tweaks to documentation

# New in Version 1.8.0

- Implement screen-door transparency as an alternative to alpha-based transparency. To enable screen-door transparency, pass transparency : 'screendoor' when constructing the viewer.
- Added special selection highlighting render mode.
- Improve handling of click event by only firing click events when the mouse button is pressed/released within a short timespan.
- Improve rendering of outline by properly scaling the extrusion factor based on the size of the GL canvas.
- Added more sample code to documentation

# New in Version 1.7.2

- Made a few changes to the samples contained in the docs that don't work for some people. There is no functionality change on the code-level, that's why there is no 1.7.2 release.

# New in Version 1.7.1

- Added bower.json to release package so people can install PV using bower. This only works for release packages, but not the git repository itself.

### New in Version 1.7.0

- PDB import: Improved code to guess element from atom name. This fixes issues in correctly detecting hydrogen atoms for some cases.
- Add support for click events on custom meshes
- Deprecated atomDoubleClick/atomClick events in favor of click/doubleClicked to make it clearer that the target of the click event might be objects other than atoms. 
- Simplified the picking results object. The picking results now provides the position of the clicked object as the ```pos()``` property. It is no longer required to transform the atom position by the symmetry transformation matrix when displaying biological units.
- Support for loading multi-model pdb files.
- Added functionality to superpose two structures using least-square fitting

### New in Version 1.6.0

- Added option to set field of view (FOV)
- Added "points" rendering mode in which every atom is rendered as a point. This is useful for rendering point clouds.
- Get BioJS snippets working again (@greenify)

### New in Version 1.5.0

- Added Viewer.spin command to spin the camera around an axis
- Relax some limits on number of elements that could be rendered at full connectivity level. Now it would theoretically be possible to render 2^24 atoms, even though the amount of geometry is likely to take down the browser.
- Fix rendering for very long RNA molecules that broke some assumptions in the cartoon rendering code (1J5E, for example see issue [#82](https://github.com/biasmv/pv/issues/82)).
- Improve heuristics to determine whether two residues belong to the same trace by not introducing trace breaks in case the residues are connected by a bond. This allows users to manually set bonds in case they have other means of knowing that two residues are to part of the same trace ([#83](https://github.com/biasmv/pv/issues/83)).

### New in Version 1.4.0

- Basic support RNA/DNA rendering for all render modes
- Multi-touch support for iOS and Android (with contributions by @kozmad, @lordvlad)
- improved visual clarity of text labels
- use correct line width when manual anti-aliasing is enabled.
- text labels can now be styled (color, font-family, font-weight, size)
- reduced file size of minified JavaScript file by a little more than 10%
- ability to add geometric shapes to the 3D scene through customMesh
- ability to specify custom color palettes (@andreasprlic)
- viewerReady event (@andreasprlic)
- PV can optionally be used as an AMD module without polluting the global namespace
- added more unit and functional tests. The tests reach a coverage of 80% of the total number of exectuable lines of code.
- support for loading small molecules from SDF files

### New in Version 1.3.1

- fix bug in strand smoothing which would cause residues at the beginning of the trace to get collapsed.
- rendering: check for null slab object to allow drawing to work when no objects are visible.

### New in Version 1.3

- publish it as an npm module
- PDB IO: parse insertion codes
- add method to retrieve current color of atom. This is useful for highlighting purposes, where the color of certain atoms is temporarily changed and then reverted back to the original.
- smoothing of strands when rendering as helix, strand, coil cartoon
- implement proper strand "arrows"
- improved auto-slabbing when the rendered objects are off-center

### New in Version 1.2

- add transparancy support to mesh and line geoms (@kozmad)
- substantial speed improvements through implementation of buffer pool for typed arrays.
- method to assign secondary structure based on carbon-alpha positions
- improved documentation
- improve dictionary selection
- support for adding text labels to the 3D scene
- autoZoom to fit structure into viewport
- work around uint16 buffer limit of WebGL by automatically splitting the geometry of large molecules into multiple buffers
- support for different color notations, e.g. hex, color names.
- support for displaying molecular assemblies, including support for picking of symmetry-related copies
- implement different slab-modes
- rudimentary support for rendering MSMS surfaces in the browser. Requires conversion to binary format first.
- adding customisable animation time (@Traksewt)
- add customizable atom picking events (double and single click) (@Traksewt)
- improved animation support (@Traksewt)
- customizable background color (@Traksewt)

