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

Change to the pv directory and serve the files using the serve command. It's a small wrapper around the SimpleHTTPServer module which also sets the Access-Control-Allow-Origin header to allow requests to pdb.org. This is required for the demo to work properly.

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

### New Since latest Release

- Basic support RNA/DNA rendering for all render modes
- Multi-touch support for iOS and Android (with contributions by @kozmad, @lordvlad)

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

