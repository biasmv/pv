require(['mol/all'], function(mol) {

function makeSimpleMolecule() {
  var m = new mol.Mol();
  var chainA = m.addChain("A");
  var resA1 = chainA.addResidue("XXX", 1);
  resA1.addAtom("A", [0,0,0], "C");
  resA1.addAtom("A", [0,0,0], "C");
  resA1.addAtom("A", [0,0,0], "C");
  var resA2 = chainA.addResidue("XXX", 2);
  resA2.addAtom("A", [0,0,0], "C");
  resA2.addAtom("A", [0,0,0], "C");
  resA2.addAtom("A", [0,0,0], "C");
  var resA3 = chainA.addResidue("XXX", 3);
  resA3.addAtom("A", [0,0,0], "C");
  resA3.addAtom("A", [0,0,0], "C");
  var chainB = m.addChain("B");
  var resB1 = chainB.addResidue("XXX", 1);
  resB1.addAtom("A", [0,0,0], "C");
  resB1.addAtom("A", [0,0,0], "C");
  resB1.addAtom("A", [0,0,0], "C");
  var resB2 = chainB.addResidue("XXX", 2);
  resB2.addAtom("A", [0,0,0], "C");
  resB2.addAtom("A", [0,0,0], "C");
  resB2.addAtom("A", [0,0,0], "C");
  var resB3 = chainB.addResidue("XXX", 3);
  resB3.addAtom("A", [0,0,0], "C");
  resB3.addAtom("A", [0,0,0], "C");
  return m;
}

test("eachAtom breaks when returning false", function() {
  var m = makeSimpleMolecule();
  var atomCount = m.atomCount();
  var stopAt = 0;
  var counter = 0;
  function iter(atom, index) {
    counter++;
    if (index === stopAt) {
      return false;
    }
    return true;
  }
  for (var i = 0; i < atomCount; ++i) {
    stopAt = i;
    counter = 0;
    m.eachAtom(iter);
    strictEqual(counter, stopAt+1);
  }
});

test("eachResidue breaks when returning false", function() {
  var m = makeSimpleMolecule();
  var residueCount = m.residueCount();
  var stopAt = 0;
  var counter = 0;
  var index = 0;
  function iter(residue) {
    counter++;
    index++;
    if (index === stopAt) {
      return false;
    }
    return true;
  }
  for (var i = 0; i < residueCount; ++i) {
    stopAt = i+1;
    index = 0;
    counter = 0;
    m.eachResidue(iter);
    strictEqual(counter, stopAt);
  }
});

});
