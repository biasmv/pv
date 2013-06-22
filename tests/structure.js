test( "structure tests", function() {
   var structure = Structure();
   var chain = structure.add_chain('A');
   ok(chain.name() == 'A');
   ok(structure.chains().length ==1);
   var res = chain.add_residue('GLY', 3);
   ok(res.name() == 'GLY');
   ok(res.num() == 3);
   ok(chain.residues().length == 1);
   var atm = res.add_atom('CA', [1,2,3], 'C');
   ok(res.atoms().length == 1);
   ok(atm.name()=='CA');
   ok(atm.element() == 'C');
 });

test('load_pdb', function() {
  var line ='ATOM      1  N   MET A   1      16.000  64.000   8.000  0.50  1.00           N\n';
  line+=    'HETATM    2  CA  MET A   1      32.000-128.000  -2.500  1.00128.00           C';
  var mol = load_pdb(line); 
  ok(mol.chains().length == 1);
  var chain = mol.chains()[0];
  ok(chain.name() == 'A');
  ok(chain.residues().length == 1);
  var res = chain.residues()[0];
  ok(res.name()=='MET');
  ok(res.num()==1);
  ok(res.atoms().length==2);
  var n = res.atoms()[0];
  ok(n.name()=='N');
  var ca = res.atoms()[1];
  ok(ca.name()=='CA');
  
});


