How to Contribute
=========================================

Contributions of any kind (code, documentation, bug reports) are more than welcome.

Coding conventions
-----------------------------------------

Apart from the basic rules listed below, there is no detailed style guide. In doubt, just look at the existing code.

  - always put braces around if/else/while/for statements.
  - and indent is two spaces
  - camelCase your variables and function names
  - use an _ prefix for your private variables that should not be accessed from outside the class
  - wrap code at 80 characters
  - use === and !== for comparisons

Commits
-----------------------------------------

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
----------------------------------------

Before submitting, or sending the pull request

 - make sure that there are no unrelated changes checked in.
 - run grunt to check for any coding convention violations and in general make sure that grunt is still able to minify your code without problems.


