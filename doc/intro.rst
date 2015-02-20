Getting started with PV
========================================================

Getting the PV source-code
--------------------------------------------------------

The simplest way to get PV into your website is by downloading one of the release tarballs from `github.com <https://github.com/biasmv/pv/releases>`_. The release tarballs contain the self-contained development and minified code for PV which can directly be integrated into your website.

Installing from git
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Alternatively, you can clone the github repository of PV. 

.. code-block:: bash

  git clone https://github.com/biasmv/pv
  cd pv

When you do this, you will need to compile the pv.dbg.js, pv.rel.js and pv.min.js files using `Grunt <http://gruntjs.com>`_. These are files containing all the code, with console statements (dbg), without console statements (rel) and minitified (min). Assuming you already have `NPM <https://npmjs.org/>`_ on your system, you can build the development and minified files by using the following commands:

.. code-block:: bash
 
  # setup dev environment for PV
  npm install --setup-dev
  # run grunt with the default tasks
  grunt

Upon success, bio-pv.js, bio-pv.min.js are placed in the ```js``` folder. You can just grab them from there and place them in your own project.


Setting up a small website
-----------------------------------------------------

The following minimal example shows how to include PV in a website for protein structure visualisation. For that purpose, we will create a small index.html file containing the bare-minimum required to run PV. The example does not depend on any external library. But of course it is also possible to combine PV with jQuery or other popular JS libraries.

In case you want to recreate the example, create a directory for the index.html file and change into that directory.

The index.html file
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The page is essentially a bare-bone HTML page which includes the pv.min.js file. In the preamble, we define a meta element to prevent page scrolling and load the PV library.

.. code-block:: html

  <html>
  <head>
    <title>Dengue Virus Methyl Transferase</title>
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  </head>
  <body>
  <div id=viewer></div>
  </body>
  <script type='text/javascript' src='pv.min.js'></script>


Now on to the interesting part. First, we :ref:`initialise the viewer <pv.viewer.init>` with custom settings. The width and height of the viewer are initialized to 600 pixels with antialising enabled and a medium detail level. These settings have been tested on a variety of devices and are known to work well for typical proteins.

.. code-block:: html

  <script type='text/javascript'>
  // override the default options with something less restrictive.
  var options = {
    width: 600,
    height: 600,
    antialias: true,
    quality : 'medium'
  };
  // insert the viewer under the Dom element with id 'gl'.
  var viewer = pv.Viewer(document.getElementById('viewer'), options);
  </script>


Most of the work happens in loadMethylTransferase. This function will be called when the DOMContentLoaded event fires and we will use it to populate the WebGL viewer with a nice protein structure.

.. code-block:: html

  <script type='text/javascript'>

  function loadMethylTransferase() {
    // asynchronously load the PDB file for the dengue methyl transferase
    // from the server and display it in the viewer.
    pv.io.fetchPdb('1r6a.pdb', function(structure) {
        // display the protein as cartoon, coloring the secondary structure 
        // elements in a rainbow gradient.
        viewer.cartoon('protein', structure, { color : color.ssSuccession() });
        // there are two ligands in the structure, the co-factor S-adenosyl 
        // homocysteine and the inhibitor ribavirin-5' triphosphate. They have 
        // the three-letter codes SAH and RVP, respectively. Let's display them 
        // with balls and sticks.
        var ligands = structure.select({ rnames : ['SAH', 'RVP'] });
        viewer.ballsAndSticks('ligands', ligands);
        viewer.centerOn(structure);
    });
  }

  // load the methyl transferase once the DOM has finished loading. That's
  // the earliest point the WebGL context is available.
  document.addEventListener('DOMContentLoaded', loadMethylTransferase);
  </script>

Running the Example
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Before running the example, we have to make sure that the pv.min.js file and the PDB file for the methyl transferase are in the right location. The easiest is to copy the pv.min.js file from the release tarball and fetch the PDB file for 1r6a from the `PDB website <http://pdb.org>`_. Then serve the files using Python's SimpleHTTPServer:


.. code-block:: python

  python -m SimpleHTTPServer

And visit the localhost:8000 with a WebGL-enabled browser.
