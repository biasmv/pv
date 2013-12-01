Molecular Structures
=========================================================================================

Molecular structures are represented by the :class:`mol.Mol` class. While nothing restricts the type of molecules stored in an instance of :class:`mol.Mol`, the data structure is optimized for biological macromolecules and follows the same hierarchical organizing principle. The lowest level of the hierarchy is formed by chains. The chains consist of one or more residues. Depending on the type of residues the chain holds, the chain is interpreted as a linear chain of residues, e.g. a polyeptide, or polynucleotide, or a collection of an unordered group of molecules such as water. In the former case, residues are ordered from N to C terminus, whereas in the latter the ordering of the molecules does not carry any meaning. Each residue consists of a one or more atoms.

Tightly coupled to :class:`mol.Mol` is the concept of structural subset, a :class:`mol.MolView`. MolViews have the exact same interface than :class:`mol.Mol` and in most cases behave exactly the same. Thus, from a user perspective it mostly does not matter whether one is working with a complete structure or a subset thereof. In the following, the APIs for the :class:`mol.Mol` and :class:`mol.MolView` classes are described together. Where differences exist, they are documented.


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

.. function:: mol.Mol.full()
              mol.MolView.full()

  Convenience function that always links back to :class:`mol.Mol`. For instances of :class:`mol.Mol`, returns this directly, for instances of :class:`mol.MolView` returns a reference to the :class:`mol.Mol` the subset was derived from. 

.. function:: mol.Mol.atomCount()
              mol.MolView.atomCount()

  Returns the number of atoms in the structure, subset of structure.

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

  **Available Chain Predicates:**

  * *cname*/*chain*: A chain is included iff the chain name it is equal to the *cname*/*chain*. To match against multiple chain names, use the plural forms cnames/chains.

  **Available Residue Predicates:**

  * *rname*: A residue is included iff the residue name it is equal to *rname*/*chain*. To match against multiple residue names, use the plural form rnames.
  * *rindexRange* include residues at position in a chain in the half-closed interval *rindexRange[0]* and *rindexRange[1]*. The residue at *rindexRange[1]* is not included. Indices are zero-based. 
  * *rindices* includes residues at certain positions in the chain. Indices are zero based.

  **Available Atom Predicates:**

  * *aname* An atom is included iff the atom name it is equal to *aname*. To match against multiple atom names, use the plural forms cnames/chains.

  **Examples:**

  .. code-block:: javascript

    // select chain with name 'A' and all its residues and atoms
    var chainA = myStructure.select({cname : 'A'});

    // select carbon alpha  of chain 'A'. Residues with no carbon alpha will not be
    // included in the result.
    var chainACarbonAlpha = myStructure.select({cname : 'A', aname : 'CA'});

  When none of the above selection mechanisms is flexible enough, consider using :func:`mol.Mol.residueSelect`, or :func:`mol.Mol.atomSelect`.


  :returns: :class:`mol.MolView` containing the subset of chains, residues and atoms.

.. function:: mol.Mol.selectWithin(structure[, options])
              mol.MolView.selectWithin(structure[, options])

  Returns an instance of :class:`mol.MolView` containing chains, residues and atoms which are in spatial proximity to *structure*. 

  :param structure: :class:`mol.Mol` or :class:`mol.MolView` to which proximity is required.
  :param options: An optional dictionary of options to control the behavior of selectWithin.  **radius** sets the distance cutoff in Angstrom. The default radius is 4.   **matchResidues** whether to use residue matching mode. When set to true, all atom of a residue are included in result as soon as one atom is in proximity.


.. function:: mol.Mol.residueSelect(predicate)
              mol.MolView.residueSelect(predicate)

  Returns an instance of :class:`mol.MolView` only containing residues which match the predicate function. The predicate must be a function which accepts a residue as its only argument and return true for residues to be included. For all other residues, the predicate must return false. All atoms of matching residues will be included in the view.

  **Example:**

  .. code-block:: javascript

    var oddResidues = structure.residueSelect(function(res) { return res.index() % 2; });

.. function:: mol.pdb(pdbData)

  Loads a structure from the *pdbData* string and returns it. In case multiple models are present in the file (as designated by MODEL/ENDMDL), only the first is read. The following record types are handled:

   * *ATOM/HETATM* for the actual coordinate data. Alternative atom locations other than those labelled as *A* are discarded.
   * *HELIX/STRAND* for assignment of secondary structure information.

The Chain (and ChainView) API
-----------------------------------------------------------------------------------------

.. class:: mol.Chain


.. class:: mol.ChainView

.. function:: mol.Chain.name()
              mol.ChainView.name()

  The name of the chain. For chains loaded from PDB, the chain names are alpha-numeric and no longer than one character.

.. function:: mol.Chain.residues()
              mol.ChainView.residues()

  Returns the list of residues contained in this chain. For :class:`mol.Chain` instances, returns an array of :class:`mol.Residue`, for :class:`mol.ChainView` instances returns an array of :class:`mol.ResidueView` instances.

.. function:: mol.Chain.eachBackboneTrace(callback)
              mol.ChainView.eachBackboneTrace(callback)

  Invokes *callback* for each stretch of consecutive amino acids found in the chain. Each trace contains at least two amino acids. Two amino acids are consecutive when their backbone is complete and the carboxy C-atom and the nitrogen N could potentially form a peptide bond.

  :param callback: a function which accepts the array of trace residues as an argument

.. function:: mol.Chain.backboneTraces()
              mol.ChainView.backboneTraces()

  Convenience function which returns all backbone traces of the chain as a list. See :func:`mol.Chain.eachBackboneTrace`.



The Residue (and ResidueView) API
-----------------------------------------------------------------------------------------


.. class:: mol.Residue


.. class:: mol.ResidueView


.. function:: mol.Residue.name()
              mol.ResidueView.name()

  Returns the three-letter-code of the residue, e.g. GLY for glycine. 


.. function:: mol.Residue.isWater()
              mol.ResidueView.isWater()

  Returns true when the residue is a water molecule. Water molecules are recognized by having a one-letter-code of HOH or DOD (deuteriated water).


.. function:: mol.Residue.isAminoAcid()
              mol.ResidueView.isAminoAcid()

  Returns true when the residue is an amino acid. Residues which have the four backbone atoms N, CA, C, and O are considered as amino acids, all others not. 

.. function:: mol.Residue.num()
              mol.ResidueView.num()

  Returns the numeric part of the residue number, ignoring insertion code.

.. function:: mol.Residue.index()
              mol.ResidueView.index()

  Returns the index of the residue in the chain.

.. function:: mol.Residue.atoms()
              mol.ResidueView.atoms()

  Returns the list of atoms of this residue. For :class:`mol.Residue`, returns an array of :class:`mol.Atom` instances, for :class:`mol.ResidueView`, resturns an array of :class:`mol.AtomView` instances.

.. function:: mol.Residue.atom(nameOrIndex)
              mol.ResidueView.atom(nameOrIndex)

  Get a particular atom from this residue. *nameOrResidue* can either be an integer, in which case the atom at that index is returned, or a string, in which case an atom with that name is searched and returned. 

  :returns: For :class:`mol.Residue`, a :class:`mol.Atom` instance, for :class:`mol.ResidueView`, a :class:`mol.AtomView` instance. If no matching atom could be found, null is returned. 



The Atom (and AtomView) API
-----------------------------------------------------------------------------------------

.. class:: mol.Atom


.. class:: mol.AtomView


.. function:: mol.Atom.name()
              mol.AtomView.name()

  The name of the atom, e.g. CA for carbon alpha.

.. function:: mol.Atom.element()
              mol.AtomView.element()

  The element of the atom. When loading structures from PDB, the element column must be present for the element to be set properly. When the element column is not present, the element is set to an empty string, or to whatever characters are present in the element column.
  

.. function:: mol.Atom.bonds()
              mol.AtomView.bonds()

  Returns a list of all bonds this atom is involved in. 

.. function:: mol.Atom.pos()
              mol.AtomView.pos()

  The actual coordinates of the atom.


The Bond API
-----------------------------------------------------------------------------------------


.. class:: mol.Bond


to be written...
