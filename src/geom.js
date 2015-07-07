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

define(['gl-matrix'], function(glMatrix) {
"use strict";

var vec3 = glMatrix.vec3;
var vec4 = glMatrix.vec4;
var mat3 = glMatrix.mat3;
var quat = glMatrix.quat;

// calculates the signed angle of vectors a and b with respect to
// the reference normal c. 
var signedAngle = (function() {
    var tmp = vec3.create();
    return function(a, b, c) {
      vec3.cross(tmp, a, b);
    return Math.atan2(vec3.dot(tmp, c), vec3.dot(a, b));
  };
})();

// calculate a vector orthogonal to an input vector
var ortho = (function() {
  var tmp = vec3.create();
  return function(out, vec) {
    vec3.copy(tmp, vec);
  if (Math.abs(vec[0]) < Math.abs(vec[1])) {
    if (Math.abs(vec[0]) < Math.abs(vec[2])) {
      tmp[0] += 1;
    } else {
      tmp[2] += 1;
    }
  } else {
    if (Math.abs(vec[1]) < Math.abs(vec[2])) {
      tmp[1] += 1;
    } else {
      tmp[2] += 1;
    }
  }
  return vec3.cross(out, vec, tmp);
  };
})();

// assumes that axis is normalized. don't expect  to get meaningful
// results when it's not
var axisRotation = function(out, axis, angle) {
  var sa = Math.sin(angle), ca = Math.cos(angle), x = axis[0], y = axis[1],
      z = axis[2], xx = x * x, xy = x * y, xz = x * z, yy = y * y, yz = y * z,
      zz = z * z;

  out[0] = xx + ca - xx * ca;
  out[1] = xy - ca * xy - sa * z;
  out[2] = xz - ca * xz + sa * y;
  out[3] = xy - ca * xy + sa * z;
  out[4] = yy + ca - ca * yy;
  out[5] = yz - ca * yz - sa * x;
  out[6] = xz - ca * xz - sa * y;
  out[7] = yz - ca * yz + sa * x;
  out[8] = zz + ca - ca * zz;
  return out;
};

var cubicHermiteInterpolate = (function() {
  var p = vec3.create();
  return function(out, p_k, m_k, p_kp1, m_kp1, t, index) {
    var tt = t * t;
  var three_minus_two_t = 3.0 - 2.0 * t;
  var h01 = tt * three_minus_two_t;
  var h00 = 1.0 - h01;
  var h10 = tt * (t - 2.0) + t;
  var h11 = tt * (t - 1.0);
  vec3.copy(p, p_k);
  vec3.scale(p, p, h00);
  vec3.scaleAndAdd(p, p, m_k, h10);
  vec3.scaleAndAdd(p, p, p_kp1, h01);
  vec3.scaleAndAdd(p, p, m_kp1, h11);
  out[index] = p[0];
  out[index + 1] = p[1];
  out[index + 2] = p[2];
};
})();

// returns the number of interpolation points for the given settings
function catmullRomSplineNumPoints(numPoints, subdiv, circular) {
  if (circular) {
    return numPoints * subdiv;
  } else {
    return subdiv * (numPoints - 1) + 1;
  }
}
// interpolates the given list of points (stored in a Float32Array) with a
// Cubic Hermite spline using the method of Catmull and Rom to calculate the
// tangents.
function catmullRomSpline(points, numPoints, num, strength, circular,
                          float32BufferPool) {
  circular = circular || false;
  strength = strength || 0.5;
  var out = null;
  var outLength = catmullRomSplineNumPoints(numPoints, num, circular) * 3;
  if (float32BufferPool) {
    out = float32BufferPool.request(outLength);
  } else {
    out = new Float32Array(outLength);
  }
  var index = 0;
  var delta_t = 1.0 / num;
  var m_k = vec3.create(), m_kp1 = vec3.create(); // tangents at k-1 and k+1
  var p_k = vec3.create(), p_kp1 = vec3.create(), p_kp2 = vec3.create(),
      p_kp3 = vec3.create();
  var i, j, e;

  vec3.set(p_kp1, points[0], points[1], points[2]);
  vec3.set(p_kp2, points[3], points[4], points[5]);
  if (circular) {
    vec3.set(p_k, points[points.length - 3], points[points.length - 2],
             points[points.length - 1]);
    vec3.sub(m_k, p_kp2, p_k);
    vec3.scale(m_k, m_k, strength);
  } else {
    vec3.set(p_k, points[0], points[1], points[2]);
    vec3.set(m_k, 0, 0, 0);
  }
  for (i = 1, e = numPoints - 1; i < e; ++i) {
    vec3.set(p_kp3, points[3 * (i + 1)], points[3 * (i + 1) + 1],
             points[3 * (i + 1) + 2]);
    vec3.sub(m_kp1, p_kp3, p_kp1);
    vec3.scale(m_kp1, m_kp1, strength);
    for (j = 0; j < num; ++j) {
      cubicHermiteInterpolate(out, p_kp1, m_k, p_kp2, m_kp1, delta_t * j,
                              index);
      index += 3;
    }
    vec3.copy(p_k, p_kp1);
    vec3.copy(p_kp1, p_kp2);
    vec3.copy(p_kp2, p_kp3);
    vec3.copy(m_k, m_kp1);
  }
  if (circular) {
    vec3.set(p_kp3, points[0], points[1], points[3]);
    vec3.sub(m_kp1, p_kp3, p_kp1);
    vec3.scale(m_kp1, m_kp1, strength);
  } else {
    vec3.set(m_kp1, 0, 0, 0);
  }
  for (j = 0; j < num; ++j) {
    cubicHermiteInterpolate(out, p_kp1, m_k, p_kp2, m_kp1, delta_t * j, index);
    index += 3;
  }
  if (!circular) {
    out[index] = points[3 * (numPoints - 1) + 0];
    out[index + 1] = points[3 * (numPoints - 1) + 1];
    out[index + 2] = points[3 * (numPoints - 1) + 2];
    return out;
  }
  vec3.copy(p_k, p_kp1);
  vec3.copy(p_kp1, p_kp2);
  vec3.copy(p_kp2, p_kp3);
  vec3.copy(m_k, m_kp1);
  vec3.set(p_kp3, points[3], points[4], points[5]);
  vec3.sub(m_kp1, p_kp3, p_kp1);
  vec3.scale(m_kp1, m_kp1, strength);
  for (j = 0; j < num; ++j) {
    cubicHermiteInterpolate(out, p_kp1, m_k, p_kp2, m_kp1, delta_t * j, index);
    index += 3;
  }
  return out;
}

function Sphere(center, radius) {
  this._center = center || vec3.create();
  this._radius = radius || 1.0;
}


// returns a quaternion which, when converted to matrix form, contains the 
// eigen-vectors of the symmetric matrix "a".
// 
// Code adapted from http://www.melax.com/diag/
var diagonalizer = (function() { 
  var Q = mat3.create();
  var D = mat3.create();
  var tmp1 = mat3.create();
  var tmp2 = mat3.create();
  var jr = quat.create();
  var offDiag = vec3.create();
  var magOffDiag = vec3.create();
  return function(a) {
    var maxsteps = 24;  // certainly wont need that many.
    var q = quat.fromValues(0,0,0,1);
    for(var i = 0; i < maxsteps; ++i) {
      mat3.fromQuat(Q, q); // v*Q == q*v*conj(q)
      var transQ = mat3.transpose(tmp1, Q);
      mat3.mul(D, Q, mat3.mul(tmp2, a, transQ));
      vec3.set(offDiag, D[5], D[2], D[1]);
      vec3.set(magOffDiag, Math.abs(offDiag[0]), Math.abs(offDiag[1]), 
               Math.abs(offDiag[2]));
      // get index of largest element off-diagonal element
      var k = (magOffDiag[0] > magOffDiag[1] &&
               magOffDiag[0] > magOffDiag[2]) ? 0 : 
              (magOffDiag[1] > magOffDiag[2]) ? 1 : 2;
      var k1 = (k + 1) % 3;
      var k2 = (k + 2) % 3;
      if (offDiag[k] === 0.0)  {
        break;  // diagonal already
      }
      var thet = (D[k2 * 3 + k2] - D[k1 * 3 + k1]) / (2.0 * offDiag[k]);
      var sgn = (thet > 0.0) ? 1.0 : -1.0;
      thet *= sgn; // make it positive
      var div = (thet + ((thet < 1.E6) ? Math.sqrt(thet * thet + 1.0) : thet));
      var t = sgn / div;
      var c = 1.0 / Math.sqrt(t * t + 1.0); 
      if(c === 1.0) {
        // no room for improvement - reached machine precision.
        break;
      }  
      vec4.set(jr, 0, 0, 0, 0); // jacobi rotation for this iteration.
      // using 1/2 angle identity sin(a/2) = sqrt((1-cos(a))/2)  
      jr[k] = sgn * Math.sqrt((1.0 - c) / 2.0);  
      // since our quat-to-matrix convention was for v*M instead of M*v
      jr[k] *= -1.0; 
      jr[3]  = Math.sqrt(1.0 - jr[k] * jr[k]);
      if (jr[3] === 1.0)  { 
        break; // reached limits of floating point precision
      }
      q =  quat.mul(q, q, jr);
      quat.normalize(q, q);
    } 
    return q;
  };
})();

Sphere.prototype.center = function() { return this._center; };
Sphere.prototype.radius = function() { return this._radius; };

// derive a rotation matrix which rotates the z-axis onto tangent. when
// left is given and use_hint is true, x-axis is chosen to be as close
// as possible to left.
//
// upon returning, left will be modified to contain the updated left
// direction.
var buildRotation = (function() {
  return function(rotation, tangent, left, up, use_left_hint) {
    if (use_left_hint) { vec3.cross(up, tangent, left);
    } else {
      ortho(up, tangent);
    }

    vec3.cross(left, up, tangent);
    vec3.normalize(up, up);
    vec3.normalize(left, left);
    rotation[0] = left[0];
    rotation[1] = left[1];
    rotation[2] = left[2];

    rotation[3] = up[0];
    rotation[4] = up[1];
    rotation[5] = up[2];

    rotation[6] = tangent[0];
    rotation[7] = tangent[1];
    rotation[8] = tangent[2];
}
;
})();

// linearly interpolates the array of values and returns it as an Float32Array
function interpolateScalars(values, num) {
  var out = new Float32Array(num*(values.length-1) + 1);
  var index = 0;
  var bf = 0.0, af = 0.0;
  var delta = 1/num;
  for (var i = 0; i < values.length-1; ++i) {
    bf = values[i];
    af = values[i + 1];
    for (var j = 0; j < num; ++j) {
      var t = delta * j;
      out[index+0] = bf*(1-t)+af*t;
      index+=1;
    }
  }
  out[index+0] = af;
  return out;
}

return {
  signedAngle : signedAngle,
  axisRotation : axisRotation,
  ortho : ortho,
  diagonalizer : diagonalizer,
  catmullRomSpline : catmullRomSpline,
  cubicHermiteInterpolate : cubicHermiteInterpolate,
  interpolateScalars : interpolateScalars,
  catmullRomSplineNumPoints : catmullRomSplineNumPoints,
  Sphere : Sphere,
  buildRotation : buildRotation
};

});

