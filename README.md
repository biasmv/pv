pv - WebGL protein viewer
=========================================

pv  is a WebGL-based protein viewer whose goal is to once-for-all end the reign of Java applets on websites that require visualisation of protein structures. It's not you Java, it's all the annoying security popups and slow loading times. pv implements all major render modes that you would expect, and supports custom color schemes. 

Because there is nothing worse than a unresponsive website, pv has been implemented with maximum performane in mind. Even very large macromolecules can be visualised at interactive framerates.


Trying it out
-----------------------------------------

You can try the [online demo](http://biasmv.github.io/pv/) or run it locally on your computer.

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

  * DNA/RNA visualisation is not implemented yet, for protein-centrict workflows that's fine though. In case you are interested in DNA/RNA rendering, just open a feature request and I'll try to get around to it.

  * At the moment, the PDB files are required to have secondary structure information assigned, as PV does not implement algorithm to assign secondary structure yet. That's on the TODO list though and will be added soon.


Documentation
---------------------------------------

Documentation for pv is available [here](http://pv.readthedocs.org). 
