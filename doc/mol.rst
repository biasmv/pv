Molecular Structures
=========================================================================================

Molecular structures are represented by the :class:`pv.mol.Mol` class. While nothing restricts the type of molecules stored in an instance of :class:`pv.mol.Mol`, the data structure is optimized for biological macromolecules and follows the same hierarchical organizing principle. The lowest level of the hierarchy is formed by chains. The chains consist of one or more residues. Depending on the type of residues the chain holds, the chain is interpreted as a linear chain of residues, e.g. a polyeptide, or polynucleotide, or a collection of an unordered group of molecules such as water. In the former case, residues are ordered from N to C terminus, whereas in the latter the ordering of the molecules does not carry any meaning. Each residue consists of one or more atoms.

Tightly coupled to :class:`pv.mol.Mol` is the concept of structural subset, a :class:`pv.mol.MolView`. MolViews have the exact same interface than :class:`pv.mol.Mol` and in most cases behave exactly the same. Thus, from a user perspective it mostly does not matter whether one is working with a complete structure or a subset thereof. In the following, the APIs for the :class:`pv.mol.Mol` and :class:`pv.mol.MolView` classes are described together. Where differences exist, they are documented.


Obtaining and Creating Molecular Structures
-----------------------------------------------------------------------------------------

The most common way to construct :class:`molecules <pv.mol.Mol>` is through one of the io functions. For example, to import the structure from a PDB file, use :func:`pv.io.pdb`. The whole structure, or a subset thereof can then be displayed on the screen by using one of the :ref:`rendering functions<pv.viewer.rendering>`.

The following code example fetches a PDB file from PDB.org imports it and displays the chain with name 'A' on the screen. For more details on how to create subsets, see :ref:`pv.mol.creating-views`.

.. code-block:: javascript

  $.ajax('http://pdb.org/pdb/files/'+pdbId+'.pdb')
  .done(function(data) {
      // data contains the contents of the PDB file in text form
      var structure = pv.io.pdb(data);
      var firstChain = structure.select({chain: 'A'});
      viewer.cartoon('firstChain', firstChain);
  });

Alternatively, you can create the structure *by hand*. That's typically not required, unless you are implementing your own importer for a custom format.  The following code creates a simple molecule consisting of 10 atoms arranged along the x-axis.

.. code-block:: javascript

  var structure = new pv.mol.Mol();
  var chain = structure.addChain('A');
  for (var i = 0; i < 10; ++i) {
    var residue = chain.addResidue('ABC', i);
    residue.addAtom('X', [i, 0, 0], 'C');
  }


.. _pv.mol.creating-views:

Creating Subsets of a Molecular Structure
-----------------------------------------------------------------------------------------

It is quite common to only apply operations (coloring, displaying) to subset of a molecular structure. These subsets are modelled as *views* and can be created in different ways.

 - The most convenient way to create views is by using :func:`pv.mol.Mol.select`. Select accepts a set of predicates and returns a view containing only chains, residues and atoms that match the predicates. 
 - Alternatively for more complex selections, one can use :func:`pv.mol.Mol.residueSelect`, or :func:`pv.mol.Mol.atomSelect`, which evaluates a function on each residue/atom and includes residues/atoms for which the function returns true.

 - Selection by distance allows to select parts of a molecule that are within a certain radius of  another molecule.
 - Views can be assembled manually through :func:`pv.mol.MolView.addChain`, :func:`pv.mol.ChainView.addResidue`, :func:`pv.mol.ResidueView.addAtom`. This is the most flexible but also the most verbose way of creating views.


Loading Molecular Structures
-----------------------------------------------------------------------------------------

The following functions import structures from different data formats. 

.. function:: pv.io.pdb(pdbData[, options])

  Loads a structure from the *pdbData* string and returns it. In case multiple models are present (as designated by MODEL/ENDMDL), only the first is read. This behavior can be changed by passing  ``loadAllModels : true`` to the options dictionary. In that case all models present in the string are loaded and returned as an array. Secondary structure and assembly information is assigned to all of the models. 
  
The following record types are handled:

   * *ATOM/HETATM* for the actual coordinate data. Alternative atom locations other than those labelled as *A* are discarded.
   * *HELIX/STRAND* for assignment of secondary structure information.
   * *REMARK 350* for handling of biological assemblies

.. function:: pv.io.sdf(sdfData)

  Load small molecules from *sdfData* and returns them. In case multiple molecules are present, these molecules are returned as separate chains of the same :class:`pv.mol.Mol` instance.

  Currently, only a minimal set of information is extracted from SDF files:

  * atom position, element, atom name (set to the element)
  * connectivity information
  * the chain name is set to the structure title

.. function:: pv.io.fetchPdb(url, callback[, options])
              pv.io.fetchSdf(url, callback)

  Performs an adjax request the provided URL and loads the data as a structure using either :func:`pv.io.pdb`, or :func:`pv.io.sdf`. Upon success, the callback is invoked with the loaded structure as the only argument. *options* is passed as-is to :func:`pv.io.pdb`.


Mol (and MolView)
-----------------------------------------------------------------------------------------

.. class:: pv.mol.Mol()

  Represents a complete molecular structure which may consist of multiple polypeptide chains, solvent and other molecules.  Instances of mol are typically created through one of the io functions, e.g. :func:`pv.io.pdb`, or :func:`pv.io.sdf`.

.. class:: pv.mol.MolView()

  Represents a subset of a molecular structure, e.g. the result of a selection operation. Except for a few differences, it's API is identical to :class:`pv.mol.Mol`.

.. function:: pv.mol.Mol.eachAtom(callback)
              pv.mol.MolView.eachAtom(callback)

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

.. function:: pv.mol.Mol.eachResidue(callback)
              pv.mol.MolView.eachResidue(callback)

  Invoke callback for each residue in the structure or view.

.. function:: pv.mol.Mol.full()
              pv.mol.MolView.full()

  Convenience function that always links back to :class:`pv.mol.Mol`. For instances of :class:`pv.mol.Mol`, returns this directly, for instances of :class:`pv.mol.MolView` returns a reference to the :class:`pv.mol.Mol` the subset was derived from. 

.. function:: pv.mol.Mol.atomCount()
              pv.mol.MolView.atomCount()

  Returns the number of atoms in the structure, subset of structure.

.. function:: pv.mol.Mol.center()
              pv.mol.MolView.center()

  Returns the geometric center of all atoms in the structure.

.. function:: pv.mol.Mol.chains()
              pv.mol.MolView.chains()

  Returns an array of all chains in the structure. For :class:`pv.mol.Mol`, this returns a list of :class:`pv.mol.Chain` instances, for :class:`pv.mol.MolView` a list of :class:`pv.mol.ChainView` instances.

.. function:: pv.mol.Mol.select(what)
              pv.mol.MolView.select(what)

  Returns a :class:`pv.mol.MolView` containing a filtered subset of chains, residues and atoms. *what* determines how the filtered subset is created. It can be set to a predefined string for commonly required selections, or be set to a dictionary of predicates that have to match for a chain, residue or atom to be included in the result. Currently, the following predefined selections are accepted:

  * *water*: selects residues with names HOH and DOD (deuteriated water).
  * *protein*: returns all amino-acids found in the structure. Note that this might return amino acid ligands as well.
  * *ligand*: selects all residues which are not water nor protein.
  * *polymer*: selects all residues which are part of polymers. At the moment, this only returns nucleotides and peptides. Residues are considered to be part of polymers if they have a bond to at least one other residue of the same type. Note that the behavior of *polymer* is not identical *protein*. The latter also returns single amino acids.

  Matching by predicate dictionary provides a flexible way to specify selections without having to write custom callbacks. A predicate is a condition which has to be fullfilled in order to include a chain, residue or atom in the results. Some of the predicates match against chain ,e.g. *cname*, others against residues, e.g. *rname*, and others against atoms, e.g. *ele*. When multiple predicates are specified in the dictionary, all of them have to match for an item to be included in the results.

  **Available Chain Predicates:**

  * *cname*/*chain*: A chain is included iff the chain name it is equal to the *cname*/*chain*. To match against multiple chain names, use the plural forms cnames/chains.

  **Available Residue Predicates:**

  * *rname*: A residue is included iff the residue name it is equal to *rname*. To match against multiple residue names, use the plural form rnames.
  * *rindexRange* include residues at position in a chain in the interval *rindexRange[0]* and *rindexRange[1]*. The residue at *rindexRange[1]* is also included. Indices are zero-based. 
  * *rindices* includes residues at certain positions in the chain. Indices are zero based.

  * *rnum* includes residues having the provided residue number value. Only the numeric part is honored, insertion codes are ignored. To match against multiple residue numbers, use the plural form *rnums*.
  * *rnumRange* include residues with numbers between *rnumRange[0]* and *rnumRange[1]*. The residue with number *rnumRange[1]*  is also included.

  **Available Atom Predicates:**

  * *aname* An atom is included iff the atom name it is equal to *aname*. To match against multiple atom names, use the plural form anames.
  * *hetatm* An atom is included iff the atom hetatm flag matches the provided value.

  **Examples:**

  .. code-block:: javascript

    // select chain with name 'A' and all its residues and atoms
    var chainA = myStructure.select({cname : 'A'});

    // select carbon alpha  of chain 'A'. Residues with no carbon alpha will not be
    // included in the result.
    var chainACarbonAlpha = myStructure.select({cname : 'A', aname : 'CA'});

  When none of the above selection mechanisms is flexible enough, consider using :func:`pv.mol.Mol.residueSelect`, or :func:`pv.mol.Mol.atomSelect`.


  :returns: :class:`pv.mol.MolView` containing the subset of chains, residues and atoms.

.. function:: pv.mol.Mol.selectWithin(structure[, options])
              pv.mol.MolView.selectWithin(structure[, options])

  Returns an instance of :class:`pv.mol.MolView` containing chains, residues and atoms which are in spatial proximity to *structure*. 

  :param structure: :class:`pv.mol.Mol` or :class:`pv.mol.MolView` to which proximity is required.
  :param options: An optional dictionary of options to control the behavior of selectWithin (see below)

  **Options**

  - **radius** sets the distance cutoff in Angstrom. The default radius is 4.   
      
  - **matchResidues** whether to use residue matching mode. When set to true, all atom of a residue are included in result as soon as one atom is in proximity.


.. function:: pv.mol.Mol.residueSelect(predicate)
              pv.mol.MolView.residueSelect(predicate)

  Returns an instance of :class:`pv.mol.MolView` only containing residues which match the predicate function. The predicate must be a function which accepts a residue as its only argument and return true for residues to be included. For all other residues, the predicate must return false. All atoms of matching residues will be included in the view.

  **Example:**

  .. code-block:: javascript

    var oddResidues = structure.residueSelect(function(res) { 
      return res.index() % 2; 
    });

.. function:: pv.mol.Mol.atomSelect(predicate)
              pv.mol.MolView.atomSelect(predicate)

  Returns an instance of :class:`pv.mol.MolView` only containing atoms which match the predicate function. The predicate must be a function which accepts an atom as its only argument and return true for atoms to be included. For all other atoms, the predicate must return false. 

  **Example:**

  .. code-block:: javascript

    var carbonAlphas = structure.atomSelect(function(atom) { 
      return res.name() === 'CA'; 
    });

.. function:: pv.mol.Mol.addChain(name)

  Adds a new chain with the given name to the  structure

  :param name: the name of the chain

  :returns: the newly created :class:`pv.mol.Chain` instance

.. function:: pv.mol.MolView.addChain(chain, includeAllResiduesAndAtoms)

  Adds the given chain to the structure view

  :param chain: the chain to add. Must either be a :class:`pv.mol.ChainView`, or :class:`pv.mol.Chain` instance.
  :param includeAllResiduesAndAtoms: when true, residues and atoms contained in the chain are directly added as new :class:`pv.mol.ResidueView`, :class:`pv.mol.AtomView` instances. When set to false (the default), the new chain view is created with an empty list of residues.

  :returns: the newly created :class:`pv.mol.ChainView` instance

.. function:: pv.mol.Mol.addResidues(residues, includeAllAtoms)

  Adds all residues to their respective chain 

  :param residues: list of new residues
  :param includeAllAtoms: when true, all atoms of the residue are directly added as new AtomViews to the residue. When set to false (the default), a new residue view is created with an empty list of atoms.

  :returns: a map of chain name to chain for the affected chains with new residues.

.. function:: pv.mol.MolView.addAtom(atom)

  Adds the given atom to the view. If the atom is already contained in the view, it is not added again. If an atom's residue or chain are not yet part of the view, they are added as well.

  :param atom: the atom to add. Must either be a :class:`pv.mol.AtomView`, or :class:`pv.mol.Atom` instance.

  :returns: the newly created :class:`pv.mol.AtomView` instance, or the existing atom if the atom was already contained in the view.

.. function:: pv.mol.MolView.removeAtom(atom, removeEmptyResiduesAndChains)

  Remove the given atom from the view.

  :param atom: The atom to remove must either be a :class:`pv.mol.AtomView`, or :class:`pv.mol.Atom` instance.
  :param removeEmptyResiduesAndChains: when true removes now-empty residues an chains from the view. When false, empty residues an chains remain in the view.

  :returns: true if the atom was part of the view an was removed, false if not.



.. function:: pv.mol.Mol.chain(name)
              pv.mol.MolView.chain(name)

  Alias for :func:`pv.mol.Mol.chainByName`

.. function:: pv.mol.Mol.chainByName(name)
              pv.mol.MolView.chainByName(name)

  Returns the chain with the given name. If no such chain exists, null is returned.

.. function:: pv.mol.Mol.chainsByName(names)
              pv.mol.MolView.chainsByName(names)

  Returns the list of chains matching the specified names. In case a chain does not exist (or is not part of the view), the chain name is ignored, as if it were not specified.


Chain (and ChainView)
-----------------------------------------------------------------------------------------

.. class:: pv.mol.Chain

  Represents either a linear chain of molecules, e.g. as in peptides or an unordered collection of molecules such as water. New instances are created by calling :func:`pv.mol.Mol.addChain`.


.. class:: pv.mol.ChainView

  Represents a subset of a chain, that is a selected subset of residues and atoms. New instances are created and added to an existing :class:`pv.mol.MolView` instance by calling :func:`pv.mol.MolView.addChain`.

.. function:: pv.mol.Chain.name()
              pv.mol.ChainView.name()

  The name of the chain. For chains loaded from PDB, the chain names are alpha-numeric and no longer than one character.

.. function:: pv.mol.Chain.residues()
              pv.mol.ChainView.residues()

  Returns the list of residues contained in this chain. For :class:`pv.mol.Chain` instances, returns an array of :class:`pv.mol.Residue`, for :class:`pv.mol.ChainView` instances returns an array of :class:`pv.mol.ResidueView` instances.

.. function:: pv.mol.Chain.eachBackboneTrace(callback)
              pv.mol.ChainView.eachBackboneTrace(callback)

  Invokes *callback* for each stretch of consecutive amino acids found in the chain. Each trace contains at least two amino acids. Two amino acids are consecutive when their backbone is complete and the carboxy C-atom and the nitrogen N could potentially form a peptide bond.

  :param callback: a function which accepts the array of trace residues as an argument

.. function:: pv.mol.Chain.backboneTraces()
              pv.mol.ChainView.backboneTraces()

  Convenience function which returns all backbone traces of the chain as a list. See :func:`pv.mol.Chain.eachBackboneTrace`.

.. function:: pv.mol.Chain.addResidue(name, number[, insCode])

  Appends a new residue at the end of the chain

  :param name: the name of the residue, for example 'GLY' for glycine.
  :param number: the numeric part of the residue number
  :param insCode: the insertion code character. Defaults to '\\0'.

  :returns: the newly created :class:`pv.mol.Residue` instance


.. function:: pv.mol.Chain.residueByRnum(rnum)
              pv.mol.ChainView.residueByRnum(rnum)

  Returns the first residue in the chain with the given numeric residue number. Insertion codes are ignored. In case no residue has the given residue number, null is returned. This function internally uses a binary search when the residue numbers of the chain are ordered, and falls back to a linear search in case the residue numbers are unordered.

  :returns: if found, the residue instance, and null if no such residue exists.


.. function:: pv.mol.Chain.residuesInRnumRange(start, end)
              pv.mol.ChainView.residuesInRnumRange(start, end)

  Returns the list of residues that have residue number in the range *start*, *end*. Insertion codes are ignored.  This function internally uses a binary search to quickly determine the residues included in the range when the residue numbers in the chain are ordered, and falls back to a linear search in case the residue numbers are unordered.
  
  **Example:**

  .. code-block:: javascript

    // will contain residues with numbers from 5 to 10.
    var residues = structure.chain('A').residuesInRnumRange(5, 10);


.. function:: pv.mol.ChainView.addResidue(residue, includeAllAtoms)

  Adds the given residue to the chain view

  :param residue: the residue to add. Must either be a :class:`pv.mol.ResidueView`, or :class:`pv.mol.Residue` instance.
  :param includeAllAtoms: when true, all atoms of the residue are directly added as new AtomViews to the residue. When set to false (the default), a new residue view is created with an empty list of atoms.

  :returns: the newly created :class:`pv.mol.ResidueView` instance



Residue (and ResidueView)
-----------------------------------------------------------------------------------------


.. class:: pv.mol.Residue

  Represents a residue, e.g. a logical unit of atoms, such as an amino acid, a nucleotide, or a sugar. New residues are created and added to an existing :class:`pv.mol.Chain` instance by calling :func:`pv.mol.Chain.addResidue`.


.. class:: pv.mol.ResidueView

  Represents a subset of a residue, e.g. a subset of the atoms the residue contains. New residue views are created and added to an existing :class:`pv.mol.ChainView` by calling :func:`pv.mol.ChainView.addResidue`.


.. function:: pv.mol.Residue.name()
              pv.mol.ResidueView.name()

  Returns the three-letter-code of the residue, e.g. GLY for glycine. 


.. function:: pv.mol.Residue.isWater()
              pv.mol.ResidueView.isWater()

  Returns true when the residue is a water molecule. Water molecules are recognized by having a one-letter-code of HOH or DOD (deuteriated water).


.. function:: pv.mol.Residue.isAminoAcid()
              pv.mol.ResidueView.isAminoAcid()

  Returns true when the residue is an amino acid. Residues which have the four backbone atoms N, CA, C, and O are considered as amino acids, all others not. 

.. function:: pv.mol.Residue.num()
              pv.mol.ResidueView.num()

  Returns the numeric part of the residue number, ignoring insertion code.

.. function:: pv.mol.Residue.index()
              pv.mol.ResidueView.index()

  Returns the index of the residue in the chain.

.. function:: pv.mol.Residue.atoms()
              pv.mol.ResidueView.atoms()

  Returns the list of atoms of this residue. For :class:`pv.mol.Residue`, returns an array of :class:`pv.mol.Atom` instances, for :class:`pv.mol.ResidueView`, resturns an array of :class:`pv.mol.AtomView` instances.

.. function:: pv.mol.Residue.atom(nameOrIndex)
              pv.mol.ResidueView.atom(nameOrIndex)

  Get a particular atom from this residue. *nameOrResidue* can either be an integer, in which case the atom at that index is returned, or a string, in which case an atom with that name is searched and returned. 

  :returns: For :class:`pv.mol.Residue`, a :class:`pv.mol.Atom` instance, for :class:`pv.mol.ResidueView`, a :class:`pv.mol.AtomView` instance. If no matching atom could be found, null is returned. 


.. function:: pv.mol.Residue.addAtom(name, pos, element)

  Adds a new atom to the residue. 

  :param name: the name of the atom, for example CA for carbon-alpha
  :param pos: the atom position
  :param element: the atom element string, e.g. 'C' for carbon, 'N' for nitrogen

  :returns: the newly created :class:`pv.mol.Atom` instance

.. function:: pv.mol.ResidueView.addAtom(atom)

  Adds the given atom to the residue view

  :returns: the newly created :class:`pv.mol.AtomView` instance


Atom (and AtomView)
-----------------------------------------------------------------------------------------

.. class:: pv.mol.Atom

  Stores properties such as positions, name element etc of an atom. Atoms always have parent residue. New atoms are created by adding them to an existing residue through :func:`pv.mol.Residue.addAtom`.


.. class:: pv.mol.AtomView

  Represents a selected atom as part of a view. New atom views are created by adding them to an existing :class:`pv.mol.ResidueView` through :func:`pv.mol.ResidueView.addAtom`.


.. function:: pv.mol.Atom.name()
              pv.mol.AtomView.name()

  The name of the atom, e.g. CA for carbon alpha.

.. function:: pv.mol.Atom.element()
              pv.mol.AtomView.element()

  The element of the atom. When loading structures from PDB, the atom element is taken *as is* from the element column if it is not empty. In case of an empty element column, the element is guessed from the atom name.
  

.. function:: pv.mol.Atom.bonds()
              pv.mol.AtomView.bonds()

  Returns a list of all bonds this atom is involved in. 

.. function:: pv.mol.Atom.pos()
              pv.mol.AtomView.pos()

  The actual coordinates of the atom.

.. function:: pv.mol.Atom.isHetatm()
              pv.mol.AtomView.isHetatm()

  Returns true when the atom was imported from a HETATM record, false if not. This flag is only meaningful for structures imported from PDB files and will return false for other file formats.


.. function:: pv.mol.Atom.occupancy()
              pv.mol.AtomView.occupancy()

  Returns the occupancy of this atom. In case this value is not available, null will be returned.

.. function:: pv.mol.Atom.tempFactor()
              pv.mol.AtomView.tempFactor()

  Returns the temperature factor (aka B-factor) of this atom. In case this value is not available, null will be returned.

.. function pv.mol.Atom.isConnectedTo(otherAtom)
            pv.mol.AtomView.isConnectedTo(otherAtom)

  Returns true if there is a bond between this atom and other atom, false otherwise. In case otherAtom is null, false is returned.


Bond
-----------------------------------------------------------------------------------------


.. class:: pv.mol.Bond


to be written...
