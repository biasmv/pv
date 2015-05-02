require(['mol/all', 'io', 'mol/superpose'], function(mol, io, sp) {


// fragment used in most of the tests, extracted from PDB id: 1r6a
var PDB_FRAGMENT="\n\
ATOM   1989  CA  GLY A 259       4.602 -55.267 -16.077  1.00 60.16           C  \n\
ATOM   1990  C   GLY A 259       5.949 -55.057 -16.740  1.00 61.59           C  \n\
ATOM   1991  O   GLY A 259       6.986 -55.356 -16.143  1.00 61.84           O  \n\
ATOM   1992  N   SER A 260       5.956 -54.516 -17.958  1.00 62.63           N  \n\
ATOM   1993  CA  SER A 260       7.221 -54.335 -18.659  1.00 63.83           C  \n\
ATOM   1994  C   SER A 260       7.242 -53.395 -19.859  1.00 65.17           C  \n\
ATOM   1995  O   SER A 260       8.275 -53.275 -20.527  1.00 65.57           O  \n\
ATOM   1996  CB  SER A 260       7.708 -55.687 -19.142  1.00 63.43           C  \n\
ATOM   1997  OG  SER A 260       6.810 -56.181 -20.119  1.00 63.29           O  \n\
ATOM   1998  N   GLY A 261       6.134 -52.732 -20.156  1.00 65.55           N  \n\
ATOM   1999  CA  GLY A 261       6.143 -51.865 -21.322  1.00 66.39           C  \n\
ATOM   2000  C   GLY A 261       6.513 -50.410 -21.111  1.00 65.80           C  \n\
ATOM   2001  O   GLY A 261       7.140 -50.028 -20.128  1.00 64.81           O  \n\
ATOM   2002  N   THR A 262       6.110 -49.603 -22.081  1.00 65.69           N  \n\
ATOM   2003  CA  THR A 262       6.326 -48.169 -22.073  1.00 65.64           C  \n\
ATOM   2004  C   THR A 262       4.926 -47.620 -22.292  1.00 65.69           C  \n\
ATOM   2005  O   THR A 262       4.152 -48.214 -23.041  1.00 65.75           O  \n\
ATOM   2006  CB  THR A 262       7.218 -47.748 -23.248  1.00 65.64           C  \n\
ATOM   2007  OG1 THR A 262       6.747 -48.382 -24.444  1.00 67.19           O  \n\
ATOM   2008  CG2 THR A 262       8.665 -48.148 -22.998  1.00 65.36           C  \n\
ATOM   2009  N   ARG A 263       4.586 -46.514 -21.642  1.00 65.76           N  \n\
ATOM   2010  CA  ARG A 263       3.251 -45.942 -21.817  1.00 67.86           C  \n\
ATOM   2011  C   ARG A 263       3.244 -44.768 -22.787  1.00 69.21           C  \n\
ATOM   2012  O   ARG A 263       4.184 -43.978 -22.821  1.00 69.17           O  \n\
ATOM   2013  CB  ARG A 263       2.686 -45.487 -20.473  1.00 66.61           C  \n\
ATOM   2014  CG  ARG A 263       2.526 -46.594 -19.466  1.00 65.55           C  \n\
ATOM   2015  CD  ARG A 263       2.046 -46.044 -18.143  1.00 65.08           C  \n\
ATOM   2016  NE  ARG A 263       0.822 -45.272 -18.279  1.00 64.17           N  \n\
ATOM   2017  CZ  ARG A 263       0.236 -44.641 -17.269  1.00 65.68           C  \n\
ATOM   2018  NH1 ARG A 263       0.773 -44.696 -16.056  1.00 64.57           N  \n\
ATOM   2019  NH2 ARG A 263      -0.887 -43.962 -17.468  1.00 67.96           N  \n\
ATOM   2020  N   ASN A 264       2.167 -44.638 -23.554  1.00 72.27           N  \n\
ATOM   2021  CA  ASN A 264       2.058 -43.552 -24.529  1.00 76.10           C  \n\
ATOM   2022  C   ASN A 264       1.277 -42.330 -24.063  1.00 79.22           C  \n\
ATOM   2023  O   ASN A 264       1.260 -41.303 -24.750  1.00 81.27           O  \n\
ATOM   2024  CB  ASN A 264       1.445 -44.088 -25.810  1.00 75.67           C  \n\
ATOM   2025  CG  ASN A 264       2.157 -45.317 -26.298  1.00 76.61           C  \n\
ATOM   2026  OD1 ASN A 264       3.330 -45.255 -26.670  1.00 75.91           O  \n\
ATOM   2027  ND2 ASN A 264       1.466 -46.458 -26.272  1.00 76.01           N  \n\
ATOM   2028  N   ILE A 265       0.629 -42.439 -22.907  1.00 82.06           N  \n\
ATOM   2029  CA  ILE A 265      -0.131 -41.325 -22.344  1.00 84.11           C  \n\
ATOM   2030  C   ILE A 265      -1.220 -40.863 -23.310  1.00 86.24           C  \n\
ATOM   2031  O   ILE A 265      -1.670 -41.638 -24.156  1.00 87.58           O  \n\
ATOM   2032  CB  ILE A 265       0.787 -40.121 -22.057  1.00 83.16           C  \n\
ATOM   2033  CG1 ILE A 265       2.189 -40.604 -21.674  1.00 82.82           C  \n\
ATOM   2034  CG2 ILE A 265       0.197 -39.286 -20.932  1.00 83.67           C  \n\
ATOM   2035  CD1 ILE A 265       3.221 -39.493 -21.617  1.00 81.75           C  \n\
ATOM   2036  N   GLY A 266      -1.630 -39.598 -23.173  1.00 20.00           N  \n\
ATOM   2037  CA  GLY A 266      -2.659 -38.976 -24.015  1.00 20.00           C  \n\
ATOM   2038  C   GLY A 266      -4.054 -39.615 -23.882  1.00 20.00           C  \n\
ATOM   2039  O   GLY A 266      -4.498 -40.338 -24.780  1.00 20.00           O  \n\
ATOM   2040  N   ILE A 267      -4.734 -39.331 -22.766  1.00 91.02           N  \n\
ATOM   2041  CA  ILE A 267      -6.082 -39.849 -22.459  1.00 91.82           C  \n\
ATOM   2042  C   ILE A 267      -6.817 -40.604 -23.581  1.00 92.67           C  \n\
ATOM   2043  O   ILE A 267      -6.950 -41.835 -23.528  1.00 93.15           O  \n\
ATOM   2044  CB  ILE A 267      -6.970 -38.702 -21.947  1.00 91.08           C  \n\
ATOM   2045  N   GLU A 268      -7.304 -39.857 -24.575  1.00 93.59           N  \n\
ATOM   2046  CA  GLU A 268      -8.038 -40.405 -25.729  1.00 94.19           C  \n\
ATOM   2047  C   GLU A 268      -9.379 -41.044 -25.350  1.00 94.84           C  \n\
ATOM   2048  O   GLU A 268      -9.794 -41.999 -26.055  1.00 94.83           O  \n\
ATOM   2049  CB  GLU A 268      -7.177 -41.428 -26.473  1.00 93.63           C  \n\
TER    2050      GLU A 268                                                      \n\
HETATM 2051  S   SO4 A 901      19.730 -46.063   2.905  1.00 91.64           S  \n\
HETATM 2052  O1  SO4 A 901      19.483 -45.074   3.979  1.00 91.12           O  \n\
HETATM 2053  O2  SO4 A 901      20.799 -46.984   3.334  1.00 92.51           O  \n\
HETATM 2054  O3  SO4 A 901      20.139 -45.379   1.663  1.00 91.55           O  \n\
HETATM 2055  O4  SO4 A 901      18.499 -46.834   2.644  1.00 91.92           O  \n\
HETATM 2056  S   SO4 A 902      26.794 -40.006   4.047  1.00  0.19           S  \n\
HETATM 2057  O1  SO4 A 902      26.344 -40.911   5.125  1.00  0.70           O  \n\
HETATM 2058  O2  SO4 A 902      27.710 -39.010   4.628  1.00  0.63           O  \n\
HETATM 2059  O3  SO4 A 902      25.636 -39.319   3.446  1.00 99.94           O  \n\
HETATM 2060  O4  SO4 A 902      27.487 -40.784   3.002  1.00  0.95           O  \n\
HETATM 2061  S   SO4 A 903      13.826 -56.025  -0.585  1.00 60.11           S  \n\
HETATM 2062  O1  SO4 A 903      13.119 -54.839  -0.046  1.00 58.86           O  \n\
HETATM 2063  O2  SO4 A 903      14.983 -56.360   0.265  1.00 62.25           O  \n\
HETATM 2064  O3  SO4 A 903      14.322 -55.730  -1.943  1.00 60.79           O  \n\
HETATM 2065  O4  SO4 A 903      12.907 -57.179  -0.610  1.00 61.14           O  \n\
HETATM 2066  S   SO4 A 904      10.425 -51.551   4.983  1.00 92.82           S  \n\
HETATM 2067  O1  SO4 A 904      10.644 -50.142   5.348  1.00 93.26           O  \n\
HETATM 2068  O2  SO4 A 904      11.360 -52.397   5.750  1.00 92.05           O  \n\
HETATM 2069  O3  SO4 A 904      10.635 -51.724   3.534  1.00 92.23           O  \n\
HETATM 2070  O4  SO4 A 904       9.042 -51.923   5.310  1.00 92.56           O  \n\
HETATM 2071  S   SO4 A 905      14.223 -58.260   6.546  1.00  0.18           S  \n\
HETATM 2072  O1  SO4 A 905      14.554 -56.824   6.415  1.00  0.08           O  \n\
HETATM 2073  O2  SO4 A 905      14.057 -58.595   7.979  1.00  0.93           O  \n\
HETATM 2074  O3  SO4 A 905      15.297 -59.094   5.971  1.00  0.36           O  \n\
HETATM 2075  O4  SO4 A 905      12.983 -58.546   5.798  1.00  0.30           O  \n\
HETATM 2076  S   SO4 A 906      19.964 -36.328  13.490  1.00  0.70           S  \n\
HETATM 2077  O1  SO4 A 906      20.826 -36.169  14.681  1.00  0.24           O  \n\
HETATM 2078  O2  SO4 A 906      20.779 -36.727  12.323  1.00  0.83           O  \n\
HETATM 2079  O3  SO4 A 906      19.261 -35.058  13.204  1.00  0.39           O  \n\
HETATM 2080  O4  SO4 A 906      18.977 -37.381  13.778  1.00  0.32           O  \n\
HETATM 2081  S   SO4 A 907      -5.465 -57.345   1.304  1.00  0.99           S  \n\
HETATM 2082  O1  SO4 A 907      -5.902 -57.356   2.713  1.00  0.56           O  \n\
HETATM 2083  O2  SO4 A 907      -4.087 -57.871   1.206  1.00  0.59           O  \n\
HETATM 2084  O3  SO4 A 907      -5.482 -55.971   0.771  1.00  0.93           O  \n\
HETATM 2085  O4  SO4 A 907      -6.393 -58.177   0.512  1.00  0.13           O  \n\
HETATM 2086  N   SAH A 887       9.982 -45.960  -1.241  1.00 57.20           N  \n\
HETATM 2087  CA  SAH A 887      11.279 -46.635  -1.274  1.00 58.24           C  \n\
HETATM 2088  CB  SAH A 887      11.915 -46.621   0.124  1.00 57.89           C  \n\
HETATM 2089  CG  SAH A 887      13.077 -45.789   0.205  1.00 60.08           C  \n\
HETATM 2090  SD  SAH A 887      13.843 -45.757   1.844  1.00 63.39           S  \n\
HETATM 2091  C   SAH A 887      11.171 -48.106  -1.781  1.00 57.28           C  \n\
HETATM 2092  O   SAH A 887      10.020 -48.473  -2.081  1.00 57.74           O  \n\
HETATM 2093  OXT SAH A 887      12.016 -48.346  -2.699  1.00 56.32           O  \n\
HETATM 2094  C5' SAH A 887      14.134 -43.989   1.990  1.00 64.02           C  \n\
HETATM 2095  C4' SAH A 887      15.339 -43.440   1.245  1.00 64.25           C  \n\
HETATM 2096  O4' SAH A 887      15.454 -42.026   1.491  1.00 63.78           O  \n\
HETATM 2097  C3' SAH A 887      16.680 -44.029   1.675  1.00 63.74           C  \n\
HETATM 2098  O3' SAH A 887      17.088 -44.973   0.665  1.00 62.65           O  \n\
HETATM 2099  C2' SAH A 887      17.659 -42.847   1.777  1.00 63.56           C  \n\
HETATM 2100  O2' SAH A 887      18.896 -42.955   1.100  1.00 67.28           O  \n\
HETATM 2101  C1' SAH A 887      16.790 -41.678   1.326  1.00 64.34           C  \n\
HETATM 2102  N9  SAH A 887      17.065 -40.402   1.991  1.00 64.73           N  \n\
HETATM 2103  C8  SAH A 887      17.259 -40.135   3.322  1.00 65.49           C  \n\
HETATM 2104  N7  SAH A 887      17.483 -38.871   3.582  1.00 65.89           N  \n\
HETATM 2105  C5  SAH A 887      17.439 -38.251   2.344  1.00 65.44           C  \n\
HETATM 2106  C6  SAH A 887      17.597 -36.892   1.918  1.00 65.21           C  \n\
HETATM 2107  N6  SAH A 887      17.847 -35.890   2.744  1.00 63.88           N  \n\
HETATM 2108  N1  SAH A 887      17.491 -36.613   0.577  1.00 65.00           N  \n\
HETATM 2109  C2  SAH A 887      17.239 -37.635  -0.239  1.00 64.58           C  \n\
HETATM 2110  N3  SAH A 887      17.067 -38.952   0.045  1.00 64.09           N  \n\
HETATM 2111  C4  SAH A 887      17.175 -39.197   1.341  1.00 65.01           C  \n\
HETATM 2112  P   RVP A 300      15.948 -52.492  12.807  1.00 84.03           P  \n\
HETATM 2113  O1P RVP A 300      16.280 -51.797  11.292  1.00 84.84           O  \n\
HETATM 2114  O2P RVP A 300      15.329 -53.824  12.647  1.00 84.79           O  \n\
HETATM 2115  O3P RVP A 300      17.404 -52.390  13.446  1.00 82.98           O  \n\
HETATM 2116  O5' RVP A 300      14.887 -51.702  13.854  1.00 80.59           O  \n\
HETATM 2117  C5' RVP A 300      15.230 -50.333  14.190  1.00 77.86           C  \n\
HETATM 2118  C4' RVP A 300      14.930 -50.268  15.802  1.00 75.95           C  \n\
HETATM 2119  O4' RVP A 300      14.442 -51.336  16.709  1.00 76.20           O  \n\
HETATM 2120  C3' RVP A 300      16.076 -49.713  16.559  1.00 75.13           C  \n\
HETATM 2121  O3' RVP A 300      16.282 -48.343  16.287  1.00 76.81           O  \n\
HETATM 2122  C2' RVP A 300      15.847 -50.010  18.089  1.00 74.13           C  \n\
HETATM 2123  O2' RVP A 300      15.159 -49.070  18.763  1.00 72.51           O  \n\
HETATM 2124  C1' RVP A 300      15.142 -51.479  17.996  1.00 74.35           C  \n\
HETATM 2125  N9  RVP A 300      16.228 -52.668  18.090  1.00 74.28           N  \n\
HETATM 2126  C8  RVP A 300      17.186 -53.074  17.092  1.00 73.52           C  \n\
HETATM 2127  N7  RVP A 300      17.800 -54.122  17.763  1.00 72.16           N  \n\
HETATM 2128  C5  RVP A 300      17.313 -54.387  19.063  1.00 72.67           C  \n\
HETATM 2129  C6  RVP A 300      17.701 -55.312  19.935  1.00 71.93           C  \n\
HETATM 2130  O6  RVP A 300      18.553 -56.264  20.040  1.00 71.08           O  \n\
HETATM 2131  N1  RVP A 300      16.891 -55.267  21.275  1.00 71.07           N  \n\
HETATM 2132  N4  RVP A 300      16.327 -53.455  19.233  1.00 73.15           N  \n\
HETATM 2133  O   HOH A 908      12.657 -45.255  25.263  1.00 51.14           O  \n\
HETATM 2134  O   HOH A 909      14.479 -45.693  28.687  1.00 65.17           O  \n\
HETATM 2135  O   HOH A 910       6.970 -57.025   6.560  1.00 53.38           O  \n\
HETATM 2136  O   HOH A 911       9.352 -65.691  -4.540  1.00 41.68           O  \n\
HETATM 2137  O   HOH A 912       8.112 -58.150  -8.265  1.00 41.52           O  \n\
HETATM 2138  O   HOH A 913      20.199 -64.836  -9.027  1.00 44.81           O  \n\
HETATM 2139  O   HOH A 914      20.840 -56.148 -16.948  1.00 50.99           O  \n\
HETATM 2140  O   HOH A 915       8.497 -48.513   1.421  1.00 50.28           O  \n\
HETATM 2141  O   HOH A 916     -11.502 -50.640   0.340  1.00 50.23           O  \n\
";

var FRAGMENT = io.pdb(PDB_FRAGMENT);

test('parse atom list specification', function(assert) {
  console.log(sp);
  assert.strictEqual(sp.parseAtomNames(null), null);
  assert.strictEqual(sp.parseAtomNames(undefined), null);
  assert.strictEqual(sp.parseAtomNames('all'), null);
  var bb = { 'CA' : true, 'C' : true, 'O' : true, 'N' : true };
  assert.propEqual(sp.parseAtomNames('backbone'), bb);
  assert.propEqual(sp.parseAtomNames('A,B'), 
                   { 'A' : true, 'B' : true });
  assert.propEqual(sp.parseAtomNames(['A', 'B']), 
                   { 'A' : true, 'B' : true });
});


test('filters by specified atom set', function(assert) {
  var inA = FRAGMENT.chains()[0].residueByRnum(266);
  var inB = FRAGMENT.chains()[0].residueByRnum(265);
  var outA = [];
  var outB = [];
  var atomSet = sp.parseAtomNames('CA,CB,O');
  sp.addAtomsPresentInBoth(inA, inB, outA, outB, atomSet);
  assert.strictEqual(outA.length, 2);
  assert.strictEqual(outA[0].name(), 'CA');
  assert.strictEqual(outA[1].name(), 'O');
  assert.strictEqual(outB.length, 2);
  assert.strictEqual(outB[0].name(), 'CA');
  assert.strictEqual(outB[1].name(), 'O');
});

test('only includes atoms present in both residues', function(assert) {
  var inA = FRAGMENT.chains()[0].residueByRnum(266);
  var inB = FRAGMENT.chains()[0].residueByRnum(265);
  var outA = [];
  var outB = [];
  sp.addAtomsPresentInBoth(inA, inB, outA, outB, null);
  assert.strictEqual(outA.length, 4);
  assert.strictEqual(outA[0].name(), 'N');
  assert.strictEqual(outA[1].name(), 'CA');
  assert.strictEqual(outA[2].name(), 'C');
  assert.strictEqual(outA[3].name(), 'O');
  assert.strictEqual(outB.length, 4);
  assert.strictEqual(outA[0].name(), 'N');
  assert.strictEqual(outA[1].name(), 'CA');
  assert.strictEqual(outA[2].name(), 'C');
  assert.strictEqual(outB[3].name(), 'O');
});


test('match residues by index', function(assert) {
  var inA = FRAGMENT.select({rnumRange : [264, 267]});
  var inB = FRAGMENT.select({rnumRange : [265, 268]});
  var matched = sp.matchResiduesByIndex(inA, inB);
  assert.strictEqual(matched[0].atomCount(), 18);
  assert.strictEqual(matched[1].atomCount(), 18);
});

test('match residues by index with subset', function(assert) {
  var inA = FRAGMENT.select({rnumRange : [264, 267]});
  var inB = FRAGMENT.select({rnumRange : [265, 268]});
  var matched = sp.matchResiduesByIndex(inA, inB, 'CA');
  assert.strictEqual(matched[0].atomCount(), 4);
  assert.strictEqual(matched[1].atomCount(), 4);
});

test('match residues by rnum with subset', function(assert) {
  var inA = FRAGMENT.select({rnumRange : [264, 267]});
  var inB = FRAGMENT.select({rnumRange : [265, 268]});
  var matched = sp.matchResiduesByNum(inA, inB, 'CA');
  assert.strictEqual(matched[0].atomCount(), 3);
  assert.strictEqual(matched[1].atomCount(), 3);
});


});
