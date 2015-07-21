Getting started with PV
========================================================

Getting the PV source-code
--------------------------------------------------------

The simplest way to get PV into your website is by downloading one of the release tarballs from `github.com <https://github.com/biasmv/pv/releases>`_. The release tarballs contain the self-contained development and minified code for PV which can directly be integrated into your website.


Installing with bower
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To install PV with bower, change to your project directory and type the following:

.. code-block:: bash

  bower install bio-pv

.. note::

  Bower support has only been added to versions 1.8 and newer, so it won't be possible to use this method of installation for older versions.



Installing from git
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Alternatively, you can clone the github repository of PV. This approach is only recommended if you are planning to make changes to PV itself. Otherwise it's simpler to either download one of the release tarballs or install through bower.

.. code-block:: bash

  git clone https://github.com/biasmv/pv
  cd pv

The minified version of PV is checked into the git repository (``bio-pv.min.js``). You may either use this file directly, or create it from the sources. In the case of the latter, you will need `Grunt <http://gruntjs.com>`_ and `NPM <https://npmjs.org/>`_ installed on your system. Use the following commands to build:

.. code-block:: bash
 
  # setup dev environment for PV
  npm install --setup-dev
  # runs grunt and applies some additional name mangling to the source
  scripts/make.sh

Upon success, bio-pv.min.js is placed in the project's top-level folder. 


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
