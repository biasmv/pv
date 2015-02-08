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

define(['gl-matrix', 'geom'], function(glMatrix, geom) {

"use strict";

var vec3 = glMatrix.vec3;
var mat3 = glMatrix.mat3;

var calculateCovariance = (function() {
  var center = vec3.create();
  var shiftedPos = vec3.create();
  return function(go, covariance) {
    vec3.set(center, 0, 0, 0);
    var atomCount = 0;
    go.eachCentralAtom(function(atom, transformedPos) {
      vec3.add(center, center, transformedPos);
      atomCount += 1;
    });
    if (atomCount === 0) {
      return;
    }
    vec3.scale(center, center, 1.0/atomCount);
    covariance[0] = 0; covariance[1] = 0; covariance[2] = 0;
    covariance[3] = 0; covariance[4] = 0; covariance[5] = 0;
    covariance[6] = 0; covariance[7] = 0; covariance[8] = 0;
    go.eachCentralAtom(function(atom, transformedPos) {
      vec3.sub(shiftedPos, transformedPos, center);
      var x = shiftedPos[0], y = shiftedPos[1], z = shiftedPos[2];
      // No need to fill in covariance[3]/covariance[6]/covariance[7], the
      // matrix is symmetric.
      covariance[0] += y * y + z * z;
      covariance[1] -= x * y;
      covariance[2] -= x * z;
      covariance[5] -= y * z;
      covariance[4] += x * x + z * z;
      covariance[8] += x * x + y * y;
    });
    covariance[3] = covariance[1];
    covariance[6] = covariance[2];
    covariance[7] = covariance[5];
  };
})();

var principalAxes = (function() {
  var covariance =  mat3.create();
  var diag = mat3.create();
  var min = vec3.create();
  var max = vec3.create();
  var projected = vec3.create();
  var range = vec3.create();
  var x = vec3.create();
  var y = vec3.create();
  var z = vec3.create();
  return function(go) {
    calculateCovariance(go, covariance);
    var q = geom.diagonalizer(covariance);
    mat3.fromQuat(diag, q);
    var first = true;
    go.eachCentralAtom(function(atom, transformedPos) {
      vec3.transformMat3(projected, transformedPos, diag);
      if (first) {
        vec3.copy(min, projected);
        vec3.copy(max, projected);
        first = false;
      } else {
        vec3.min(min, min, projected);
        vec3.max(max, max, projected);
      }
    });
    vec3.sub(range, max, min);
    var axes = [ [range[0], 0], [range[1], 1], [range[2], 2] ];
    axes.sort(function(a, b) {
      return b[0] - a[0]; 
    });
    var xIndex = axes[0][1];
    var yIndex = axes[1][1];
    vec3.set(x, diag[xIndex + 0], diag[xIndex + 3], diag[xIndex + 6]);
    vec3.set(y, diag[yIndex + 0], diag[yIndex + 3], diag[yIndex + 6]);
    vec3.cross(z, x, y);
    var rotation = mat3.create();
    rotation[0] = x[0]; rotation[1] = y[0]; rotation[2] = z[0];
    rotation[3] = x[1]; rotation[4] = y[1]; rotation[5] = z[1];
    rotation[6] = x[2]; rotation[7] = y[2]; rotation[8] = z[2];
    return rotation;
  };
})();

return {
  principalAxes :principalAxes
};

});
