Coloring Molecular Structures
============================================================================


This document describes how structures can be colored.


Coloring is achieved by coloring operations, which can be understood as small objects that are applied to a structure. Coloring operations can be as simple as "assign a uniform color" to the complete structure, or as complex as mapping a custom float property to a color gradient.

Coloring operations are either supplied directly when generating the geometry of an object, or passed at a later point through :func:`RenderGeom.colorBy`. Internally these two scenarios are handled differently, but from the point of the user, they work exactly the same. These two different ways of coloring are illustrated in the following code example:

.. code-block:: javascript

  // color the whole structure in red, while generating the geometry.
  var geom = pv.lines(myStructure,  { color: color.uniform('red') });
  // oh, no, I changed my mind: We wan't everything in blue!
  geom.colorBy(color.uniform('blue'));

Available color operations
--------------------------------------------------------------------------


The following color operations are available:

.. function:: color.uniform([color])

  Colors the structure with a uniform color. 

  :param color: a valid color identifier, or rgb instance to be used for the structure. Defaults to red.

.. function:: color.byElement()

  Applies the `CPK coloring scheme <http://en.wikipedia.org/wiki/CPK_coloring>`_ to the atoms. For example, carbon atoms are colored in light-grey, oxygen in red, nitrogen in blue, sulfur in yellow.


.. function:: color.byChain([gradient])

  Applies a unique uniform color for each chain in the structure. The chain colors are drawn from a gradient, which guarantees that chain colors are unique. 

  :param gradient: An optional gradient to draw colors from. Defaults to a rainbow gradient.


.. function:: color.bySS()

  Colors the structure based on secondary structure type of the residue. Distinct colors are used for helices, strands and coil residues.

.. function:: color.rainbow([gradient])

  Maps the residue's chain position (its index) to a color gradient. 

  :param gradient: An optional gradient to draw colors from. Defaults to a rainbow gradient.

Adding a new color operation
--------------------------------------------------------------------------

A coloring operation is essentially an object with 3 methods:

  * `colorFor` is called on every atom of the structure (or carbon alpha atoms for trace-based rendering styles.
  * `begin` is called once before coloring a structure, allowing for preprocessing such as determining the number of chains in the structure. `begin` may be undefined, in which case it is ignored.
  * `end` is called after coloring a structure, allowing or cleanup and freeing of resources. `end` may be undefined in which case it is ignored.

The following will add a new color operation which colors atoms based on their index. Atoms with an even index will be colored in red, atoms with an odd index will be colored in blue. 


.. code-block:: javascript

  function evenOdd() {
    return new ColorOp(function(atom, out, index) {
      if (atom.index() % 2 === 0) {
        out[index] = 1.0; out[index+1] = 0.0; out[index+2] = 0.0;
      } else {
        out[index] = 0.0; out[index+1] = 0.0; out[index+2] = 1.0;
      }
    });
  }
