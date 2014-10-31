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

Should I use it on my website?
----------------------------------------

I would love you to! Most features you would expect from a protein viewer are already present and working. Two considerations are important though:

 * WebGL is only supported in a subset of browsers. If you can afford to lose users of IE and older versions of browsers, `pv` is a good solution for protein visualisation.

 * DNA/RNA visualisation is not implemented yet, for protein-centric workflows that's fine though. In case you are interested in DNA/RNA rendering, just open a feature request and I'll try to get around to it.

Contributing
-----------------------------------------

Contributions of any kind (bugfixes, documentation, new features etc) are more than welcome. Just file bugs or file bug requests. Before submitting pull requests, please make sure to follow these [guide-lines](https://github.com/biasmv/pv/CONTRIBUTING.md).


Acknowledgements
----------------------------------------

PV uses the amazing [gl-matrix](https://github.com/toji/gl-matrix) JavaScript library for matrix and vector operations.


Thanks to @Traksewt and @kozmad for their contributions

Documentation
---------------------------------------

Documentation for pv is available [here](http://pv.readthedocs.org). 

Changelog
----------------------------------------

### New Since version 1.2

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

