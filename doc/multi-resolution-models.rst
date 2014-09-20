Multi Resolution Models
============================================================


PV is very fast at displaying molecules at atomic or near-atomic (tube, trace etc.) resolution levels when the molecules are decently sized. For large molecules (think ribosome, asymmetric virus capsids), however, PV starts to reach limits. These problems are inherent in the size of the data to be displayed:

  - large structures can be 20MB or more to download. Because structure file formats are not designed to be loaded incrementally we have to wait until the complete structure is downloaded.
  - the geometry required to render these molecules, even at modest levels of detail use gigabytes of memory and that's certainly not something that should be done in the browser.


To render such large molecules, as a separate infrastructure has been implemented in PV. 

  - a file-format optimized for incremental retrieval of information.
  - a data management layer that fetches higher level of details when required
  - a special renderer that adapts to level of detail of the geometry relative to the camera.


Low-level representation of macromolecules
=============================================================


A Low resolution model holds a simplified representation of molecular complex.
 
Each chain is represented as a linear sequence of a polypeptide/nucleotide trace.  Secondary structure elements are only stored as start/end, while residues of coil regions are stored as position of their central atom (typically Carbon-alpha)

Open questions: 
   - what to do with ligands and small molecules?
  
