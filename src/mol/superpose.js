// Copyright (c) 2013-2015 Marco Biasini
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to 
// deal in the Software without restriction, including without limitation the 
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
// sell copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
// DEALINGS IN THE SOFTWARE.

define(['gl-matrix', '../svd', 'utils', '../geom', './mol'], 
       function(glMatrix, svd, utils, geom, mol) {

"use strict";

var vec3 = glMatrix.vec3;
var mat3 = glMatrix.mat3;
var quat = glMatrix.quat;

var calculateCenter = function(atoms, center) {
    vec3.set(center, 0, 0, 0);
    if (atoms.length === 0) {
      return;
    }
    for (var i = 0; i < atoms.length; ++i) {
      var atom = atoms[i];
      vec3.add(center, center, atom.pos());
    }
    vec3.scale(center, center, 1.0/atoms.length);
};


// calculate a covariance matrix from the deviations of the atoms of the subject
// and reference structure.
var calculateCov = (function() {
  var shiftedSubject = vec3.create();
  var shiftedReference = vec3.create();
  return function(subjectAtoms, referenceAtoms, subjectCenter, 
                  referenceCenter, covariance) {
      covariance[0] = 0; covariance[1] = 0; covariance[2] = 0;
      covariance[3] = 0; covariance[4] = 0; covariance[5] = 0;
      covariance[6] = 0; covariance[7] = 0; covariance[8] = 0;
      for (var i = 0; i < referenceAtoms.length; ++i) {
        vec3.sub(shiftedSubject, subjectAtoms[i].pos(), subjectCenter);
        vec3.sub(shiftedReference, referenceAtoms[i].pos(), referenceCenter);

        var ss = shiftedSubject
        var sr = shiftedReference;
        covariance[0] += ss[0] * sr[0]
        covariance[1] += ss[0] * sr[1];
        covariance[2] += ss[0] * sr[2];

        covariance[3] += ss[1] * sr[0];
        covariance[4] += ss[1] * sr[1];
        covariance[5] += ss[1] * sr[2];

        covariance[6] += ss[2] * sr[0];
        covariance[7] += ss[2] * sr[1];
        covariance[8] += ss[2] * sr[2];
      };
  };
})();

var superpose = (function() {
  var referenceCenter = vec3.create();
  var subjectCenter = vec3.create();
  var shiftedPos = vec3.create();
  var rotation = mat3.create();
  var cov = mat3.create();
  var tmp = mat3.create();
  var uMat = mat3.create();
  var vMat = mat3.create();
  return function(structure, reference) {
    var subjectAtoms = structure.atoms();
    var referenceAtoms = reference.atoms();
    calculateCenter(referenceAtoms, referenceCenter);
    calculateCenter(subjectAtoms, subjectCenter);
    if (subjectAtoms.length !== referenceAtoms.length) {
      console.error('atom counts do not match (' + 
                    subjectAtoms.length + 'in structure vs ' + 
                    referenceAtoms.length + ' in reference)');
      return null;
    }
    calculateCov(subjectAtoms, referenceAtoms, subjectCenter, 
                 referenceCenter, cov);
    // the SVD implementation assumes nested arrays as inputs instead of linear
    // arrays of length 9, so we need to convert between the two formats.
    var input = [ 
      [ cov[0], cov[1], cov[2] ], 
      [ cov[3], cov[4], cov[5] ], 
      [ cov[6], cov[7], cov[8] ]
    ];
    var u = [[], [], []];
    var v = [[], [], []];
    var decomp = svd(input);
    uMat[0] = decomp.U[0][0];
    uMat[1] = decomp.U[0][1];
    uMat[2] = decomp.U[0][2];
    uMat[3] = decomp.U[1][0];
    uMat[4] = decomp.U[1][1];
    uMat[5] = decomp.U[1][2];
    uMat[6] = decomp.U[2][0];
    uMat[7] = decomp.U[2][1];
    uMat[8] = decomp.U[2][2];
    var detU = mat3.determinant(uMat);
    vMat[0] = decomp.V[0][0];
    vMat[1] = decomp.V[0][1];
    vMat[2] = decomp.V[0][2];
    vMat[3] = decomp.V[1][0];
    vMat[4] = decomp.V[1][1];
    vMat[5] = decomp.V[1][2];
    vMat[6] = decomp.V[2][0];
    vMat[7] = decomp.V[2][1];
    vMat[8] = decomp.V[2][2];
    var detV = mat3.determinant(vMat);
    mat3.identity(tmp);
    // in case the products of the determinant are smaller than zero, flip 
    // one of the axis. If we don't do this, the resulting matrix is not a 
    // rotation but a mirroring.
    if (detU * detV < 0.0) {
      console.log('determinants smaller than zero!');
      tmp[8] = -1;
      mat3.mul(uMat, uMat, tmp);
    }
    mat3.mul(rotation, mat3.transpose(vMat, vMat), uMat);
    mat3.transpose(rotation, rotation);
    // apply transformation to all atoms
    var allAtoms = structure.full().atoms();
    for (var i = 0; i < allAtoms.length; ++i) {
      var atom = allAtoms[i];
      vec3.sub(shiftedPos, atom.pos(), subjectCenter);
      vec3.transformMat3(shiftedPos, shiftedPos, rotation);
      vec3.add(shiftedPos, referenceCenter, shiftedPos);
      atom.setPos(shiftedPos);
    }
  };
})();

return superpose;

});

