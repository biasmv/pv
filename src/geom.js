// Copyright (c) 2013-2014 Marco Biasini
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

var geom = (function() {
  "use strict";
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

Sphere.prototype.center = function() { return this._center; };
Sphere.prototype.radius = function() { return this._radius; };

return {
  signedAngle : signedAngle,
  axisRotation : axisRotation,
  ortho : ortho,
  catmullRomSpline : catmullRomSpline,
  cubicHermiteInterpolate : cubicHermiteInterpolate,
  catmullRomSplineNumPoints : catmullRomSplineNumPoints,
  Sphere : Sphere
};

})();

if(typeof(exports) !== 'undefined') {
  module.exports = geom;
}
