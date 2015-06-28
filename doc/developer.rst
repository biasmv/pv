PV for developers documentation
=========================================

How to release a new version of PV
------------------------------------------

These are the steps to release a new version of PV:

* Check that all unit tests pass
* Check that the samples in the documentation work
* Check that all samples in the demo work
* Check that the release note contain all major changes
* Update version number

    - Update version number in release notes (README.md)
    - Update version number in package.json
    - Update version number in doc/conf.py

* Create NPM package with ```npm pack```.
* Test that the npm package works by unzipping it in a separate directory and running all the snippets 

  .. code-block:: bash
    
    cp bio-pv-$version.tgz /tmp
    cd /tmp
    open -W bio-pv-$version.tgz
    cd package
    biojs-sniper
    open http://localhost:9090/snippets


