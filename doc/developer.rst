PV for developers documentation
=========================================

How to Contribute
-----------------------------------------

Contributions of any kind (code, documentation, bug reports) are more than welcome.

Coding conventions
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Apart from the basic rules listed below, there is no detailed style guide. In doubt, just look at the existing code.

  - always put braces around if/else/while/for statements.
  - and indent is two spaces
  - camelCase your variables and function names
  - use an _ prefix for your private variables that should not be accessed from outside the class
  - wrap code at 80 characters
  - use === and !== for comparisons

Commits
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Use descriptive commit messages using the following format:

 - a short single-line summary, e.g. "add transparency for mesh and line geoms". This line summary should not exceed 60-70 characters.
 - optionally a block of text that describes the change in more detail, e.g.

      color information is now stored as an RGBA quadruplet to accomodate one 
      alpha value for each vertex. Coloring operations have grown the ability to 
      specify alpha values. In case they are omitted, they default to 1.0 
      (fully opaque) structure.

   the block should be wrapped at 80 characters.

In case you are submitting a larger feature/bugfix, split your work into multiple commits. The main advantage is that your change becomes easier to review.

Before submitting
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Before submitting, or sending the pull request

 - make sure that there are no unrelated changes checked in.
 - run grunt to check for any coding convention violations and in general make sure that grunt is still able to minify your code without problems.
 - in case you are adding new functionality, make sure you area adding it to the API documentation
 - make sure you don't check-in changes to bio-pv.min.js. These changes are  very likely to cause conflicts.



How to release a new version of PV
------------------------------------------

These are the steps to release a new version of PV:

Release Testing
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

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

Release Publishing
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* Publish the package to npm: ``npm publish``
* tag the release using ``git tag v$version -m "tagging v$version"``
* Upload the release package to github releases
* Create a readthedocs documentation version for the new tag
* Set the tag as the default version


