Molecular Structures
=========================================================================================

Molecular structures are represented by the :class:`mol.Mol` class. While nothing restricts the type of molecules stored in an instance of :class:`mol.Mol`, the data structure is optimized for biological macromolecules and follows the same hierarchical organizing principle. The lowest level of the hierarchy is formed by chains. The chains consist of one or more residues. Depending on the type of residues the chain holds, the chain is interpreted as a linear chain of residues, e.g. a polyeptide, or polynucleotide, or a collection of an unordered group of molecules such as water. In the former case, residues are ordered from N to C terminus, whereas in the latter the ordering of the molecules does not carry any meaning. Each residue consists of a one or more atoms.

Tightly coupled to :class:`mol.Mol` is the concept of structural subset, a :class:`mol.MolView`. MolViews have the exact same interface than :class:`mol.Mol` and in most cases behave exactly the same. Thus, from a user perspective it mostly does not matter whether one is working with a complete structure or a subset thereof. In the following, the API described for :class:`mol.Mol` only, but almost all methods are valid for :class:`mol.MolView` as well. Where differences exists, they are documented.


The Mol (and MolView) API
-----------------------------------------------------------------------------------------

.. class:: mol.Mol()

  Represents a complete molecular structure which may consist of multiple polypeptide chains, solvent and other molecules.

.. class:: mol.MolView()

  Represents a subset of a molecular structure, e.g. the result of a selection operation. Except for a few differences, it's API is identical to :class:`mol.Mol`.

.. function:: mol.Mol.eachAtom(callback)
              mol.MolView.eachAtom(callback)

  Invoke callback for each atom in the structure. For example, the following code calculates the number of carbon alpha atoms.

  .. code-block:: javascript

    var carbonAlphaCount = 0;
    myStructure.eachAtom(function(atom) {
      if (atom.name() !== 'CA')
        return;
      if (!atom.residue().isAminoacid())
        return;
      carbonAlphaCount += 1; 
    });
    console.log('number of carbon alpha atoms', carbonAlphaCount);

.. function:: mol.Mol.eachResidue(callback)
              mol.MolView.eachResidue(callback)

  Invoke callback for each residue in the structure or view.


.. function:: mol.Mol.center()
              mol.MolView.center()

  Returns the geometric center of all atoms in the structure.

.. function:: mol.Mol.chains()
              mol.MolView.chains()

  Returns an array of all chains in the structure. For :class:`mol.Mol`, this returns a list of :class:`mol.Chain` instances, for :class:`mol.MolView` a list of :class:`mol.ChainView` instances.

.. function:: mol.Mol.select(what)
              mol.MolView.select(what)

  Returns a :class:`mol.MolView` containing a filtered subset of chains, residues and atoms. *what* determines how the filtered subset is created. It can be set to a predefined string for commonly required selections, or be set to a dictionary of predicates that have to match for a chain, residue or atom to be included in the result. Currently, the following predefined selections are accepted:

  * *water*: selects residues with names HOH and DOD (deuteriated water).
  * *protein*: returns all amino-acids found in the structure. Note that this might return amino acid ligands as well.
  * *ligand*: selects all residues which are not water nor protein.

  Matching by predicate dictionary provides a flexible way to specify selections without having to write custom callbacks. A predicate is a condition which has to be fullfilled in order to include a chain, residue or atom in the results. Some of the predicates match against chain ,e.g. *cname*, others against residues, e.g. *rname*, and others against atoms, e.g. *ele*. When multiple predicates are specified in the dictionary, all of them have to match for an item to be included in the results.

  **Available Predicates:**

  * *cname*/*chain*: A chain is included iff the chain name it is equal to the *cname*/*chain*. To match against multiple chain names, use the plural forms cnames/chains.
  * *cnames*/*chains*: A chain is included iff its name is identical of one of the names in the *cnames*/*chains* array. To match against a single chain name, use the singular forms *cname*/*chain*.

  * to be continued...

  **Examples:**

  .. code-block:: javascript

    // select chain with name 'A' and all its residues and atoms
    var chainA = myStructure.select({cname : 'A'});

    // select carbon alpha  of chain 'A'. Residues with no carbon alpha will not be
    // included in the result.
    var chainACarbonAlpha = myStructure.select({cname : 'A', aname='CA'});

  When none of the above selection mechanisms is flexible enough, consider using :func:`mol.Mol.residueSelect`, or :func:`mol.Mol.atomSelect`.


  :returns: :class:`mol.MolView` containing the subset of chains, residues and atoms.


.. function:: mol.pdb(pdbData)

  Loads a structure from the *pdbData* string and returns it. In case multiple models are present in the file (as designated by MODEL/ENDMDL), only the first is read. The following record types are handled:

   * *ATOM/HETATM* for the actual coordinate data. Alternative atom locations other than those labelled as *A* are discarded.
   * *HELIX/STRAND* for assignment of secondary structure information.

The Chain (and ChainView) API
-----------------------------------------------------------------------------------------

.. class:: mol.Chain


.. class:: mol.ChainView


The Residue (and ResidueView) API
-----------------------------------------------------------------------------------------


.. class:: mol.Residue


.. class:: mol.ResidueView



The Atom (and AtomView) API
-----------------------------------------------------------------------------------------


.. class:: mol.Atom


.. class:: mol.AtomView



The Bond API
-----------------------------------------------------------------------------------------


.. class:: mol.Bond


