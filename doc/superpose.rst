Superposition of structures
=========================================================================================

PV has support for pair-wise superposition of structures through the :func:`pv.mol.superpose` function. The function takes two structures (subject and reference) and calculates a transformation that transforms subject's atoms to the reference.



.. function:: pv.mol.superpose(subject, reference)

  :param subject: the structure to be transformed.
  :type subject: :class:`~pv.mol.Mol` or :class:`~pv.mol.MolView`

  :param reference: the structure to superpose onto
  :type reference: :class:`~pv.mol.Mol` or :class:`~pv.mol.MolView`

  Both structures must have the exact same number of atoms and contain at least 3 atoms. If any of these conditions is violated, no superposition is performed and false is returned.

  Upon success, all atoms in *subject* are shifted and rotated according to the calculated transformation matrix. When *subject* is a view, atoms that are part of the full structure but not part of the view are transformed as well.  This allows to use a subset of atoms for the superposition, while still transforming all of the *subject* atoms.
