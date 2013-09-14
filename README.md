pv - WebGL protein viewer
=========================================

pv  is a WebGL-based protein viewer whose goal is to once-for-all end the reign of Java applets on websites that require visualisation of protein structures. It implements all major render modes that you would expect, supports custom color schemes. pv is still very much in development, and new limbs are added on a weekly basis.

pv has been implemented with maximum performance in mind. There is nothing worse than an unresponsive website.


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

