Superposition of structures
=========================================================================================

PV has support for pair-wise superposition of structures through the :func:`pv.mol.superpose` function. The function takes two structures (subject and reference) and calculates a transformation that transforms subject's atoms to the reference.



.. function:: pv.mol.superpose(subject, reference)

  :param subject: the structure to be transformed.
  :type subject: :class:`~pv.mol.Mol` or :class:`~pv.mol.MolView`

  :param reference: the structure to superpose onto
  :type reference: :class:`~pv.mol.Mol` or :class:`~pv.mol.MolView`

  Both structures must have the exact same number of atoms and contain at least 3 atoms. If any of these conditions is violated, no superposition is performed and false is returned. The atoms in the two structures are paired in order they appear in the two structures. For creating matching structures betwen reference an subject consider using :func:`~pv.mol.matchResiduesByNum`, or :func:`~pv.mol.matchResiduesByIndex`.

  Upon success, all atoms in *subject* are shifted and rotated according to the calculated transformation matrix. When *subject* is a view, atoms that are part of the full structure but not part of the view are transformed as well.  This allows to use a subset of atoms for the superposition, while still transforming all of the *subject* atoms.



.. function:: pv.mol.matchResiduesByIndex(inA, inB[, atoms])
              pv.mol.matchResiduesByNum(inA, inB[, atoms])

  Helper functions to create views with matching number of atoms that can be used as input to the superpose function. 

  In case the structure contains multiple chains, the chains are matched by their index. When the two structures do not contain the same number of chains, chains that do not have a corresponding chain in the other structure are discarded. 

  The matching of residues in a chain depends on the exact function used:

  * :func:`~pv.mol.matchResiduesByIndex` matches residues in a chain by their index. It is required that the matched chains have the same number of residues. If this condition does not hold, matching is aborted and null returned.

  * :func:`~pv.mol.matchResiduesByNum` matches residues by their residues number. The residues in the output view appear in the same order they appear in the first structure.

  For each matched residue pair only atoms present in both residues are included. When the *atoms* parameter is provided, the atoms are further filtered by the specified criteria. When *atoms* is set to ``'all'`` or ``null``, all atoms that are present in both residues are included in the result. When *atoms* is ``'backbone'``, only backbone atoms are included. Otherwise *atoms* is a comma-separated list of atoms names to be included.

  :param inA: First structure
  :type inA: :class:`~pv.mol.Mol` or :class:`~pv.mol.MolView`
  :param inB: Second structure
  :type inB: :class:`~pv.mol.Mol` or :class:`~pv.mol.MolView`
  :param atoms: The subset of atoms to be included in the two views. Must either be null, string or a list of strings.
  :returns: An array of length two containing the two created views as ``[outA, outB]``.
