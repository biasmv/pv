/**
 * PV - WebGL protein viewer v1.9.0dev
 * http://biasmv.github.io/pv
 * 
 * Copyright 2013-2015 Marco Biasini
 * Released under the MIT license
 */

  (function (root, factory) {
      if (typeof define === 'function' && define.amd) {
          define([], factory);
      } else if (typeof exports === 'object') { 
        exports = factory(); 
        if (typeof module === 'object') { 
          module.exports = exports; 
        } 
      } else {
          var pv = factory();
          root.pv = pv;
          root.io = pv.io;
          root.mol = pv.mol;
          root.color = pv.color;
          root.rgb = pv.rgb;
          root.viewpoint = pv.viewpoint;
          root.vec3 = pv.vec3;
          root.vec4 = pv.vec4;
          root.mat3 = pv.mat3;
          root.mat4 = pv.mat4;
          root.quat = pv.quat;
      }
  }(this, function () {
      // modules will be inlined here
  var glMatrix, color, uniqueObjectIdPool, utils, gfxCanvas, gfxFramebuffer, bufferAllocators, gfxCam, gfxShaders, touch, mouse, geom, gfxSceneNode, gfxBaseGeom, gfxVertexArrayBase, gfxVertexArray, gfxIndexedVertexArray, gfxChainData, gfxMeshGeom, gfxBillboardGeom, gfxLineGeom, gfxGeomBuilders, gfxVertAssoc, gfxRender, gfxLabel, gfxCustomMesh, gfxAnimation, slab, viewer, molSymmetry, molAtom, molResidue, molTrace, molChain, molBond, molSelect, molMol, svd, molSuperpose, molAll, io, viewpoint, traj, pv, SceneNode, VertexArrayBase, IndexedVertexArray, BaseGeom, MeshGeom, mol;
glMatrix = function () {
  var exports = {};
  if (!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
  }
  if (!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
  }
  if (!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
  }
  var glMatrix = {};
  glMatrix.setMatrixArrayType = function (type) {
    GLMAT_ARRAY_TYPE = type;
  };
  exports.glMatrix = glMatrix;
  var vec3 = {};
  vec3.create = function () {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
  };
  vec3.clone = function (a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  };
  vec3.fromValues = function (x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  };
  vec3.copy = function (out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  };
  vec3.set = function (out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  };
  vec3.add = function (out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  };
  vec3.subtract = function (out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  };
  vec3.sub = vec3.subtract;
  vec3.multiply = function (out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  };
  vec3.mul = vec3.multiply;
  vec3.divide = function (out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  };
  vec3.div = vec3.divide;
  vec3.min = function (out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
  };
  vec3.max = function (out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
  };
  vec3.scale = function (out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  };
  vec3.scaleAndAdd = function (out, a, b, scale) {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    return out;
  };
  vec3.distance = function (a, b) {
    var x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  };
  vec3.dist = vec3.distance;
  vec3.squaredDistance = function (a, b) {
    var x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2];
    return x * x + y * y + z * z;
  };
  vec3.sqrDist = vec3.squaredDistance;
  vec3.length = function (a) {
    var x = a[0], y = a[1], z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  };
  vec3.len = vec3.length;
  vec3.squaredLength = function (a) {
    var x = a[0], y = a[1], z = a[2];
    return x * x + y * y + z * z;
  };
  vec3.sqrLen = vec3.squaredLength;
  vec3.negate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  };
  vec3.normalize = function (out, a) {
    var x = a[0], y = a[1], z = a[2];
    var len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
    }
    return out;
  };
  vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  };
  vec3.cross = function (out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  };
  vec3.lerp = function (out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  };
  vec3.random = function (out, scale) {
    scale = scale || 1;
    var r = GLMAT_RANDOM() * 2 * Math.PI;
    var z = GLMAT_RANDOM() * 2 - 1;
    var zScale = Math.sqrt(1 - z * z) * scale;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
  };
  vec3.transformMat4 = function (out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
  };
  vec3.transformMat3 = function (out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  };
  vec3.transformQuat = function (out, a, q) {
    var x = a[0], y = a[1], z = a[2], qx = q[0], qy = q[1], qz = q[2], qw = q[3], ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
  };
  vec3.forEach = function () {
    var vec = vec3.create();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 3;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
      }
      return a;
    };
  }();
  vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
  };
  exports.vec3 = vec3;
  var vec4 = {};
  vec4.create = function () {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
  };
  vec4.clone = function (a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  };
  vec4.fromValues = function (x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  };
  vec4.copy = function (out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  };
  vec4.set = function (out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  };
  vec4.add = function (out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
  };
  vec4.subtract = function (out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
  };
  vec4.sub = vec4.subtract;
  vec4.multiply = function (out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
  };
  vec4.mul = vec4.multiply;
  vec4.divide = function (out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
  };
  vec4.div = vec4.divide;
  vec4.min = function (out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
  };
  vec4.max = function (out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
  };
  vec4.scale = function (out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
  };
  vec4.scaleAndAdd = function (out, a, b, scale) {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    out[3] = a[3] + b[3] * scale;
    return out;
  };
  vec4.distance = function (a, b) {
    var x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2], w = b[3] - a[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
  };
  vec4.dist = vec4.distance;
  vec4.squaredDistance = function (a, b) {
    var x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2], w = b[3] - a[3];
    return x * x + y * y + z * z + w * w;
  };
  vec4.sqrDist = vec4.squaredDistance;
  vec4.length = function (a) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
  };
  vec4.len = vec4.length;
  vec4.squaredLength = function (a) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    return x * x + y * y + z * z + w * w;
  };
  vec4.sqrLen = vec4.squaredLength;
  vec4.negate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
  };
  vec4.normalize = function (out, a) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    var len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
      out[3] = a[3] * len;
    }
    return out;
  };
  vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  };
  vec4.lerp = function (out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
  };
  vec4.random = function (out, scale) {
    scale = scale || 1;
    out[0] = GLMAT_RANDOM();
    out[1] = GLMAT_RANDOM();
    out[2] = GLMAT_RANDOM();
    out[3] = GLMAT_RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
  };
  vec4.transformMat4 = function (out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
  };
  vec4.transformQuat = function (out, a, q) {
    var x = a[0], y = a[1], z = a[2], qx = q[0], qy = q[1], qz = q[2], qw = q[3], ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
  };
  vec4.forEach = function () {
    var vec = vec4.create();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 4;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        vec[3] = a[i + 3];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
        a[i + 3] = vec[3];
      }
      return a;
    };
  }();
  vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
  };
  exports.vec4 = vec4;
  var mat3 = {};
  mat3.create = function () {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  };
  mat3.fromMat4 = function (out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  };
  mat3.clone = function (a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  };
  mat3.copy = function (out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  };
  mat3.identity = function (out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  };
  mat3.transpose = function (out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a12 = a[5];
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a01;
      out[5] = a[7];
      out[6] = a02;
      out[7] = a12;
    } else {
      out[0] = a[0];
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a[1];
      out[4] = a[4];
      out[5] = a[7];
      out[6] = a[2];
      out[7] = a[5];
      out[8] = a[8];
    }
    return out;
  };
  mat3.invert = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], b01 = a22 * a11 - a12 * a21, b11 = -a22 * a10 + a12 * a20, b21 = a21 * a10 - a11 * a20, det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  };
  mat3.adjoint = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8];
    out[0] = a11 * a22 - a12 * a21;
    out[1] = a02 * a21 - a01 * a22;
    out[2] = a01 * a12 - a02 * a11;
    out[3] = a12 * a20 - a10 * a22;
    out[4] = a00 * a22 - a02 * a20;
    out[5] = a02 * a10 - a00 * a12;
    out[6] = a10 * a21 - a11 * a20;
    out[7] = a01 * a20 - a00 * a21;
    out[8] = a00 * a11 - a01 * a10;
    return out;
  };
  mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8];
    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
  };
  mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], b00 = b[0], b01 = b[1], b02 = b[2], b10 = b[3], b11 = b[4], b12 = b[5], b20 = b[6], b21 = b[7], b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  };
  mat3.mul = mat3.multiply;
  mat3.translate = function (out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  };
  mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;
    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
  };
  mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[3] = xy + wz;
    out[6] = xz - wy;
    out[1] = xy - wz;
    out[4] = 1 - (xx + zz);
    out[7] = yz + wx;
    out[2] = xz + wy;
    out[5] = yz - wx;
    out[8] = 1 - (xx + yy);
    return out;
  };
  mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return out;
  };
  mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ')';
  };
  exports.mat3 = mat3;
  var mat4 = {};
  mat4.create = function () {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  };
  mat4.fromValues = function (m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m10;
    out[2] = m20, out[3] = m30;
    out[4] = m01;
    out[5] = m11;
    out[6] = m21;
    out[7] = m31;
    out[8] = m02;
    out[9] = m12;
    out[10] = m22;
    out[11] = m32;
    out[12] = m03;
    out[13] = m13;
    out[14] = m23;
    out[15] = m33;
    return out;
  };
  mat4.clone = function (a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  };
  mat4.copy = function (out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  };
  mat4.identity = function (out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  };
  mat4.transpose = function (out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a03 = a[3], a12 = a[6], a13 = a[7], a23 = a[11];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = a[0];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a[1];
      out[5] = a[5];
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a[2];
      out[9] = a[6];
      out[10] = a[10];
      out[11] = a[14];
      out[12] = a[3];
      out[13] = a[7];
      out[14] = a[11];
      out[15] = a[15];
    }
    return out;
  };
  mat4.invert = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  };
  mat4.adjoint = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
    out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
    out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
    out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
    out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
    out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
    return out;
  };
  mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  };
  mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  };
  mat4.fromMat3 = function (out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = 0;
    out[4] = a[3];
    out[5] = a[4];
    out[6] = a[5];
    out[7] = 0;
    out[8] = a[6];
    out[9] = a[7];
    out[10] = a[8];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  };
  mat4.mul = mat4.multiply;
  mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2], a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  };
  mat4.scale = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  };
  mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2], len = Math.sqrt(x * x + y * y + z * z), s, c, t, a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, b00, b01, b02, b10, b11, b12, b20, b21, b22;
    if (Math.abs(len) < GLMAT_EPSILON) {
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  };
  mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad), c = Math.cos(rad), a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  };
  mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad), c = Math.cos(rad), a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) {
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
  };
  mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad), c = Math.cos(rad), a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    if (a !== out) {
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
  };
  mat4.fromRotationTranslation = function (out, q, v) {
    var x = q[0], y = q[1], z = q[2], w = q[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  };
  mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  };
  mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left), tb = 1 / (top - bottom), nf = 1 / (near - far);
    out[0] = near * 2 * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = near * 2 * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near * 2 * nf;
    out[15] = 0;
    return out;
  };
  mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  };
  mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right), bt = 1 / (bottom - top), nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  };
  mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len, eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2], centerx = center[0], centery = center[1], centerz = center[2];
    if (Math.abs(eyex - centerx) < GLMAT_EPSILON && Math.abs(eyey - centery) < GLMAT_EPSILON && Math.abs(eyez - centerz) < GLMAT_EPSILON) {
      return mat4.identity(out);
    }
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len;
      x1 *= len;
      x2 *= len;
    }
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len;
      y1 *= len;
      y2 *= len;
    }
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  };
  mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
  };
  exports.mat4 = mat4;
  var quat = {};
  quat.create = function () {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  };
  quat.rotationTo = function () {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1, 0, 0);
    var yUnitVec3 = vec3.fromValues(0, 1, 0);
    return function (out, a, b) {
      var dot = vec3.dot(a, b);
      if (dot < -0.999999) {
        vec3.cross(tmpvec3, xUnitVec3, a);
        if (vec3.length(tmpvec3) < 0.000001)
          vec3.cross(tmpvec3, yUnitVec3, a);
        vec3.normalize(tmpvec3, tmpvec3);
        quat.setAxisAngle(out, tmpvec3, Math.PI);
        return out;
      } else if (dot > 0.999999) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
      } else {
        vec3.cross(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot;
        return quat.normalize(out, out);
      }
    };
  }();
  quat.setAxes = function () {
    var matr = mat3.create();
    return function (out, view, right, up) {
      matr[0] = right[0];
      matr[3] = right[1];
      matr[6] = right[2];
      matr[1] = up[0];
      matr[4] = up[1];
      matr[7] = up[2];
      matr[2] = view[0];
      matr[5] = view[1];
      matr[8] = view[2];
      return quat.normalize(out, quat.fromMat3(out, matr));
    };
  }();
  quat.clone = vec4.clone;
  quat.fromValues = vec4.fromValues;
  quat.copy = vec4.copy;
  quat.set = vec4.set;
  quat.identity = function (out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  };
  quat.setAxisAngle = function (out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  };
  quat.add = vec4.add;
  quat.multiply = function (out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  };
  quat.mul = quat.multiply;
  quat.scale = vec4.scale;
  quat.rotateX = function (out, a, rad) {
    rad *= 0.5;
    var ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
  };
  quat.rotateY = function (out, a, rad) {
    rad *= 0.5;
    var ax = a[0], ay = a[1], az = a[2], aw = a[3], by = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
  };
  quat.rotateZ = function (out, a, rad) {
    rad *= 0.5;
    var ax = a[0], ay = a[1], az = a[2], aw = a[3], bz = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
  };
  quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1 - x * x - y * y - z * z));
    return out;
  };
  quat.dot = vec4.dot;
  quat.lerp = vec4.lerp;
  quat.slerp = function (out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
    var omega, cosom, sinom, scale0, scale1;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (1 - cosom > 0.000001) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  };
  quat.invert = function (out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3, invDot = dot ? 1 / dot : 0;
    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
  };
  quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
  };
  quat.length = vec4.length;
  quat.len = quat.length;
  quat.squaredLength = vec4.squaredLength;
  quat.sqrLen = quat.squaredLength;
  quat.normalize = vec4.normalize;
  quat.fromMat3 = function () {
    var s_iNext = typeof Int8Array !== 'undefined' ? new Int8Array([
      1,
      2,
      0
    ]) : [
      1,
      2,
      0
    ];
    return function (out, m) {
      var fTrace = m[0] + m[4] + m[8];
      var fRoot;
      if (fTrace > 0) {
        fRoot = Math.sqrt(fTrace + 1);
        out[3] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[0] = (m[7] - m[5]) * fRoot;
        out[1] = (m[2] - m[6]) * fRoot;
        out[2] = (m[3] - m[1]) * fRoot;
      } else {
        var i = 0;
        if (m[4] > m[0])
          i = 1;
        if (m[8] > m[i * 3 + i])
          i = 2;
        var j = s_iNext[i];
        var k = s_iNext[j];
        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[k * 3 + j] - m[j * 3 + k]) * fRoot;
        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
      }
      return out;
    };
  }();
  quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
  };
  exports.quat = quat;
  return exports;
}();
color = function () {
  var vec4 = glMatrix.vec4;
  var exports = {};
  exports.rgb = {};
  var rgb = exports.rgb;
  exports.rgb.create = vec4.create;
  exports.rgb.scale = vec4.scale;
  exports.rgb.copy = vec4.copy;
  exports.rgb.clone = vec4.clone;
  exports.rgb.fromValues = vec4.fromValues;
  exports.rgb.mix = function (out, colorOne, colorTwo, t) {
    var oneMinusT = 1 - t;
    out[0] = colorOne[0] * t + colorTwo[0] * oneMinusT;
    out[1] = colorOne[1] * t + colorTwo[1] * oneMinusT;
    out[2] = colorOne[2] * t + colorTwo[2] * oneMinusT;
    out[3] = colorOne[3] * t + colorTwo[3] * oneMinusT;
    return out;
  };
  var COLORS = {
    white: rgb.fromValues(1, 1, 1, 1),
    black: rgb.fromValues(0, 0, 0, 1),
    grey: rgb.fromValues(0.5, 0.5, 0.5, 1),
    lightgrey: rgb.fromValues(0.8, 0.8, 0.8, 1),
    darkgrey: rgb.fromValues(0.3, 0.3, 0.3, 1),
    red: rgb.fromValues(1, 0, 0, 1),
    darkred: rgb.fromValues(0.5, 0, 0, 1),
    lightred: rgb.fromValues(1, 0.5, 0.5, 1),
    green: rgb.fromValues(0, 1, 0, 1),
    darkgreen: rgb.fromValues(0, 0.5, 0, 1),
    lightgreen: rgb.fromValues(0.5, 1, 0.5, 1),
    blue: rgb.fromValues(0, 0, 1, 1),
    darkblue: rgb.fromValues(0, 0, 0.5, 1),
    lightblue: rgb.fromValues(0.5, 0.5, 1, 1),
    yellow: rgb.fromValues(1, 1, 0, 1),
    darkyellow: rgb.fromValues(0.5, 0.5, 0, 1),
    lightyellow: rgb.fromValues(1, 1, 0.5, 1),
    cyan: rgb.fromValues(0, 1, 1, 1),
    darkcyan: rgb.fromValues(0, 0.5, 0.5, 1),
    lightcyan: rgb.fromValues(0.5, 1, 1, 1),
    magenta: rgb.fromValues(1, 0, 1, 1),
    darkmagenta: rgb.fromValues(0.5, 0, 0.5, 1),
    lightmagenta: rgb.fromValues(1, 0.5, 1, 1),
    orange: rgb.fromValues(1, 0.5, 0, 1),
    darkorange: rgb.fromValues(0.5, 0.25, 0, 1),
    lightorange: rgb.fromValues(1, 0.75, 0.5, 1)
  };
  exports.hex2rgb = function (color, alpha) {
    alpha = alpha === undefined ? 1 : +alpha;
    var r, g, b, a;
    if (color.length === 4 || color.length === 5) {
      r = parseInt(color[1], 16);
      g = parseInt(color[2], 16);
      b = parseInt(color[3], 16);
      a = Math.round(alpha * 15);
      if (color.length === 5) {
        a = parseInt(color[4], 16);
      }
      var oneOver15 = 1 / 15;
      return rgb.fromValues(oneOver15 * r, oneOver15 * g, oneOver15 * b, oneOver15 * a);
    }
    if (color.length === 7 || color.length === 9) {
      r = parseInt(color.substr(1, 2), 16);
      g = parseInt(color.substr(3, 2), 16);
      b = parseInt(color.substr(5, 2), 16);
      a = Math.round(255 * alpha);
      if (color.length === 9) {
        a = parseInt(color.substr(7, 2), 16);
      }
      var oneOver255 = 1 / 255;
      return rgb.fromValues(oneOver255 * r, oneOver255 * g, oneOver255 * b, oneOver255 * a);
    }
  };
  exports.setColorPalette = function (customColors) {
    console.log('setting colors');
    COLORS = customColors;
    exports.initGradients();
  };
  exports.forceRGB = function (color, alpha) {
    alpha = alpha === undefined ? 1 : +alpha;
    if (typeof color === 'string') {
      var lookup = COLORS[color];
      if (lookup !== undefined) {
        color = rgb.clone(lookup);
        color[3] = alpha;
      }
      if (color.length > 0 && color[0] === '#') {
        return exports.hex2rgb(color, alpha);
      }
    }
    if (color.length === 3) {
      return [
        color[0],
        color[1],
        color[2],
        alpha
      ];
    }
    return color;
  };
  function Gradient(colors, stops) {
    this._colors = colors;
    for (var i = 0; i < this._colors.length; ++i) {
      this._colors[i] = exports.forceRGB(this._colors[i]);
    }
    this._stops = stops;
  }
  Gradient.prototype = {
    colorAt: function (out, value) {
      if (value <= this._stops[0]) {
        return vec4.copy(out, this._colors[0]);
      }
      if (value >= this._stops[this._stops.length - 1]) {
        return vec4.copy(out, this._colors[this._stops.length - 1]);
      }
      var lowerIndex = 0;
      for (var i = 1; i < this._stops.length; ++i) {
        if (this._stops[i] > value) {
          break;
        }
        lowerIndex = i;
      }
      var upperIndex = lowerIndex + 1;
      var lowerStop = this._stops[lowerIndex];
      var upperStop = this._stops[upperIndex];
      var t = (value - lowerStop) / (upperStop - lowerStop);
      return rgb.mix(out, this._colors[upperIndex], this._colors[lowerIndex], t);
    }
  };
  var GRADIENTS = {};
  exports.gradient = function (colors, stops) {
    if (typeof colors === 'string') {
      return GRADIENTS[colors];
    }
    stops = stops || 'equal';
    if (stops === 'equal') {
      stops = [];
      for (var i = 0; i < colors.length; ++i) {
        stops.push(i * 1 / (colors.length - 1));
      }
    }
    return new Gradient(colors, stops);
  };
  var gradient = exports.gradient;
  exports.initGradients = function () {
    GRADIENTS.rainbow = gradient([
      'blue',
      'green',
      'yellow',
      'red'
    ]);
    GRADIENTS.reds = gradient([
      'lightred',
      'darkred'
    ]);
    GRADIENTS.greens = gradient([
      'lightgreen',
      'darkgreen'
    ]);
    GRADIENTS.blues = gradient([
      'lightblue',
      'darkblue'
    ]);
    GRADIENTS.trafficlight = gradient([
      'green',
      'yellow',
      'red'
    ]);
    GRADIENTS.heatmap = gradient([
      'red',
      'white',
      'blue'
    ]);
  };
  function ColorOp(colorFunc, beginFunc, endFunc) {
    this.colorFor = colorFunc;
    this._beginFunc = beginFunc;
    this._endFunc = endFunc;
  }
  ColorOp.prototype = {
    begin: function (obj) {
      if (this._beginFunc) {
        this._beginFunc(obj);
      }
    },
    end: function (obj) {
      if (this._endFunc) {
        this._endFunc(obj);
      }
    }
  };
  exports.ColorOp = ColorOp;
  exports.uniform = function (color) {
    color = exports.forceRGB(color || 'white');
    return new ColorOp(function (atom, out, index) {
      out[index + 0] = color[0];
      out[index + 1] = color[1];
      out[index + 2] = color[2];
      out[index + 3] = color[3];
    }, null, null);
  };
  var CPK_TABLE = {
    H: [
      0.87,
      0.87,
      0.87
    ],
    C: [
      0.61,
      0.61,
      0.61
    ],
    N: [
      0,
      0.47,
      0.84
    ],
    O: [
      0.97,
      0.18,
      0.18
    ],
    F: [
      0.12,
      0.94,
      0.12
    ],
    CL: [
      0.12,
      0.94,
      0.12
    ],
    BR: [
      0.6,
      0.13,
      0
    ],
    I: [
      0.4,
      0,
      0.73
    ],
    HE: [
      0,
      1,
      1
    ],
    NE: [
      0,
      1,
      1
    ],
    AR: [
      0,
      1,
      1
    ],
    XE: [
      0,
      1,
      1
    ],
    KR: [
      0,
      1,
      1
    ],
    P: [
      1,
      0.43,
      0.13
    ],
    S: [
      1,
      0.73,
      0.22
    ],
    B: [
      1,
      0.67,
      0.47
    ],
    LI: [
      0.47,
      0,
      1
    ],
    NA: [
      0.47,
      0,
      1
    ],
    K: [
      0.47,
      0,
      1
    ],
    RB: [
      0.47,
      0,
      1
    ],
    CS: [
      0.47,
      0,
      1
    ],
    FR: [
      0.47,
      0,
      1
    ],
    BE: [
      0,
      0.47,
      0
    ],
    MG: [
      0,
      0.47,
      0
    ],
    SR: [
      0,
      0.47,
      0
    ],
    BA: [
      0,
      0.47,
      0
    ],
    RA: [
      0,
      0.47,
      0
    ],
    TI: [
      0.6,
      0.6,
      0.6
    ],
    FE: [
      0.56,
      0.31,
      0.12
    ]
  };
  exports.byElement = function () {
    return new ColorOp(function (atom, out, index) {
      var ele = atom.element();
      var color = CPK_TABLE[ele];
      if (color !== undefined) {
        out[index] = color[0];
        out[index + 1] = color[1];
        out[index + 2] = color[2];
        out[index + 3] = 1;
        return out;
      }
      out[index] = 1;
      out[index + 1] = 0;
      out[index + 2] = 1;
      out[index + 3] = 1;
      return out;
    }, null, null);
  };
  exports.bySS = function () {
    return new ColorOp(function (atom, out, index) {
      switch (atom.residue().ss()) {
      case 'C':
        out[index] = 0.8;
        out[index + 1] = 0.8;
        out[index + 2] = 0.8;
        out[index + 3] = 1;
        return;
      case 'H':
        out[index] = 0.6;
        out[index + 1] = 0.6;
        out[index + 2] = 0.9;
        out[index + 3] = 1;
        return;
      case 'E':
        out[index] = 0.2;
        out[index + 1] = 0.8;
        out[index + 2] = 0.2;
        out[index + 3] = 1;
        return;
      }
    }, null, null);
  };
  exports.rainbow = function (grad) {
    if (!grad) {
      grad = gradient('rainbow');
    }
    var colorFunc = new ColorOp(function (a, out, index) {
      var t = 0;
      var limits = this.chainLimits[a.residue().chain().name()];
      if (limits !== undefined) {
        var idx = a.residue().index();
        t = (idx - limits[0]) / (limits[1] - limits[0]);
      }
      var x = [
        1,
        1,
        1,
        1
      ];
      grad.colorAt(x, t);
      out[index] = x[0];
      out[index + 1] = x[1];
      out[index + 2] = x[2];
      out[index + 3] = x[3];
    }, function (obj) {
      var chains = obj.chains();
      this.chainLimits = {};
      for (var i = 0; i < chains.length; ++i) {
        var bb = chains[i].backboneTraces();
        if (bb.length === 0) {
          continue;
        }
        var minIndex = bb[0].residueAt(0).index(), maxIndex = bb[0].residueAt(bb[0].length() - 1).index();
        for (var j = 1; j < bb.length; ++j) {
          var bbj = bb[j];
          minIndex = Math.min(minIndex, bbj.residueAt(0).index());
          maxIndex = Math.max(maxIndex, bbj.residueAt(bbj.length() - 1).index());
        }
        if (minIndex !== maxIndex) {
          this.chainLimits[chains[i].name()] = [
            minIndex,
            maxIndex
          ];
        }
      }
    }, function () {
      this.chainLimits = null;
    });
    return colorFunc;
  };
  exports.ssSuccession = function (grad, coilColor) {
    if (!grad) {
      grad = gradient('rainbow');
    }
    if (!coilColor) {
      coilColor = exports.forceRGB('lightgrey');
    } else {
      coilColor = exports.forceRGB(coilColor);
    }
    var colorFunc = new ColorOp(function (a, out, index) {
      var idx = a.residue().index();
      var limits = this.chainLimits[a.residue().chain().name()];
      var ssIndex = limits.indices[idx];
      if (ssIndex === -1) {
        out[index] = coilColor[0];
        out[index + 1] = coilColor[1];
        out[index + 2] = coilColor[2];
        out[index + 3] = coilColor[3];
        return;
      }
      var t = 0;
      if (limits.max === null) {
      }
      if (limits.max !== null) {
        t = ssIndex / (limits.max > 0 ? limits.max : 1);
      }
      var x = [
        0,
        0,
        0,
        0
      ];
      grad.colorAt(x, t);
      out[index] = x[0];
      out[index + 1] = x[1];
      out[index + 2] = x[2];
      out[index + 3] = x[3];
    }, function (obj) {
      var chains = obj.chains();
      this.chainLimits = {};
      for (var i = 0; i < chains.length; ++i) {
        var residues = chains[i].residues();
        var maxIndex = null;
        var indices = {};
        var ssIndex = 0;
        var lastSS = 'C';
        for (var j = 0; j < residues.length; ++j) {
          var ss = residues[j].ss();
          if (ss === 'C') {
            if (lastSS !== 'C') {
              ssIndex++;
            }
            indices[residues[j].index()] = -1;
          } else {
            maxIndex = ssIndex;
            indices[residues[j].index()] = ssIndex;
          }
          lastSS = ss;
        }
        this.chainLimits[chains[i].name()] = {
          indices: indices,
          max: maxIndex
        };
      }
    }, function () {
      this.chainLimits = null;
    });
    return colorFunc;
  };
  exports.byChain = function (grad) {
    if (!grad) {
      grad = gradient('rainbow');
    }
    var colorFunc = new ColorOp(function (a, out, index) {
      var chainIndex = this.chainIndices[a.residue().chain().name()];
      var t = chainIndex * this.scale;
      var x = [
        0,
        0,
        0,
        0
      ];
      grad.colorAt(x, t);
      out[index + 0] = x[0];
      out[index + 1] = x[1];
      out[index + 2] = x[2];
      out[index + 3] = x[3];
    }, function (obj) {
      var chains = obj.chains();
      this.chainIndices = {};
      for (var i = 0; i < chains.length; ++i) {
        this.chainIndices[chains[i].name()] = i;
      }
      this.scale = chains.length > 1 ? 1 / (chains.length - 1) : 1;
    }, function () {
      this.chainIndices = null;
    });
    return colorFunc;
  };
  function getMinMaxRange(obj, iter, propName) {
    var min = null;
    var max = null;
    obj[iter](function (item) {
      var value = item.prop(propName);
      if (min === null && max === null) {
        min = max = value;
        return;
      }
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
    return {
      min: min,
      max: max
    };
  }
  var gradColor = function () {
    var color = vec4.create();
    return function (out, index, grad, t) {
      grad.colorAt(color, t);
      out[index + 0] = color[0];
      out[index + 1] = color[1];
      out[index + 2] = color[2];
      out[index + 3] = color[3];
    };
  }();
  function colorByItemProp(propName, grad, range, iter, item) {
    if (!grad) {
      grad = gradient('rainbow');
    }
    return new ColorOp(function (a, out, index) {
      var t = 0;
      if (this._min !== this._max) {
        t = (item(a).prop(propName) - this._min) / (this._max - this._min);
      }
      gradColor(out, index, grad, t);
    }, function (obj) {
      if (range !== undefined) {
        this._min = range[0];
        this._max = range[1];
        return;
      }
      range = getMinMaxRange(obj, iter, propName);
      this._min = range.min;
      this._max = range.max;
    }, function () {
    });
  }
  exports.byAtomProp = function (propName, grad, range) {
    return colorByItemProp(propName, grad, range, 'eachAtom', function (a) {
      return a;
    });
  };
  exports.byResidueProp = function (propName, grad, range) {
    return colorByItemProp(propName, grad, range, 'eachResidue', function (a) {
      return a.residue();
    });
  };
  exports.interpolateColor = function (colors, num) {
    var out = new Float32Array((num * (colors.length / 4 - 1) + 1) * 4);
    var index = 0;
    var bf = vec4.create(), af = vec4.create();
    var halfNum = num / 2;
    for (var i = 0; i < colors.length / 4 - 1; ++i) {
      vec4.set(bf, colors[4 * i + 0], colors[4 * i + 1], colors[4 * i + 2], colors[4 * i + 3]);
      vec4.set(af, colors[4 * i + 4], colors[4 * i + 5], colors[4 * i + 6], colors[4 * i + 7]);
      for (var j = 0; j < num; ++j) {
        var t = j < halfNum ? 0 : 1;
        out[index + 0] = bf[0] * (1 - t) + af[0] * t;
        out[index + 1] = bf[1] * (1 - t) + af[1] * t;
        out[index + 2] = bf[2] * (1 - t) + af[2] * t;
        out[index + 3] = bf[3] * (1 - t) + af[3] * t;
        index += 4;
      }
    }
    out[index + 0] = af[0];
    out[index + 1] = af[1];
    out[index + 2] = af[2];
    out[index + 3] = af[3];
    return out;
  };
  exports.initGradients();
  return exports;
}();
uniqueObjectIdPool = function () {
  function ContinuousIdRange(pool, start, end) {
    this._pool = pool;
    this._start = start;
    this._next = start;
    this._end = end;
  }
  ContinuousIdRange.prototype = {
    nextId: function (obj) {
      var id = this._next;
      console.assert(this._next < this._end);
      this._next++;
      this._pool._objects[id] = obj;
      return id;
    },
    hasLeft: function () {
      return this._next < this._end;
    },
    recycle: function () {
      this._pool.recycle(this);
    },
    length: function () {
      return this._end - this._start;
    }
  };
  function UniqueObjectIdPool() {
    this.clear();
  }
  UniqueObjectIdPool.prototype = {
    MAX_ID: 16777216,
    getContinuousRange: function (num) {
      var bestIndex = -1;
      var bestLength = null;
      for (var i = 0; i < this._free.length; ++i) {
        var free = this._free[i];
        var length = free.length();
        if (length >= num && (bestLength === null || length < bestLength)) {
          bestLength = length;
          bestIndex = i;
        }
      }
      if (bestIndex !== -1) {
        var result = this._free[bestIndex];
        this._free.splice(bestIndex, 1);
        this._usedCount++;
        return result;
      }
      var start = this._unusedRangeStart;
      var end = start + num;
      if (end > this.MAX_ID) {
        console.error('not enough free object ids.');
        return null;
      }
      this._unusedRangeStart = end;
      var newRange = new ContinuousIdRange(this, start, end);
      this._usedCount++;
      return newRange;
    },
    clear: function () {
      this._objects = {};
      this._unusedRangeStart = 1;
      this._free = [];
      this._usedCount = 0;
    },
    recycle: function (range) {
      for (var i = range._start; i < range._next; ++i) {
        delete this._objects[i];
      }
      range._next = range._start;
      this._free.push(range);
      this._usedCount--;
      console.assert(this._usedCount >= 0);
      if (this._free.length > 0 && this._usedCount === 0) {
        this.clear();
      }
    },
    objectForId: function (id) {
      return this._objects[id];
    }
  };
  return UniqueObjectIdPool;
}();
utils = function () {
  var exports = {};
  exports.derive = function (subclass, baseclass, extensions) {
    for (var prop in baseclass.prototype) {
      subclass.prototype[prop] = baseclass.prototype[prop];
    }
    if (extensions === undefined) {
      return;
    }
    for (var ext in extensions) {
      subclass.prototype[ext] = extensions[ext];
    }
  };
  exports.bind = function (obj, fn) {
    return function () {
      return fn.apply(obj, arguments);
    };
  };
  exports.update = function (dst, src) {
    src = src || {};
    for (var prop in src) {
      if (src.hasOwnProperty(prop)) {
        dst[prop] = src[prop];
      }
    }
    return dst;
  };
  exports.copy = function (src) {
    var cloned = {};
    exports.update(cloned, src);
    return cloned;
  };
  function defaultComp(lhs, rhs) {
    return lhs < rhs;
  }
  exports.binarySearch = function (values, value, comp) {
    if (values.length === 0) {
      return -1;
    }
    comp = comp || defaultComp;
    var low = 0, high = values.length;
    var mid = low + high >> 1;
    while (true) {
      var midValue = values[mid];
      if (comp(value, midValue)) {
        high = mid;
      } else if (comp(midValue, value)) {
        low = mid;
      } else {
        return mid;
      }
      var newMid = low + high >> 1;
      if (newMid === mid) {
        return -1;
      }
      mid = newMid;
    }
    return -1;
  };
  exports.indexFirstLargerEqualThan = function (values, value, comp) {
    comp = comp || defaultComp;
    if (values.length === 0 || comp(values[values.length - 1], value)) {
      return -1;
    }
    var low = 0, high = values.length;
    var mid = low + high >> 1;
    while (true) {
      var midValue = values[mid];
      if (comp(value, midValue)) {
        high = mid;
      } else if (comp(midValue, value)) {
        low = mid + 1;
      } else {
        high = mid;
      }
      var newMid = low + high >> 1;
      if (newMid === mid) {
        return mid;
      }
      mid = newMid;
    }
  };
  exports.indexLastSmallerThan = function (values, value, comp) {
    comp = comp || defaultComp;
    if (values.length === 0 || comp(values[values.length - 1], value)) {
      return values.length - 1;
    }
    if (comp(value, values[0]) || !comp(values[0], value)) {
      return -1;
    }
    var low = 0, high = values.length;
    var mid = low + high >> 1;
    while (true) {
      var midValue = values[mid];
      if (comp(value, midValue) || !comp(midValue, value)) {
        high = mid;
      } else {
        low = mid;
      }
      var newMid = low + high >> 1;
      if (newMid === mid) {
        return mid;
      }
      mid = newMid;
    }
  };
  exports.indexLastSmallerEqualThan = function (values, value, comp) {
    comp = comp || defaultComp;
    if (values.length === 0 || comp(values[values.length - 1], value)) {
      return values.length - 1;
    }
    if (comp(value, values[0])) {
      return -1;
    }
    var low = 0, high = values.length;
    var mid = low + high >> 1;
    while (true) {
      var midValue = values[mid];
      if (comp(value, midValue)) {
        high = mid;
      } else {
        low = mid;
      }
      var newMid = low + high >> 1;
      if (newMid === mid) {
        return mid;
      }
      mid = newMid;
    }
  };
  function Range(min, max) {
    if (min === undefined || max === undefined) {
      this._empty = true;
      this._min = this._max = null;
    } else {
      this._empty = false;
      this._min = min;
      this._max = max;
    }
  }
  Range.prototype = {
    min: function () {
      return this._min;
    },
    max: function () {
      return this._max;
    },
    length: function () {
      return this._max - this._min;
    },
    empty: function () {
      return this._empty;
    },
    center: function () {
      return (this._max + this._min) * 0.5;
    },
    extend: function (amount) {
      this._min -= amount;
      this._max += amount;
    },
    update: function (val) {
      if (!this._empty) {
        if (val < this._min) {
          this._min = val;
        } else if (val > this._max) {
          this._max = val;
        }
        return;
      }
      this._min = this._max = val;
      this._empty = false;
    }
  };
  exports.Range = Range;
  return exports;
}();
gfxCanvas = function () {
  function isWebGLSupported(gl) {
    if (document.readyState !== 'complete' && document.readyState !== 'loaded' && document.readyState !== 'interactive') {
      console.error('isWebGLSupported only works after DOMContentLoaded');
      return false;
    }
    if (gl === undefined) {
      try {
        var canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    }
    return !!gl;
  }
  function Canvas(parentElement, options) {
    this._width = options.width;
    this._antialias = options.antialias;
    this._height = options.height;
    this._resize = false;
    this._lastTimestamp = null;
    this._domElement = parentElement;
    this._initCanvas();
    this._backgroundColor = options.backgroundColor;
    this._forceManualAntialiasing = options.forceManualAntialiasing;
  }
  Canvas.prototype = {
    _ensureSize: function () {
      if (!this._resize) {
        return;
      }
      this._resize = false;
      var realWidth = this._width * this._samples;
      var realHeight = this._height * this._samples;
      this._realWidth = realWidth;
      this._realHeight = realHeight;
      this._gl.viewport(0, 0, realWidth, realHeight);
      this._canvas.width = realWidth;
      this._canvas.height = realHeight;
      if (this._samples > 1) {
        this._initManualAntialiasing(this._samples);
      }
    },
    resize: function (width, height) {
      if (width === this._width && height === this._height) {
        return;
      }
      this._resize = true;
      this._width = width;
      this._height = height;
    },
    fitParent: function () {
      var parentRect = this._domElement.getBoundingClientRect();
      this.resize(parentRect.width, parentRect.height);
    },
    gl: function () {
      return this._gl;
    },
    imageData: function () {
      return this._canvas.toDataURL();
    },
    _initContext: function () {
      try {
        var contextOpts = {
          antialias: this._antialias && !this._forceManualAntialiasing,
          preserveDrawingBuffer: true
        };
        this._gl = this._canvas.getContext('experimental-webgl', contextOpts);
      } catch (err) {
        console.error('WebGL not supported', err);
        return false;
      }
      if (!this._gl) {
        console.error('WebGL not supported');
        return false;
      }
      return true;
    },
    _initManualAntialiasing: function (samples) {
      var scale_factor = 1 / samples;
      var trans_x = -(1 - scale_factor) * 0.5 * this._realWidth;
      var trans_y = -(1 - scale_factor) * 0.5 * this._realHeight;
      var translate = 'translate(' + trans_x + 'px, ' + trans_y + 'px)';
      var scale = 'scale(' + scale_factor + ', ' + scale_factor + ')';
      var transform = translate + ' ' + scale;
      this._canvas.style.webkitTransform = transform;
      this._canvas.style.transform = transform;
      this._canvas.style.ieTransform = transform;
      this._canvas.width = this._realWidth;
      this._canvas.height = this._realHeight;
    },
    initGL: function () {
      var samples = 1;
      if (!this._initContext()) {
        return false;
      }
      var gl = this._gl;
      if (!gl.getContextAttributes().antialias && this._forceManualAntialiasing && this._antialias) {
        samples = 2;
      }
      this._realWidth = this._width * samples;
      this._realHeight = this._height * samples;
      this._samples = samples;
      if (samples > 1) {
        this._initManualAntialiasing(samples);
      }
      gl.viewportWidth = this._realWidth;
      gl.viewportHeight = this._realHeight;
      gl.clearColor(this._backgroundColor[0], this._backgroundColor[1], this._backgroundColor[2], 1);
      gl.lineWidth(2);
      gl.cullFace(gl.FRONT);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      return true;
    },
    _shaderFromString: function (shader_code, type, precision) {
      var shader;
      var gl = this._gl;
      if (type === 'fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (type === 'vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        console.error('could not determine type for shader');
        return null;
      }
      var code = shader_code.replace('${PRECISION}', precision);
      gl.shaderSource(shader, code);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(code);
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    },
    initShader: function (vert_shader, frag_shader, precision) {
      var gl = this._gl;
      var fs = this._shaderFromString(frag_shader, 'fragment', precision);
      var vs = this._shaderFromString(vert_shader, 'vertex', precision);
      var shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vs);
      gl.attachShader(shaderProgram, fs);
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('could not initialise shaders');
        console.error(gl.getShaderInfoLog(shaderProgram));
        return null;
      }
      var getAttribLoc = utils.bind(gl, gl.getAttribLocation);
      var getUniformLoc = utils.bind(gl, gl.getUniformLocation);
      shaderProgram.posAttrib = getAttribLoc(shaderProgram, 'attrPos');
      shaderProgram.colorAttrib = getAttribLoc(shaderProgram, 'attrColor');
      shaderProgram.normalAttrib = getAttribLoc(shaderProgram, 'attrNormal');
      shaderProgram.objIdAttrib = getAttribLoc(shaderProgram, 'attrObjId');
      shaderProgram.selectAttrib = getAttribLoc(shaderProgram, 'attrSelect');
      shaderProgram.symId = getUniformLoc(shaderProgram, 'symId');
      shaderProgram.projection = getUniformLoc(shaderProgram, 'projectionMat');
      shaderProgram.modelview = getUniformLoc(shaderProgram, 'modelviewMat');
      shaderProgram.rotation = getUniformLoc(shaderProgram, 'rotationMat');
      shaderProgram.fog = getUniformLoc(shaderProgram, 'fog');
      shaderProgram.fogFar = getUniformLoc(shaderProgram, 'fogFar');
      shaderProgram.fogNear = getUniformLoc(shaderProgram, 'fogNear');
      shaderProgram.fogColor = getUniformLoc(shaderProgram, 'fogColor');
      shaderProgram.outlineColor = getUniformLoc(shaderProgram, 'outlineColor');
      shaderProgram.outlineWidth = getUniformLoc(shaderProgram, 'outlineWidth');
      shaderProgram.relativePixelSize = getUniformLoc(shaderProgram, 'relativePixelSize');
      shaderProgram.screenDoorTransparency = getUniformLoc(shaderProgram, 'screenDoorTransparency');
      shaderProgram.selectionColor = getUniformLoc(shaderProgram, 'selectionColor');
      shaderProgram.pointSize = getUniformLoc(shaderProgram, 'pointSize');
      shaderProgram.zoom = getUniformLoc(shaderProgram, 'zoom');
      shaderProgram.outlineEnabled = getUniformLoc(shaderProgram, 'outlineEnabled');
      return shaderProgram;
    },
    on: function (name, handler) {
      this._canvas.addEventListener(name, handler, false);
    },
    removeEventListener: function (name, listener) {
      this._canvas.removeEventListener(name, listener, false);
    },
    onWheel: function (firefoxHandler, handler) {
      if ('onwheel' in this._canvas) {
        this.on('wheel', firefoxHandler);
      } else {
        this.on('mousewheel', handler);
      }
    },
    domElement: function () {
      return this._canvas;
    },
    bind: function () {
      this._ensureSize();
      this._gl.viewport(0, 0, this._realWidth, this._realHeight);
    },
    superSamplingFactor: function () {
      return this._samples;
    },
    viewportWidth: function () {
      return this._realWidth;
    },
    viewportHeight: function () {
      return this._realHeight;
    },
    width: function () {
      return this._width;
    },
    height: function () {
      return this._height;
    },
    _initCanvas: function () {
      this._canvas = document.createElement('canvas');
      this._canvas.width = this._width;
      this._canvas.height = this._height;
      this._domElement.appendChild(this._canvas);
    },
    isWebGLSupported: function () {
      return isWebGLSupported(this._gl);
    },
    destroy: function () {
      this._canvas.width = 1;
      this._canvas.height = 1;
      this._canvas.parentElement.removeChild(this._canvas);
      this._canvas = null;
    }
  };
  return {
    Canvas: Canvas,
    isWebGLSupported: isWebGLSupported
  };
}();
gfxFramebuffer = function () {
  function FrameBuffer(gl, options) {
    this._width = options.width;
    this._height = options.height;
    this._colorBufferWidth = this._width;
    this._colorBufferHeight = this._height;
    this._gl = gl;
    this._colorHandle = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._colorHandle);
    this._depthHandle = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthHandle);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this._width, this._height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depthHandle);
    this._colorTexture = gl.createTexture();
    this._initColorBuffer();
  }
  FrameBuffer.prototype = {
    width: function () {
      return this._width;
    },
    height: function () {
      return this._height;
    },
    bind: function () {
      var gl = this._gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._colorHandle);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthHandle);
      if (this._colorBufferWidth !== this._width || this._colorBufferHeight !== this._height) {
        this._resizeBuffers();
      }
      gl.viewport(0, 0, this._width, this._height);
    },
    colorTexture: function () {
      return this._colorTexture;
    },
    _initColorBuffer: function () {
      this.bind();
      var gl = this._gl;
      gl.bindTexture(gl.TEXTURE_2D, this._colorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width, this._height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._colorTexture, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this.release();
    },
    _resizeBuffers: function () {
      var gl = this._gl;
      gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthHandle);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this._width, this._height);
      gl.bindTexture(gl.TEXTURE_2D, this._colorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._width, this._height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._colorTexture, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depthHandle);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this._colorBufferWidth = this._width;
      this._colorBufferHeight = this._height;
    },
    resize: function (width, height) {
      this._width = width;
      this._height = height;
    },
    release: function () {
      var gl = this._gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  };
  return FrameBuffer;
}();
bufferAllocators = function () {
  function PoolAllocator(bufferType) {
    this._freeArrays = [];
    this._bufferType = bufferType;
  }
  PoolAllocator.prototype.request = function (requestedLength) {
    var bestIndex = -1;
    var bestLength = null;
    for (var i = 0; i < this._freeArrays.length; ++i) {
      var free = this._freeArrays[i];
      var length = free.length;
      if (length >= requestedLength && (bestLength === null || length < bestLength)) {
        bestLength = length;
        bestIndex = i;
      }
    }
    if (bestIndex !== -1) {
      var result = this._freeArrays[bestIndex];
      this._freeArrays.splice(bestIndex, 1);
      return result;
    }
    return new this._bufferType(requestedLength);
  };
  PoolAllocator.prototype.release = function (buffer) {
    this._freeArrays.push(buffer);
  };
  return PoolAllocator;
}();
gfxCam = function () {
  var vec3 = glMatrix.vec3;
  var vec4 = glMatrix.vec4;
  var mat4 = glMatrix.mat4;
  function floatArraysAreEqual(lhs, rhs) {
    if (lhs.length !== rhs.length) {
      return false;
    }
    for (var i = 0; i < lhs.length; ++i) {
      if (Math.abs(lhs[i] - rhs[i]) > 0.000001) {
        return false;
      }
    }
    return true;
  }
  function Cam(gl) {
    this._projection = mat4.create();
    this._camModelView = mat4.create();
    this._modelView = mat4.create();
    this._rotation = mat4.create();
    this._translation = mat4.create();
    this._near = 0.1;
    this._onCameraChangedListeners = [];
    this._far = 4000;
    this._fogNear = -5;
    this._fogFar = 50;
    this._fog = true;
    this._fovY = Math.PI * 45 / 180;
    this._fogColor = vec3.fromValues(1, 1, 1);
    this._outlineColor = vec3.fromValues(0.1, 0.1, 0.1);
    this._outlineWidth = 1;
    this._outlineEnabled = true;
    this._selectionColor = vec4.fromValues(0.1, 1, 0.1, 0.7);
    this._center = vec3.create();
    this._zoom = 50;
    this._screenDoorTransparency = false;
    this._updateProjectionMat = true;
    this._updateModelViewMat = true;
    this._upsamplingFactor = 1;
    this._gl = gl;
    this._currentShader = null;
    this._stateId = 0;
    this.setViewportSize(gl.viewportWidth, gl.viewportHeight);
  }
  Cam.prototype = {
    _incrementStateId: function () {
      this._stateId += 1;
      if (this._stateId > 68719476735) {
        this._stateId = 0;
      }
    },
    setOutlineEnabled: function (value) {
      this._outlineEnabled = value;
      this._incrementStateId();
    },
    setScreenDoorTransparency: function (value) {
      this._screenDoorTransparency = value;
      this._incrementStateId();
    },
    setOutlineWidth: function (value) {
      if (this._outlineWidth !== value) {
        this._outlineWidth = value;
        this._incrementStateId();
      }
    },
    addOnCameraChanged: function (fn) {
      this._onCameraChangedListeners.push(fn);
    },
    _informOnCameraChangedListeners: function () {
      var cam = this;
      this._onCameraChangedListeners.forEach(function (fn) {
        fn(cam);
      });
    },
    setRotation: function (rot) {
      var update = false;
      if (rot.length === 16) {
        if (!floatArraysAreEqual(this._rotation, rot)) {
          mat4.copy(this._rotation, rot);
          update = true;
        }
      } else {
        mat4.fromMat3(this._rotation, rot);
        update = true;
      }
      if (update) {
        this._informOnCameraChangedListeners();
        this._updateModelViewMat = true;
      }
    },
    upsamplingFactor: function () {
      return this._upsamplingFactor;
    },
    setUpsamplingFactor: function (val) {
      if (this._upsamplingFactor !== val) {
        this._incrementStateId();
        this._upsamplingFactor = val;
        var x = this._upsamplingFactor / this._width;
        var y = this._upsamplingFactor / this._height;
        this._relativePixelSize = new Float32Array([
          x,
          y
        ]);
      }
    },
    mainAxes: function () {
      return [
        vec3.fromValues(this._rotation[0], this._rotation[4], this._rotation[8]),
        vec3.fromValues(this._rotation[1], this._rotation[5], this._rotation[9]),
        vec3.fromValues(this._rotation[2], this._rotation[6], this._rotation[10])
      ];
    },
    fieldOfViewY: function () {
      return this._fovY;
    },
    setFieldOfViewY: function (value) {
      this._fovY = value;
      this._updateProjectionMat = true;
    },
    aspectRatio: function () {
      return this._width / this._height;
    },
    rotation: function () {
      return this._rotation;
    },
    _updateIfRequired: function () {
      var updated = false;
      if (this._updateModelViewMat) {
        mat4.identity(this._camModelView);
        mat4.translate(this._camModelView, this._camModelView, [
          -this._center[0],
          -this._center[1],
          -this._center[2]
        ]);
        mat4.mul(this._camModelView, this._rotation, this._camModelView);
        mat4.identity(this._translation);
        mat4.translate(this._translation, this._translation, [
          0,
          0,
          -this._zoom
        ]);
        mat4.mul(this._camModelView, this._translation, this._camModelView);
        updated = true;
      }
      if (this._updateProjectionMat) {
        mat4.identity(this._projection);
        mat4.perspective(this._projection, this._fovY, this._width / this._height, this._near, this._far);
        updated = true;
      }
      this._updateProjectionMat = false;
      this._updateModelViewMat = false;
      if (updated) {
        this._incrementStateId();
      }
      return updated;
    },
    setViewportSize: function (width, height) {
      this._updateProjectionMat = true;
      this._width = width;
      this._height = height;
      this._relativePixelSize = new Float32Array([
        this._upsamplingFactor / width,
        this._upsamplingFactor / height
      ]);
    },
    viewportWidth: function () {
      return this._width;
    },
    viewportHeight: function () {
      return this._height;
    },
    setCenter: function (point) {
      if (!floatArraysAreEqual(this._center, point)) {
        this._updateModelViewMat = true;
        vec3.copy(this._center, point);
        this._informOnCameraChangedListeners();
      }
    },
    fog: function (value) {
      if (value !== undefined && value !== this._fog) {
        this._fog = value;
        this._incrementStateId();
      }
      return this._fog;
    },
    rotateZ: function () {
      var tm = mat4.create();
      return function (delta) {
        mat4.identity(tm);
        this._updateModelViewMat = true;
        mat4.rotate(tm, tm, delta, [
          0,
          0,
          1
        ]);
        mat4.mul(this._rotation, tm, this._rotation);
        this._informOnCameraChangedListeners();
      };
    }(),
    rotateX: function () {
      var tm = mat4.create();
      return function (delta) {
        mat4.identity(tm);
        this._updateModelViewMat = true;
        mat4.rotate(tm, tm, delta, [
          1,
          0,
          0
        ]);
        mat4.mul(this._rotation, tm, this._rotation);
        this._informOnCameraChangedListeners();
      };
    }(),
    rotateY: function () {
      var tm = mat4.create();
      return function (delta) {
        mat4.identity(tm);
        this._updateModelViewMat = true;
        mat4.rotate(tm, tm, delta, [
          0,
          1,
          0
        ]);
        mat4.mul(this._rotation, tm, this._rotation);
        this._informOnCameraChangedListeners();
      };
    }(),
    panX: function (delta) {
      return this.panXY(delta, 0);
    },
    panY: function (delta) {
      return this.panXY(0, delta);
    },
    panXY: function () {
      var invertRotation = mat4.create();
      var newCenter = vec3.create();
      return function (deltaX, deltaY) {
        mat4.transpose(invertRotation, this._rotation);
        this._updateModelViewMat = true;
        vec3.set(newCenter, -deltaX, deltaY, 0);
        vec3.transformMat4(newCenter, newCenter, invertRotation);
        vec3.add(newCenter, newCenter, this._center);
        this.setCenter(newCenter);
      };
    }(),
    nearOffset: function () {
      return this._near;
    },
    farOffset: function () {
      return this._far;
    },
    setNearFar: function (near, far) {
      if (near === this._near && far === this._far) {
        return;
      }
      this._near = near;
      this._far = far;
      this._updateProjectionMat = true;
    },
    setFogNearFar: function (near, far) {
      this._fogNear = near;
      this._fogFar = far;
      this._updateProjectionMat = true;
    },
    setZoom: function (zoom) {
      if (Math.abs(this._zoom - zoom) > 1e-8) {
        this._updateModelViewMat = true;
        this._zoom = zoom;
      }
      return this._zoom;
    },
    zoom: function (delta) {
      if (delta === undefined) {
        return this._zoom;
      }
      this._updateModelViewMat = true;
      var factor = 1 + delta * 0.1;
      this._zoom = Math.min(1000, Math.max(2, factor * this._zoom));
      this._informOnCameraChangedListeners();
      return this._zoom;
    },
    center: function () {
      return this._center;
    },
    setFogColor: function (color) {
      this._fogColor = vec3.clone(color);
    },
    currentShader: function () {
      return this._currentShader;
    },
    invalidateCurrentShader: function () {
      this._currentShader = null;
    },
    setOutlineColor: function (color) {
      this._outlineColor = vec3.clone(color);
    },
    setSelectionColor: function (color) {
      this._selectionColor = vec3.clone(color);
      if (color.length === 3) {
        this._selectionColor = vec4.fromValues(color[0], color[1], color[2], 0.7);
      } else {
        this._selectionColor = vec4.clone(color);
      }
    },
    bind: function (shader, additionalTransform) {
      var shaderChanged = false;
      var gl = this._gl;
      if (this._currentShader !== shader) {
        this._currentShader = shader;
        gl.useProgram(shader);
        shaderChanged = true;
      }
      shaderChanged = this._updateIfRequired() || shaderChanged;
      if (additionalTransform) {
        mat4.mul(this._modelView, this._camModelView, additionalTransform);
        gl.uniformMatrix4fv(shader.modelview, false, this._modelView);
      } else {
        gl.uniformMatrix4fv(shader.modelview, false, this._camModelView);
      }
      if (this._stateId === shader.stateId) {
        return;
      }
      shader.stateId = this._stateId;
      gl.uniformMatrix4fv(shader.projection, false, this._projection);
      if (shader.rotation) {
        gl.uniformMatrix4fv(shader.rotation, false, this._rotation);
      }
      gl.uniform1i(shader.fog, this._fog);
      var nearOffset = this._zoom;
      gl.uniform1f(shader.fogFar, this._fogFar + nearOffset);
      gl.uniform1f(shader.zoom, this._zoom);
      gl.uniform1f(shader.fogNear, this._fogNear + nearOffset);
      gl.uniform3fv(shader.fogColor, this._fogColor);
      gl.uniform3fv(shader.outlineColor, this._outlineColor);
      gl.uniform4fv(shader.selectionColor, this._selectionColor);
      gl.uniform2fv(shader.relativePixelSize, this._relativePixelSize);
      gl.uniform1f(shader.outlineWidth, this._outlineWidth);
      gl.uniform1i(shader.screenDoorTransparency, this._screenDoorTransparency);
      gl.uniform1i(shader.outlineEnabled, this._outlineEnabled);
    }
  };
  return Cam;
}();
gfxShaders = {
  PRELUDE_FS: '\nprecision ${PRECISION} float;\nuniform bool screenDoorTransparency;\nvec4 handleAlpha(vec4 inColor) {\n  if (screenDoorTransparency) {\n    ivec2 pxCoord = ivec2(gl_FragCoord.xy);\n    ivec2 mod = pxCoord - (pxCoord/2) * 2;\n    if (inColor.a < 0.99 &&\n        (inColor.a < 0.01 || mod.x != 0 || mod.y != 0)) { discard; }\n    return vec4(inColor.rgb, 1.0);\n  } else {\n    if (inColor.a == 0.0) { discard; }\n    return inColor;\n  } \n} \n\nint intMod(int x, int y) { \n  int z = x/y;\n  return x-y*z;\n}\n\nuniform vec4 selectionColor;\n\nvec3 handleSelect(vec3 inColor, float vertSelect) { \n  return mix(inColor, selectionColor.rgb, \n             step(0.5, vertSelect) * selectionColor.a); \n} \n\nuniform bool fog;\nuniform float fogNear;\nuniform float fogFar;\nuniform vec3 fogColor;\nvec3 handleFog(vec3 inColor) {\n  if (fog) {\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\n    float fogFactor = smoothstep(fogNear, fogFar, depth);\n    return mix(inColor, fogColor, fogFactor);\n  } else {\n    return inColor;\n  }\n}',
  LINES_FS: '\nvarying vec4 vertColor;\nvarying vec3 vertNormal;\n\nvoid main(void) {\n  gl_FragColor = handleAlpha(vertColor);\n  gl_FragColor.rgb = handleFog(gl_FragColor.rgb);\n}',
  SELECT_LINES_FS: '\nprecision ${PRECISION} float;\n\nvarying float vertSelect;\nvarying vec3 vertNormal;\nuniform float fogNear;\nuniform float fogFar;\nuniform vec3 fogColor;\nuniform bool fog;\nuniform vec4 selectionColor;\n\nvoid main(void) {\n  gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 0.0), \n                     vec4(selectionColor.rgb, 1.0), vertSelect);\n  gl_FragColor.a = step(0.5, vertSelect);\n  if (gl_FragColor.a == 0.0) { discard; }\n  float depth = gl_FragCoord.z / gl_FragCoord.w;\n  if (fog) {\n    float fog_factor = smoothstep(fogNear, fogFar, depth);\n    gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w),\n                        fog_factor);\n  }\n}',
  SELECT_LINES_VS: '\nattribute vec3 attrPos;\nattribute float attrSelect;\n\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nuniform float pointSize;\nvarying float vertSelect;\nvoid main(void) {\n  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n  gl_Position.z += gl_Position.w * 0.000001; \n  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n  vertSelect = attrSelect;\n}',
  SELECT_VS: '\nprecision ${PRECISION} float;\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nuniform float pointSize;\nattribute vec3 attrPos;\nattribute float attrObjId;\nattribute vec4 attrColor;\n\nvarying float objId;\nvarying float objAlpha;\n\nvoid main(void) {\n  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n  objId = attrObjId;\n  objAlpha = attrColor.a;\n}',
  SELECT_FS: '\nprecision ${PRECISION} float;\n\nvarying float objId;\nvarying float objAlpha;\nuniform int symId;\n\nint intMod(int x, int y) { \n  int z = x/y;\n  return x-y*z;\n}\nvoid main(void) {\n  if (objAlpha == 0.0) { discard; }\n  // ints are only required to be 7bit...\n  int integralObjId = int(objId+0.5);\n  int red = intMod(integralObjId, 256);\n  integralObjId/=256;\n  int green = intMod(integralObjId, 256);\n  integralObjId/=256;\n  int blue = intMod(integralObjId, 256);\n  int alpha = symId;\n  gl_FragColor = vec4(float(red), float(green), \n                      float(blue), float(alpha))/255.0;\n}',
  LINES_VS: '\nattribute vec3 attrPos;\nattribute vec4 attrColor;\n\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nvarying vec4 vertColor;\nuniform float pointSize;\nvoid main(void) {\n  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n  float distToCamera = vec4(modelviewMat * vec4(attrPos, 1.0)).z;\n  gl_PointSize = pointSize * 200.0 / abs(distToCamera); \n  vertColor = attrColor;\n}',
  HEMILIGHT_FS: '\nvarying vec4 vertColor;\nvarying vec3 vertNormal;\nvarying float vertSelect;\n\nvoid main(void) {\n  float dp = dot(vertNormal, vec3(0.0, 0.0, 1.0));\n  float hemi = min(1.0, max(0.0, dp)*0.6+0.5);\n  gl_FragColor = vec4(vertColor.rgb*hemi, vertColor.a);\n  gl_FragColor.rgb = handleFog(handleSelect(gl_FragColor.rgb, vertSelect));\n  gl_FragColor = handleAlpha(gl_FragColor);\n}',
  PHONG_FS: '\nvarying vec4 vertColor;\nvarying vec3 vertNormal;\nvarying vec3 vertPos;\nuniform float zoom;\nvarying float vertSelect;\n\nvoid main(void) {\n  vec3 eyePos = vec3(0.0, 0.0, zoom);\n  float dp = dot(vertNormal, normalize(eyePos - vertPos));\n  float hemi = min(1.0, max(0.3, dp)+0.2);\n  //hemi *= vertColor.a;\n  vec3 rgbColor = vertColor.rgb * hemi; \n  //gl_FragDepthEXT = gl_FragCoord.z;\n  rgbColor += min(vertColor.rgb, 0.8) * pow(max(0.0, dp), 18.0);\n  rgbColor = handleSelect(rgbColor, vertSelect);\n  gl_FragColor = vec4(clamp(rgbColor, 0.0, 1.0), vertColor.a);\n  gl_FragColor.rgb = handleFog(gl_FragColor.rgb);\n  gl_FragColor = handleAlpha(gl_FragColor);\n}',
  HEMILIGHT_VS: '\nattribute vec3 attrPos;\nattribute vec4 attrColor;\nattribute vec3 attrNormal;\nattribute float attrSelect;\n\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nvarying vec4 vertColor;\nvarying vec3 vertNormal;\nvarying vec3 vertPos;\nvarying float vertSelect;\nvoid main(void) {\n  vertPos = (modelviewMat * vec4(attrPos, 1.0)).xyz;\n  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n  vec4 n = (modelviewMat * vec4(attrNormal, 0.0));\n  vertNormal = n.xyz;\n  vertColor = attrColor;\n  vertSelect = attrSelect;\n}',
  OUTLINE_FS: '\nvarying float vertAlpha;\nvarying float vertSelect;\n\nuniform vec3 outlineColor;\n\nvoid main() {\n  gl_FragColor = vec4(mix(outlineColor, selectionColor.rgb, \n                          step(0.5, vertSelect)), \n                      vertAlpha);\n  gl_FragColor.rgb = handleFog(gl_FragColor.rgb);\n  gl_FragColor = handleAlpha(gl_FragColor);\n}',
  OUTLINE_VS: '\nprecision ${PRECISION} float;\n\nattribute vec3 attrPos;\nattribute vec3 attrNormal;\nattribute vec4 attrColor;\nattribute float attrSelect;\n\nuniform vec3 outlineColor;\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nvarying float vertAlpha;\nvarying float vertSelect;\nuniform vec2 relativePixelSize;\nuniform float outlineWidth;\n\nvoid main(void) {\n  gl_Position = projectionMat * modelviewMat * vec4(attrPos, 1.0);\n  vec4 normal = modelviewMat * vec4(attrNormal, 0.0);\n  vertAlpha = attrColor.a;\n  vertSelect = attrSelect;\n  vec2 expansion = relativePixelSize * \n       (outlineWidth + 2.0 * step(0.5, attrSelect));\n  vec2 offset = normal.xy * expansion;\n  gl_Position.xy += gl_Position.w * offset;\n}',
  TEXT_VS: '\nprecision ${PRECISION} float;\n\nattribute vec3 attrCenter;\nattribute vec2 attrCorner;\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nuniform mat4 rotationMat;\nvarying vec2 vertTex;\nuniform float width;\nuniform float height;\nvoid main() { \n  vec4 pos = modelviewMat* vec4(attrCenter, 1.0);\n  pos.z += 4.0;\n  gl_Position = projectionMat * pos;\n  gl_Position.xy += vec2(width,height)*attrCorner*gl_Position.w; \n  vertTex = (attrCorner+abs(attrCorner))/(2.0*abs(attrCorner)); \n}',
  TEXT_FS: '\nprecision ${PRECISION} float;\n\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nuniform sampler2D sampler;\nuniform float xScale;\nuniform float yScale;\nvarying vec2 vertTex;\nvoid main() { \n  vec2 texCoord = vec2(vertTex.x*xScale, vertTex.y*yScale);\n  gl_FragColor = texture2D(sampler, texCoord);\n  if (gl_FragColor.a == 0.0) { discard; }\n}',
  SPHERES_FS: '\n#extension GL_EXT_frag_depth : enable\n\nvarying vec2 vertTex;\nvarying vec4 vertCenter;\nvarying vec4 vertColor;\nvarying float vertSelect;\nvarying float radius;\nuniform mat4 projectionMat;\nuniform vec3 outlineColor;\nvarying float border;\nuniform bool outlineEnabled;\n\nvoid main(void) {\n  float zz = dot(vertTex, vertTex);\n  if (zz > 1.0)\n    discard;\n  vec3 normal = vec3(vertTex.x, vertTex.y, sqrt(1.0-zz));\n  vec3 pos = vertCenter.xyz + normal * radius;\n  float dp = normal.z;\n  float hemi = sqrt(min(1.0, max(0.3, dp) + 0.2));\n  vec4 projected = projectionMat * vec4(pos, 1.0);\n  float depth = projected.z / projected.w;\n  gl_FragDepthEXT = (depth + 1.0) * 0.5;\n  vec3 rgbColor = vertColor.rgb * hemi; \n  rgbColor += min(vertColor.rgb, 0.8) * pow(max(0.0, dp), 18.0);\n  if (outlineEnabled) { \n    rgbColor = mix(rgbColor * hemi, outlineColor, step(border, sqrt(zz)));\n  } else { \n    rgbColor *= hemi; \n  } \n  rgbColor = handleSelect(rgbColor, vertSelect);\n  vec4 fogged = vec4(handleFog(rgbColor), vertColor.a);\n  gl_FragColor = handleAlpha(fogged);\n}',
  SPHERES_VS: '\nprecision ${PRECISION} float;\nattribute vec3 attrPos;\nattribute vec4 attrColor;\nattribute vec3 attrNormal;\nattribute float attrSelect;\nuniform vec2 relativePixelSize;\nuniform float outlineWidth;\nvarying float radius;\n\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nuniform mat4 rotationMat;\nvarying vec4 vertColor;\nvarying vec2 vertTex;\nvarying float border;\nvarying vec4 vertCenter;\nvarying float vertSelect;\nvoid main() {\n  vec3 d = vec3(attrNormal.xy * attrNormal.z, 0.0);\n  vec4 rotated = vec4(d, 0.0)*rotationMat;\n  gl_Position = projectionMat * modelviewMat * \n                (vec4(attrPos, 1.0)+rotated);\n  vertTex = attrNormal.xy;\n  vertColor = attrColor;\n  vertSelect = attrSelect;\n  vertCenter = modelviewMat* vec4(attrPos, 1.0);\n  float dist = length((projectionMat * vertCenter).xy - gl_Position.xy);\n  float dd = dist / gl_Position.w;\n  border = 1.0 - outlineWidth * 1.4 * length(relativePixelSize)/dd;\n  radius = attrNormal.z;\n}',
  SELECT_SPHERES_FS: '\n#extension GL_EXT_frag_depth : enable\n\nvarying vec2 vertTex;\nvarying vec4 vertCenter;\nvarying vec4 vertColor;\nuniform mat4 projectionMat;\nvarying float objId;\nvarying float radius;\nuniform int symId;\n\nvoid main(void) {\n  float zz = dot(vertTex, vertTex);\n  if (zz > 1.0)\n    discard;\n  vec3 normal = vec3(vertTex.x, vertTex.y, sqrt(1.0-zz));\n  vec3 pos = vertCenter.xyz + normal * radius;\n  vec4 projected = projectionMat * vec4(pos, 1.0);\n  float depth = projected.z / projected.w;\n  gl_FragDepthEXT = (depth + 1.0) * 0.5;\n  // ints are only required to be 7bit...\n  int integralObjId = int(objId+0.5);\n  int red = intMod(integralObjId, 256);\n  integralObjId/=256;\n  int green = intMod(integralObjId, 256);\n  integralObjId/=256;\n  int blue = intMod(integralObjId, 256);\n  int alpha = symId;\n  gl_FragColor = vec4(float(red), float(green), \n                      float(blue), float(alpha))/255.0;\n}',
  SELECT_SPHERES_VS: '\nprecision ${PRECISION} float;\nattribute vec3 attrPos;\nattribute vec4 attrColor;\nattribute vec3 attrNormal;\nattribute float attrObjId;\nvarying float radius;\n\nuniform mat4 projectionMat;\nuniform mat4 modelviewMat;\nuniform mat4 rotationMat;\nvarying vec2 vertTex;\nvarying vec4 vertCenter;\nvarying float objId;\nvoid main() {\n  vec3 d = vec3(attrNormal.xy * attrNormal.z, 0.0);\n  vec4 rotated = vec4(d, 0.0)*rotationMat;\n  //vec4 rotated = vec4(d, 0.0);\n  gl_Position = projectionMat * modelviewMat * \n                (vec4(attrPos, 1.0)+rotated);\n  vertTex = attrNormal.xy;\n  vertCenter = modelviewMat* vec4(attrPos, 1.0);\n  radius = attrNormal.z;\n  objId = attrObjId;\n}'
};
touch = function () {
  function TouchHandler(element, viewer, cam) {
    this._element = element;
    this._element.addEventListener('touchmove', utils.bind(this, this._touchMove));
    this._element.addEventListener('touchstart', utils.bind(this, this._touchStart));
    this._element.addEventListener('touchend', utils.bind(this, this._touchEnd));
    this._element.addEventListener('touchcancel', utils.bind(this, this._touchEnd));
    this._touchState = {
      scale: 1,
      rotation: 0,
      center: null
    };
    this._lastSingleTap = null;
    this._viewer = viewer;
    this._cam = cam;
  }
  function getCenter(touches) {
    var centerX = 0, centerY = 0;
    for (var i = 0; i < touches.length; ++i) {
      centerX += touches[i].clientX;
      centerY += touches[i].clientY;
    }
    centerX /= touches.length;
    centerY /= touches.length;
    return {
      x: centerX,
      y: centerY
    };
  }
  function distance(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function getScale(prevPointers, newPointers) {
    var prevD = distance(prevPointers[0], prevPointers[1]);
    var newD = distance(newPointers[0], newPointers[1]);
    return newD / (prevD === 0 ? 1 : prevD);
  }
  function getAngle(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    return Math.atan2(dy, dx);
  }
  function getRotationAngle(prevPointers, newPointers) {
    return getAngle(newPointers[1], newPointers[0]) - getAngle(prevPointers[1], prevPointers[0]);
  }
  TouchHandler.prototype = {
    _extractEventAttributes: function (previousState, event) {
      var state = {};
      state.center = getCenter(event.targetTouches);
      state.pointers = [];
      for (var i = 0; i < event.targetTouches.length; ++i) {
        var t = event.targetTouches[i];
        state.pointers.push({
          x: t.clientX,
          y: t.clientY
        });
      }
      state.numTouches = event.targetTouches.length;
      state.rotation = 0;
      state.scale = 1;
      state.deltaScale = 0;
      state.deltaRotation = 0;
      if (previousState.center) {
        state.deltaCenter = {
          x: state.center.x - previousState.center.x,
          y: state.center.y - previousState.center.y
        };
      }
      if (previousState.numTouches !== 2 || state.numTouches !== 2) {
        return state;
      }
      if (previousState.initialPointers) {
        state.initialPointers = previousState.initialPointers;
      } else {
        state.initialPointers = previousState.pointers;
      }
      state.scale = getScale(state.initialPointers, state.pointers);
      state.deltaScale = state.scale - previousState.scale;
      state.rotation = getRotationAngle(state.initialPointers, state.pointers);
      state.deltaRotation = state.rotation - previousState.rotation;
      return state;
    },
    _touchMove: function (event) {
      event.preventDefault();
      var newState = this._extractEventAttributes(this._touchState, event);
      var deltaScale = -newState.deltaScale * 4;
      if (deltaScale !== 0) {
        this._cam.zoom(deltaScale);
      }
      if (newState.numTouches === 2 && this._touchState.numTouches === 2) {
        var speed = 0.002 * Math.tan(0.5 * this._cam.fieldOfViewY()) * this._cam.zoom();
        this._cam.panXY(newState.deltaCenter.x * speed, newState.deltaCenter.y * speed);
      }
      var deltaZRotation = -newState.deltaRotation;
      this._cam.rotateZ(deltaZRotation);
      if (newState.numTouches === 1 && this._touchState.numTouches === 1) {
        this._cam.rotateX(newState.deltaCenter.y * 0.005);
        this._cam.rotateY(newState.deltaCenter.x * 0.005);
      }
      this._viewer.requestRedraw();
      this._touchState = newState;
      this._lastSingleTap = null;
    },
    _touchStart: function (event) {
      event.preventDefault();
      if (event.targetTouches.length === 1) {
        var now = new Date().getTime();
        if (this._lastSingleTap !== null) {
          var delta = now - this._lastSingleTap;
          if (delta < 300) {
            this._viewer._mouseHandler._mouseDoubleClick({
              clientX: event.targetTouches[0].clientX,
              clientY: event.targetTouches[0].clientY
            });
            now = null;
          }
        }
        this._lastSingleTap = now;
      } else {
        this._lastSingleTap = null;
      }
      this._touchState = this._extractEventAttributes(this._touchState, event);
    },
    _touchEnd: function (event) {
      event.preventDefault();
      if (this._lastSingleTap) {
        var rect = this._element.getBoundingClientRect();
        var pointer = this._touchState.pointers[0];
        var picked = this._viewer.pick({
          x: pointer.x - rect.left,
          y: pointer.y - rect.top
        });
        this._viewer._dispatchEvent(event, 'click', picked);
      }
    }
  };
  return TouchHandler;
}();
mouse = function () {
  function MouseHandler(canvas, viewer, cam, animationTime) {
    this._viewer = viewer;
    this._canvas = canvas;
    this._cam = cam;
    this._canvas = canvas;
    this._animationTime = animationTime;
    this._lastMouseUpTime = null;
    this._init();
  }
  MouseHandler.prototype = {
    _centerOnClicked: function (picked) {
      if (picked === null) {
        return;
      }
      this._viewer.setCenter(picked.pos(), this._animationTime);
    },
    _mouseUp: function (event) {
      var canvas = this._canvas;
      var currentTime = new Date().getTime();
      if ((this._lastMouseUpTime === null || currentTime - this._lastMouseUpTime > 300) & currentTime - this._lastMouseDownTime < 300) {
        var rect = this._canvas.domElement().getBoundingClientRect();
        var picked = this._viewer.pick({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
        this._viewer._dispatchEvent(event, 'click', picked);
      }
      this._lastMouseUpTime = currentTime;
      canvas.removeEventListener('mousemove', this._mouseRotateListener);
      canvas.removeEventListener('mousemove', this._mousePanListener);
      canvas.removeEventListener('mouseup', this._mouseUpListener);
      document.removeEventListener('mouseup', this._mouseUpListener);
      document.removeEventListener('mousemove', this._mouseRotateListener);
      document.removeEventListener('mousemove', this._mousePanListener);
    },
    setCam: function (cam) {
      this._cam = cam;
    },
    _init: function () {
      this._mousePanListener = utils.bind(this, this._mousePan);
      this._mouseRotateListener = utils.bind(this, this._mouseRotate);
      this._mouseUpListener = utils.bind(this, this._mouseUp);
      this._canvas.onWheel(utils.bind(this, this._mouseWheelFF), utils.bind(this, this._mouseWheel));
      this._canvas.on('dblclick', utils.bind(this, this._mouseDoubleClick));
      this._canvas.on('mousedown', utils.bind(this, this._mouseDown));
      return true;
    },
    _mouseWheel: function (event) {
      this._cam.zoom(event.wheelDelta < 0 ? -1 : 1);
      event.preventDefault();
      this._viewer.requestRedraw();
    },
    _mouseWheelFF: function (event) {
      this._cam.zoom(event.deltaY < 0 ? 1 : -1);
      event.preventDefault();
      this._viewer.requestRedraw();
    },
    _mouseDoubleClick: function () {
      return function (event) {
        var rect = this._canvas.domElement().getBoundingClientRect();
        var picked = this._viewer.pick({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
        this._viewer._dispatchEvent(event, 'doubleClick', picked);
        this._viewer.requestRedraw();
      };
    }(),
    _mouseDown: function (event) {
      if (event.button !== 0 && event.button !== 1) {
        return;
      }
      this._lastMouseDownTime = new Date().getTime();
      event.preventDefault();
      if (event.shiftKey === true || event.button === 1) {
        this._canvas.on('mousemove', this._mousePanListener);
        document.addEventListener('mousemove', this._mousePanListener, false);
      } else {
        this._canvas.on('mousemove', this._mouseRotateListener);
        document.addEventListener('mousemove', this._mouseRotateListener, false);
      }
      this._canvas.on('mouseup', this._mouseUpListener);
      document.addEventListener('mouseup', this._mouseUpListener, false);
      this._lastMousePos = {
        x: event.pageX,
        y: event.pageY
      };
    },
    _mouseRotate: function (event) {
      var newMousePos = {
        x: event.pageX,
        y: event.pageY
      };
      var delta = {
        x: newMousePos.x - this._lastMousePos.x,
        y: newMousePos.y - this._lastMousePos.y
      };
      var speed = 0.005;
      this._cam.rotateX(speed * delta.y);
      this._cam.rotateY(speed * delta.x);
      this._lastMousePos = newMousePos;
      this._viewer.requestRedraw();
    },
    _mousePan: function (event) {
      var newMousePos = {
        x: event.pageX,
        y: event.pageY
      };
      var delta = {
        x: newMousePos.x - this._lastMousePos.x,
        y: newMousePos.y - this._lastMousePos.y
      };
      var speed = 0.002 * Math.tan(0.5 * this._cam.fieldOfViewY()) * this._cam.zoom();
      this._cam.panXY(speed * delta.x, speed * delta.y);
      this._lastMousePos = newMousePos;
      this._viewer.requestRedraw();
    }
  };
  return MouseHandler;
}();
geom = function () {
  var vec3 = glMatrix.vec3;
  var vec4 = glMatrix.vec4;
  var mat3 = glMatrix.mat3;
  var quat = glMatrix.quat;
  var signedAngle = function () {
    var tmp = vec3.create();
    return function (a, b, c) {
      vec3.cross(tmp, a, b);
      return Math.atan2(vec3.dot(tmp, c), vec3.dot(a, b));
    };
  }();
  var ortho = function () {
    var tmp = vec3.create();
    return function (out, vec) {
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
  }();
  var axisRotation = function (out, axis, angle) {
    var sa = Math.sin(angle), ca = Math.cos(angle), x = axis[0], y = axis[1], z = axis[2], xx = x * x, xy = x * y, xz = x * z, yy = y * y, yz = y * z, zz = z * z;
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
  var cubicHermiteInterpolate = function () {
    var p = vec3.create();
    return function (out, p_k, m_k, p_kp1, m_kp1, t, index) {
      var tt = t * t;
      var three_minus_two_t = 3 - 2 * t;
      var h01 = tt * three_minus_two_t;
      var h00 = 1 - h01;
      var h10 = tt * (t - 2) + t;
      var h11 = tt * (t - 1);
      vec3.copy(p, p_k);
      vec3.scale(p, p, h00);
      vec3.scaleAndAdd(p, p, m_k, h10);
      vec3.scaleAndAdd(p, p, p_kp1, h01);
      vec3.scaleAndAdd(p, p, m_kp1, h11);
      out[index] = p[0];
      out[index + 1] = p[1];
      out[index + 2] = p[2];
    };
  }();
  function catmullRomSplineNumPoints(numPoints, subdiv, circular) {
    if (circular) {
      return numPoints * subdiv;
    } else {
      return subdiv * (numPoints - 1) + 1;
    }
  }
  function catmullRomSpline(points, numPoints, num, strength, circular, float32BufferPool) {
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
    var delta_t = 1 / num;
    var m_k = vec3.create(), m_kp1 = vec3.create();
    var p_k = vec3.create(), p_kp1 = vec3.create(), p_kp2 = vec3.create(), p_kp3 = vec3.create();
    var i, j, e;
    vec3.set(p_kp1, points[0], points[1], points[2]);
    vec3.set(p_kp2, points[3], points[4], points[5]);
    if (circular) {
      vec3.set(p_k, points[points.length - 3], points[points.length - 2], points[points.length - 1]);
      vec3.sub(m_k, p_kp2, p_k);
      vec3.scale(m_k, m_k, strength);
    } else {
      vec3.set(p_k, points[0], points[1], points[2]);
      vec3.set(m_k, 0, 0, 0);
    }
    for (i = 1, e = numPoints - 1; i < e; ++i) {
      vec3.set(p_kp3, points[3 * (i + 1)], points[3 * (i + 1) + 1], points[3 * (i + 1) + 2]);
      vec3.sub(m_kp1, p_kp3, p_kp1);
      vec3.scale(m_kp1, m_kp1, strength);
      for (j = 0; j < num; ++j) {
        cubicHermiteInterpolate(out, p_kp1, m_k, p_kp2, m_kp1, delta_t * j, index);
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
    this._radius = radius || 1;
  }
  var diagonalizer = function () {
    var Q = mat3.create();
    var D = mat3.create();
    var tmp1 = mat3.create();
    var tmp2 = mat3.create();
    var jr = quat.create();
    var offDiag = vec3.create();
    var magOffDiag = vec3.create();
    return function (a) {
      var maxsteps = 24;
      var q = quat.fromValues(0, 0, 0, 1);
      for (var i = 0; i < maxsteps; ++i) {
        mat3.fromQuat(Q, q);
        var transQ = mat3.transpose(tmp1, Q);
        mat3.mul(D, Q, mat3.mul(tmp2, a, transQ));
        vec3.set(offDiag, D[5], D[2], D[1]);
        vec3.set(magOffDiag, Math.abs(offDiag[0]), Math.abs(offDiag[1]), Math.abs(offDiag[2]));
        var k = magOffDiag[0] > magOffDiag[1] && magOffDiag[0] > magOffDiag[2] ? 0 : magOffDiag[1] > magOffDiag[2] ? 1 : 2;
        var k1 = (k + 1) % 3;
        var k2 = (k + 2) % 3;
        if (offDiag[k] === 0) {
          break;
        }
        var thet = (D[k2 * 3 + k2] - D[k1 * 3 + k1]) / (2 * offDiag[k]);
        var sgn = thet > 0 ? 1 : -1;
        thet *= sgn;
        var div = thet + (thet < 1000000 ? Math.sqrt(thet * thet + 1) : thet);
        var t = sgn / div;
        var c = 1 / Math.sqrt(t * t + 1);
        if (c === 1) {
          break;
        }
        vec4.set(jr, 0, 0, 0, 0);
        jr[k] = sgn * Math.sqrt((1 - c) / 2);
        jr[k] *= -1;
        jr[3] = Math.sqrt(1 - jr[k] * jr[k]);
        if (jr[3] === 1) {
          break;
        }
        q = quat.mul(q, q, jr);
        quat.normalize(q, q);
      }
      return q;
    };
  }();
  Sphere.prototype.center = function () {
    return this._center;
  };
  Sphere.prototype.radius = function () {
    return this._radius;
  };
  var buildRotation = function () {
    return function (rotation, tangent, left, up, use_left_hint) {
      if (use_left_hint) {
        vec3.cross(up, tangent, left);
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
    };
  }();
  function interpolateScalars(values, num) {
    var out = new Float32Array(num * (values.length - 1) + 1);
    var index = 0;
    var bf = 0, af = 0;
    var delta = 1 / num;
    for (var i = 0; i < values.length - 1; ++i) {
      bf = values[i];
      af = values[i + 1];
      for (var j = 0; j < num; ++j) {
        var t = delta * j;
        out[index + 0] = bf * (1 - t) + af * t;
        index += 1;
      }
    }
    out[index + 0] = af;
    return out;
  }
  return {
    signedAngle: signedAngle,
    axisRotation: axisRotation,
    ortho: ortho,
    diagonalizer: diagonalizer,
    catmullRomSpline: catmullRomSpline,
    cubicHermiteInterpolate: cubicHermiteInterpolate,
    interpolateScalars: interpolateScalars,
    catmullRomSplineNumPoints: catmullRomSplineNumPoints,
    Sphere: Sphere,
    buildRotation: buildRotation
  };
}();
gfxSceneNode = SceneNode = function () {
  function SceneNode(gl) {
    this._children = [];
    this._visible = true;
    this._name = name || '';
    this._gl = gl;
    this._order = 1;
  }
  SceneNode.prototype = {
    order: function (order) {
      if (order !== undefined) {
        this._order = order;
      }
      return this._order;
    },
    add: function (node) {
      this._children.push(node);
    },
    draw: function (cam, shaderCatalog, style, pass) {
      for (var i = 0, e = this._children.length; i !== e; ++i) {
        this._children[i].draw(cam, shaderCatalog, style, pass);
      }
    },
    show: function () {
      this._visible = true;
    },
    hide: function () {
      this._visible = false;
    },
    name: function (name) {
      if (name !== undefined) {
        this._name = name;
      }
      return this._name;
    },
    destroy: function () {
      for (var i = 0; i < this._children.length; ++i) {
        this._children[i].destroy();
      }
    },
    visible: function () {
      return this._visible;
    }
  };
  return SceneNode;
}();
gfxBaseGeom = BaseGeom = function () {
  var vec3 = glMatrix.vec3;
  function eachCentralAtomAsym(structure, callback) {
    structure.eachResidue(function (residue) {
      var centralAtom = residue.centralAtom();
      if (centralAtom === null) {
        return;
      }
      callback(centralAtom, centralAtom.pos());
    });
  }
  var eachCentralAtomSym = function () {
    var transformedPos = vec3.create();
    return function (structure, gens, callback) {
      for (var i = 0; i < gens.length; ++i) {
        var gen = gens[i];
        var chains = structure.chainsByName(gen.chains());
        for (var j = 0; j < gen.matrices().length; ++j) {
          var matrix = gen.matrix(j);
          for (var k = 0; k < chains.length; ++k) {
            var chain = chains[k];
            for (var l = 0; l < chain.residues().length; ++l) {
              var centralAtom = chain.residues()[l].centralAtom();
              if (centralAtom === null) {
                continue;
              }
              vec3.transformMat4(transformedPos, centralAtom.pos(), matrix);
              callback(centralAtom, transformedPos);
            }
          }
        }
      }
    };
  }();
  function BaseGeom(gl) {
    SceneNode.call(this, gl);
    this._idRanges = [];
    this._vertAssocs = [];
    this._showRelated = null;
    this._selection = null;
  }
  utils.derive(BaseGeom, SceneNode, {
    setShowRelated: function (rel) {
      if (rel && rel !== 'asym') {
        if (this.structure().assembly(rel) === null) {
          console.error('no assembly with name', rel, '. Falling back to asymmetric unit');
          return;
        }
      }
      this._showRelated = rel;
      return rel;
    },
    symWithIndex: function (index) {
      if (this.showRelated() === 'asym') {
        return null;
      }
      var assembly = this.structure().assembly(this.showRelated());
      if (!assembly) {
        return null;
      }
      var gen = assembly.generators();
      for (var i = 0; i < gen.length; ++i) {
        if (gen[i].matrices().length > index) {
          return gen[i].matrix(index);
        }
        index -= gen[i].matrices().length;
      }
      return null;
    },
    showRelated: function () {
      return this._showRelated;
    },
    select: function (what) {
      return this.structure().select(what);
    },
    structure: function () {
      return this._vertAssocs[0]._structure;
    },
    getColorForAtom: function (atom, color) {
      return this._vertAssocs[0].getColorForAtom(atom, color);
    },
    addIdRange: function (range) {
      this._idRanges.push(range);
    },
    destroy: function () {
      SceneNode.prototype.destroy.call(this);
      for (var i = 0; i < this._idRanges.length; ++i) {
        this._idRanges[i].recycle();
      }
    },
    eachCentralAtom: function (callback) {
      var go = this;
      var structure = go.structure();
      var assembly = structure.assembly(go.showRelated());
      if (assembly === null) {
        return eachCentralAtomAsym(structure, callback);
      }
      return eachCentralAtomSym(structure, assembly.generators(), callback);
    },
    addVertAssoc: function (assoc) {
      this._vertAssocs.push(assoc);
    },
    _vertArraysInvolving: function (chains) {
      var vertArrays = this.vertArrays();
      var selectedArrays = [];
      var set = {};
      for (var ci = 0; ci < chains.length; ++ci) {
        set[chains[ci]] = true;
      }
      for (var i = 0; i < vertArrays.length; ++i) {
        if (set[vertArrays[i].chain()] === true) {
          selectedArrays.push(vertArrays[i]);
        }
      }
      return selectedArrays;
    },
    _drawSymmetryRelated: function (cam, shader, assembly) {
      var gens = assembly.generators();
      for (var i = 0; i < gens.length; ++i) {
        var gen = gens[i];
        var affectedVAs = this._vertArraysInvolving(gen.chains());
        this._drawVertArrays(cam, shader, affectedVAs, gen.matrices());
      }
    },
    _updateProjectionIntervalsAsym: function (xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
      var vertArrays = this.vertArrays();
      for (var i = 0; i < vertArrays.length; ++i) {
        vertArrays[i].updateProjectionIntervals(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval);
      }
    },
    updateProjectionIntervals: function (xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
      if (!this._visible) {
        return;
      }
      var showRelated = this.showRelated();
      if (showRelated === 'asym') {
        return this._updateProjectionIntervalsAsym(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval);
      }
      var assembly = this.structure().assembly(showRelated);
      var gens = assembly.generators();
      for (var i = 0; i < gens.length; ++i) {
        var gen = gens[i];
        var affectedVAs = this._vertArraysInvolving(gen.chains());
        for (var j = 0; j < gen.matrices().length; ++j) {
          for (var k = 0; k < affectedVAs.length; ++k) {
            var transform = gen.matrix(j);
            affectedVAs[k].updateProjectionIntervals(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval, transform);
          }
        }
      }
    },
    _updateSquaredSphereRadiusAsym: function (center, radius) {
      var vertArrays = this.vertArrays();
      for (var i = 0; i < vertArrays.length; ++i) {
        radius = vertArrays[i].updateSquaredSphereRadius(center, radius);
      }
      return radius;
    },
    updateSquaredSphereRadius: function (center, radius) {
      if (!this._visible) {
        return radius;
      }
      var showRelated = this.showRelated();
      if (showRelated === 'asym') {
        return this._updateSquaredSphereRadiusAsym(center, radius);
      }
      var assembly = this.structure().assembly(showRelated);
      var gens = assembly.generators();
      for (var i = 0; i < gens.length; ++i) {
        var gen = gens[i];
        var affectedVAs = this._vertArraysInvolving(gen.chains());
        for (var j = 0; j < gen.matrices().length; ++j) {
          for (var k = 0; k < affectedVAs.length; ++k) {
            radius = affectedVAs[k].updateSquaredSphereRadius(center, radius);
          }
        }
      }
      return radius;
    },
    draw: function (cam, shaderCatalog, style, pass) {
      if (!this._visible) {
        return;
      }
      var shader = this.shaderForStyleAndPass(shaderCatalog, style, pass);
      if (!shader) {
        return;
      }
      var showRelated = this.showRelated();
      if (showRelated === 'asym') {
        return this._drawVertArrays(cam, shader, this.vertArrays(), null);
      }
      var assembly = this.structure().assembly(showRelated);
      return this._drawSymmetryRelated(cam, shader, assembly);
    },
    colorBy: function (colorFunc, view) {
      console.time('BaseGeom.colorBy');
      this._ready = false;
      view = view || this.structure();
      for (var i = 0; i < this._vertAssocs.length; ++i) {
        this._vertAssocs[i].recolor(colorFunc, view);
      }
      console.timeEnd('BaseGeom.colorBy');
    },
    setOpacity: function (val, view) {
      console.time('BaseGeom.setOpacity');
      this._ready = false;
      view = view || this.structure();
      for (var i = 0; i < this._vertAssocs.length; ++i) {
        this._vertAssocs[i].setOpacity(val, view);
      }
      console.timeEnd('BaseGeom.setOpacity');
    },
    setSelection: function (view) {
      console.time('BaseGeom.setSelection');
      this._selection = view;
      this._ready = false;
      for (var i = 0; i < this._vertAssocs.length; ++i) {
        this._vertAssocs[i].setSelection(view);
      }
      console.timeEnd('BaseGeom.setSelection');
    },
    selection: function () {
      if (this._selection === null) {
        this._selection = this.structure().createEmptyView();
      }
      return this._selection;
    }
  });
  return BaseGeom;
}();
gfxVertexArrayBase = VertexArrayBase = function () {
  var vec3 = glMatrix.vec3;
  function VertexArrayBase(gl, numVerts, float32Allocator) {
    this._gl = gl;
    this._vertBuffer = gl.createBuffer();
    this._float32Allocator = float32Allocator || null;
    this._ready = false;
    this._boundingSphere = null;
    var numFloats = this._FLOATS_PER_VERT * numVerts;
    this._vertData = float32Allocator.request(numFloats);
  }
  VertexArrayBase.prototype = {
    setColor: function (index, r, g, b, a) {
      var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
      this._vertData[colorStart + 0] = r;
      this._vertData[colorStart + 1] = g;
      this._vertData[colorStart + 2] = b;
      this._vertData[colorStart + 3] = a;
      this._ready = false;
    },
    getColor: function (index, color) {
      var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
      color[0] = this._vertData[colorStart + 0];
      color[1] = this._vertData[colorStart + 1];
      color[2] = this._vertData[colorStart + 2];
      color[3] = this._vertData[colorStart + 3];
      return color;
    },
    setOpacity: function (index, a) {
      var colorStart = index * this._FLOATS_PER_VERT + this._COLOR_OFFSET;
      this._vertData[colorStart + 3] = a;
      this._ready = false;
    },
    setSelected: function (index, a) {
      var selected = index * this._FLOATS_PER_VERT + this._SELECT_OFFSET;
      this._vertData[selected] = a;
      this._ready = false;
    },
    boundingSphere: function () {
      if (!this._boundingSphere) {
        this._boundingSphere = this._calculateBoundingSphere();
      }
      return this._boundingSphere;
    },
    _calculateBoundingSphere: function () {
      var numVerts = this.numVerts();
      if (numVerts === 0) {
        return null;
      }
      var center = vec3.create();
      var index, i;
      for (i = 0; i < numVerts; ++i) {
        index = i * this._FLOATS_PER_VERT;
        center[0] += this._vertData[index + 0];
        center[1] += this._vertData[index + 1];
        center[2] += this._vertData[index + 2];
      }
      vec3.scale(center, center, 1 / numVerts);
      var radiusSquare = 0;
      for (i = 0; i < numVerts; ++i) {
        index = i * this._FLOATS_PER_VERT;
        var dx = center[0] - this._vertData[index + 0];
        var dy = center[1] - this._vertData[index + 1];
        var dz = center[2] - this._vertData[index + 2];
        radiusSquare = Math.max(radiusSquare, dx * dx + dy * dy + dz * dz);
      }
      return new geom.Sphere(center, Math.sqrt(radiusSquare));
    },
    destroy: function () {
      this._gl.deleteBuffer(this._vertBuffer);
      this._float32Allocator.release(this._vertData);
    },
    bindBuffers: function () {
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
      if (this._ready) {
        return;
      }
      this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertData, this._gl.STATIC_DRAW);
      this._ready = true;
    },
    updateSquaredSphereRadius: function () {
      var transformedCenter = vec3.create();
      return function (sphereCenter, radius, transform) {
        var bounds = this.boundingSphere();
        if (!bounds) {
          return radius;
        }
        if (transform) {
          vec3.transformMat4(transformedCenter, bounds.center(), transform);
          return Math.max(vec3.sqrDist(transformedCenter, sphereCenter), radius);
        }
        var sphereRadSquare = bounds.radius() * bounds.radius();
        return Math.max(vec3.sqrDist(bounds.center(), sphereCenter) + sphereRadSquare, radius);
      };
    }(),
    updateProjectionIntervals: function () {
      var transformedCenter = vec3.create();
      return function (xAxis, yAxis, zAxis, xInterval, yInterval, zInterval, transform) {
        var bounds = this.boundingSphere();
        if (!bounds) {
          return;
        }
        if (transform) {
          vec3.transformMat4(transformedCenter, bounds.center(), transform);
        } else {
          vec3.copy(transformedCenter, bounds.center());
        }
        var xProjected = vec3.dot(xAxis, transformedCenter);
        var yProjected = vec3.dot(yAxis, transformedCenter);
        var zProjected = vec3.dot(zAxis, transformedCenter);
        xInterval.update(xProjected - bounds.radius());
        xInterval.update(xProjected + bounds.radius());
        yInterval.update(yProjected - bounds.radius());
        yInterval.update(yProjected + bounds.radius());
        zInterval.update(zProjected - bounds.radius());
        zInterval.update(zProjected + bounds.radius());
      };
    }()
  };
  return VertexArrayBase;
}();
gfxVertexArray = function () {
  function VertexArray(gl, numVerts, float32Allocator) {
    VertexArrayBase.call(this, gl, numVerts, float32Allocator);
    this._numVerts = 0;
    this._primitiveType = this._gl.LINES;
  }
  utils.derive(VertexArray, VertexArrayBase, {
    _FLOATS_PER_VERT: 9,
    _POS_OFFSET: 0,
    _COLOR_OFFSET: 3,
    _ID_OFFSET: 7,
    _SELECT_OFFSET: 8,
    numVerts: function () {
      return this._numVerts;
    },
    setDrawAsPoints: function (enable) {
      if (enable) {
        this._primitiveType = this._gl.POINTS;
      } else {
        this._primitiveType = this._gl.LINES;
      }
    },
    addPoint: function (pos, color, id) {
      var index = this._FLOATS_PER_VERT * this._numVerts;
      this._vertData[index++] = pos[0];
      this._vertData[index++] = pos[1];
      this._vertData[index++] = pos[2];
      this._vertData[index++] = color[0];
      this._vertData[index++] = color[1];
      this._vertData[index++] = color[2];
      this._vertData[index++] = color[3];
      this._vertData[index++] = id;
      this._vertData[index++] = 0;
      this._numVerts += 1;
      this._ready = false;
      this._boundingSphere = null;
    },
    addLine: function (startPos, startColor, endPos, endColor, idOne, idTwo) {
      this.addPoint(startPos, startColor, idOne);
      this.addPoint(endPos, endColor, idTwo);
    },
    bindAttribs: function (shader) {
      this._gl.vertexAttribPointer(shader.posAttrib, 3, this._gl.FLOAT, false, this._FLOATS_PER_VERT * 4, this._POS_OFFSET * 4);
      if (shader.colorAttrib !== -1) {
        this._gl.vertexAttribPointer(shader.colorAttrib, 4, this._gl.FLOAT, false, this._FLOATS_PER_VERT * 4, this._COLOR_OFFSET * 4);
        this._gl.enableVertexAttribArray(shader.colorAttrib);
      }
      this._gl.enableVertexAttribArray(shader.posAttrib);
      if (shader.objIdAttrib !== -1) {
        this._gl.vertexAttribPointer(shader.objIdAttrib, 1, this._gl.FLOAT, false, this._FLOATS_PER_VERT * 4, this._ID_OFFSET * 4);
        this._gl.enableVertexAttribArray(shader.objIdAttrib);
      }
      if (shader.selectAttrib !== -1) {
        this._gl.vertexAttribPointer(shader.selectAttrib, 1, this._gl.FLOAT, false, this._FLOATS_PER_VERT * 4, this._SELECT_OFFSET * 4);
        this._gl.enableVertexAttribArray(shader.selectAttrib);
      }
    },
    releaseAttribs: function (shader) {
      this._gl.disableVertexAttribArray(shader.posAttrib);
      if (shader.colorAttrib !== -1) {
        this._gl.disableVertexAttribArray(shader.colorAttrib);
      }
      if (shader.objIdAttrib !== -1) {
        this._gl.disableVertexAttribArray(shader.objIdAttrib);
      }
      if (shader.selectAttrib !== -1) {
        this._gl.disableVertexAttribArray(shader.selectAttrib);
      }
    },
    bind: function (shader) {
      this.bindBuffers();
      this.bindAttribs(shader);
    },
    draw: function () {
      this._gl.drawArrays(this._primitiveType, 0, this._numVerts);
    }
  });
  return VertexArray;
}();
gfxIndexedVertexArray = IndexedVertexArray = function () {
  function IndexedVertexArray(gl, numVerts, numIndices, float32Allocator, uint16Allocator) {
    VertexArrayBase.call(this, gl, numVerts, float32Allocator);
    this._indexBuffer = gl.createBuffer();
    this._uint16Allocator = uint16Allocator;
    this._numVerts = 0;
    this._maxVerts = numVerts;
    this._numTriangles = 0;
    this._indexData = uint16Allocator.request(numIndices);
  }
  utils.derive(IndexedVertexArray, VertexArrayBase, {
    destroy: function () {
      VertexArrayBase.prototype.destroy.call(this);
      this._gl.deleteBuffer(this._indexBuffer);
      this._uint16Allocator.release(this._indexData);
    },
    setIndexData: function (data) {
      this._ready = false;
      this._numTriangles = data.length / 3;
      for (var i = 0; i < data.length; ++i) {
        this._indexData[i] = data[i];
      }
    },
    setVertData: function (data) {
      this._ready = false;
      this._numVerts = data.length / this._FLOATS_PER_VERT;
      for (var i = 0; i < data.length; ++i) {
        this._vertData[i] = data[i];
      }
    },
    numVerts: function () {
      return this._numVerts;
    },
    maxVerts: function () {
      return this._maxVerts;
    },
    numIndices: function () {
      return this._numTriangles * 3;
    },
    addVertex: function (pos, normal, color, objId) {
      if (this._numVerts === this._maxVerts) {
        console.error('maximum number of vertices reached');
        return;
      }
      var i = this._numVerts * this._FLOATS_PER_VERT;
      this._vertData[i++] = pos[0];
      this._vertData[i++] = pos[1];
      this._vertData[i++] = pos[2];
      this._vertData[i++] = normal[0];
      this._vertData[i++] = normal[1];
      this._vertData[i++] = normal[2];
      this._vertData[i++] = color[0];
      this._vertData[i++] = color[1];
      this._vertData[i++] = color[2];
      this._vertData[i++] = color[3];
      this._vertData[i++] = objId;
      this._vertData[i++] = 0;
      this._numVerts += 1;
      this._ready = false;
    },
    _FLOATS_PER_VERT: 12,
    _BYTES_PER_VERT: 12 * 4,
    _OBJID_OFFSET: 10,
    _OBJID_BYTE_OFFSET: 10 * 4,
    _SELECT_OFFSET: 11,
    _SELECT_BYTE_OFFSET: 11 * 4,
    _COLOR_OFFSET: 6,
    _COLOR_BYTE_OFFSET: 6 * 4,
    _NORMAL_OFFSET: 3,
    _NORMAL_BYTE_OFFSET: 3 * 4,
    _POS_OFFSET: 0,
    _POS_BYTE_OFFSET: 0 * 4,
    addTriangle: function (idx1, idx2, idx3) {
      var index = 3 * this._numTriangles;
      if (index + 2 >= this._indexData.length) {
        return;
      }
      this._indexData[index++] = idx1;
      this._indexData[index++] = idx2;
      this._indexData[index++] = idx3;
      this._numTriangles += 1;
      this._ready = false;
    },
    bindBuffers: function () {
      var ready = this._ready;
      var gl = this._gl;
      VertexArrayBase.prototype.bindBuffers.call(this);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
      if (ready) {
        return;
      }
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexData, gl.STATIC_DRAW);
    },
    bindAttribs: function (shader) {
      var gl = this._gl;
      var byteStride = this._BYTES_PER_VERT;
      gl.enableVertexAttribArray(shader.posAttrib);
      gl.vertexAttribPointer(shader.posAttrib, 3, gl.FLOAT, false, byteStride, this._POS_BYTE_OFFSET);
      if (shader.normalAttrib !== -1) {
        gl.enableVertexAttribArray(shader.normalAttrib);
        gl.vertexAttribPointer(shader.normalAttrib, 3, gl.FLOAT, false, byteStride, this._NORMAL_BYTE_OFFSET);
      }
      if (shader.colorAttrib !== -1) {
        gl.vertexAttribPointer(shader.colorAttrib, 4, gl.FLOAT, false, byteStride, this._COLOR_BYTE_OFFSET);
        gl.enableVertexAttribArray(shader.colorAttrib);
      }
      if (shader.objIdAttrib !== -1) {
        gl.vertexAttribPointer(shader.objIdAttrib, 1, gl.FLOAT, false, byteStride, this._OBJID_BYTE_OFFSET);
        gl.enableVertexAttribArray(shader.objIdAttrib);
      }
      if (shader.selectAttrib !== -1) {
        gl.vertexAttribPointer(shader.selectAttrib, 1, gl.FLOAT, false, byteStride, this._SELECT_BYTE_OFFSET);
        gl.enableVertexAttribArray(shader.selectAttrib);
      }
    },
    releaseAttribs: function (shader) {
      var gl = this._gl;
      gl.disableVertexAttribArray(shader.posAttrib);
      if (shader.colorAttrib !== -1) {
        gl.disableVertexAttribArray(shader.colorAttrib);
      }
      if (shader.normalAttrib !== -1) {
        gl.disableVertexAttribArray(shader.normalAttrib);
      }
      if (shader.objIdAttrib !== -1) {
        gl.disableVertexAttribArray(shader.objIdAttrib);
      }
      if (shader.selectAttrib !== -1) {
        gl.disableVertexAttribArray(shader.selectAttrib);
      }
    },
    bind: function (shader) {
      this.bindBuffers();
      this.bindAttribs(shader);
    },
    draw: function () {
      var gl = this._gl;
      gl.drawElements(gl.TRIANGLES, this._numTriangles * 3, gl.UNSIGNED_SHORT, 0);
    }
  });
  return IndexedVertexArray;
}();
gfxChainData = function (VertexArray) {
  function LineChainData(chain, gl, numVerts, float32Allocator) {
    VertexArray.call(this, gl, numVerts, float32Allocator);
    this._chain = chain;
  }
  utils.derive(LineChainData, VertexArray, {
    chain: function () {
      return this._chain;
    },
    drawSymmetryRelated: function (cam, shader, transforms) {
      this.bind(shader);
      for (var i = 0; i < transforms.length; ++i) {
        cam.bind(shader, transforms[i]);
        this._gl.uniform1i(shader.symId, i);
        this.draw();
      }
      this.releaseAttribs(shader);
    }
  });
  function MeshChainData(chain, gl, numVerts, numIndices, float32Allocator, uint16Allocator) {
    IndexedVertexArray.call(this, gl, numVerts, numIndices, float32Allocator, uint16Allocator);
    this._chain = chain;
  }
  utils.derive(MeshChainData, IndexedVertexArray, {
    chain: function () {
      return this._chain;
    }
  });
  MeshChainData.prototype.drawSymmetryRelated = LineChainData.prototype.drawSymmetryRelated;
  return {
    LineChainData: LineChainData,
    MeshChainData: MeshChainData
  };
}(gfxVertexArray);
gfxMeshGeom = MeshGeom = function (cd) {
  var MeshChainData = cd.MeshChainData;
  function MeshGeom(gl, float32Allocator, uint16Allocator) {
    BaseGeom.call(this, gl);
    this._indexedVAs = [];
    this._float32Allocator = float32Allocator;
    this._uint16Allocator = uint16Allocator;
    this._remainingVerts = null;
    this._remainingIndices = null;
  }
  utils.derive(MeshGeom, BaseGeom, {
    _boundedVertArraySize: function (size) {
      return Math.min(65536, size);
    },
    addChainVertArray: function (chain, numVerts, numIndices) {
      this._remainingVerts = numVerts;
      this._remainingIndices = numIndices;
      var newVa = new MeshChainData(chain.name(), this._gl, this._boundedVertArraySize(numVerts), numIndices, this._float32Allocator, this._uint16Allocator);
      this._indexedVAs.push(newVa);
      return newVa;
    },
    addVertArray: function (numVerts, numIndices) {
      this._remainingVerts = numVerts;
      this._remainingIndices = numIndices;
      var newVa = new IndexedVertexArray(this._gl, this._boundedVertArraySize(numVerts), numIndices, this._float32Allocator, this._uint16Allocator);
      this._indexedVAs.push(newVa);
      return newVa;
    },
    vertArrayWithSpaceFor: function (numVerts) {
      var currentVa = this._indexedVAs[this._indexedVAs.length - 1];
      var remaining = currentVa.maxVerts() - currentVa.numVerts();
      if (remaining >= numVerts) {
        return currentVa;
      }
      this._remainingVerts -= currentVa.numVerts();
      this._remainingIndices -= currentVa.numIndices();
      numVerts = this._boundedVertArraySize(this._remainingVerts);
      var newVa = null;
      if (currentVa instanceof MeshChainData) {
        newVa = new MeshChainData(currentVa.chain(), this._gl, numVerts, this._remainingIndices, this._float32Allocator, this._uint16Allocator);
      } else {
        newVa = new IndexedVertexArray(this._gl, numVerts, this._remainingIndices, this._float32Allocator, this._uint16Allocator);
      }
      this._indexedVAs.push(newVa);
      return newVa;
    },
    vertArray: function (index) {
      return this._indexedVAs[index];
    },
    destroy: function () {
      BaseGeom.prototype.destroy.call(this);
      for (var i = 0; i < this._indexedVAs.length; ++i) {
        this._indexedVAs[i].destroy();
      }
      this._indexedVAs = [];
    },
    numVerts: function () {
      return this._indexedVAs[0].numVerts();
    },
    shaderForStyleAndPass: function (shaderCatalog, style, pass) {
      if (pass === 'normal') {
        if (style === 'hemilight') {
          return shaderCatalog.hemilight;
        } else {
          return shaderCatalog.phong;
        }
      }
      if (pass === 'select') {
        return shaderCatalog.select;
      }
      if (pass === 'outline') {
        return shaderCatalog.outline;
      }
      var shader = shaderCatalog[pass];
      return shader !== undefined ? shader : null;
    },
    _drawVertArrays: function (cam, shader, indexedVAs, additionalTransforms) {
      var i;
      if (additionalTransforms) {
        for (i = 0; i < indexedVAs.length; ++i) {
          indexedVAs[i].drawSymmetryRelated(cam, shader, additionalTransforms);
        }
      } else {
        cam.bind(shader);
        this._gl.uniform1i(shader.symId, 255);
        for (i = 0; i < indexedVAs.length; ++i) {
          indexedVAs[i].bind(shader);
          indexedVAs[i].draw();
          indexedVAs[i].releaseAttribs(shader);
        }
      }
    },
    vertArrays: function () {
      return this._indexedVAs;
    },
    addVertex: function (pos, normal, color, objId) {
      var va = this._indexedVAs[0];
      va.addVertex(pos, normal, color, objId);
    },
    addTriangle: function (idx1, idx2, idx3) {
      var va = this._indexedVAs[0];
      va.addTriangle(idx1, idx2, idx3);
    }
  });
  return MeshGeom;
}(gfxChainData);
gfxBillboardGeom = function () {
  function BillboardGeom(gl, float32Allocator, uint16Allocator) {
    MeshGeom.call(this, gl, float32Allocator, uint16Allocator);
  }
  utils.derive(BillboardGeom, MeshGeom, {
    draw: function (cam, shaderCatalog, style, pass) {
      this._gl.disable(this._gl.CULL_FACE);
      MeshGeom.prototype.draw.call(this, cam, shaderCatalog, style, pass);
      this._gl.enable(this._gl.CULL_FACE);
    },
    shaderForStyleAndPass: function (shaderCatalog, style, pass) {
      if (pass === 'normal') {
        return shaderCatalog.spheres;
      }
      if (pass === 'select') {
        return shaderCatalog.selectSpheres;
      }
      return null;
    }
  });
  return BillboardGeom;
}();
gfxLineGeom = function (chainData) {
  var LineChainData = chainData.LineChainData;
  function LineGeom(gl, float32Allocator) {
    BaseGeom.call(this, gl);
    this._vertArrays = [];
    this._float32Allocator = float32Allocator;
    this._lineWidth = 0.5;
    this._pointSize = 1;
  }
  utils.derive(LineGeom, BaseGeom, {
    addChainVertArray: function (chain, numVerts) {
      var va = new LineChainData(chain.name(), this._gl, numVerts, this._float32Allocator);
      this._vertArrays.push(va);
      return va;
    },
    setLineWidth: function (width) {
      this._lineWidth = width;
    },
    setPointSize: function (size) {
      this._pointSize = size;
    },
    vertArrays: function () {
      return this._vertArrays;
    },
    shaderForStyleAndPass: function (shaderCatalog, style, pass) {
      if (pass === 'outline') {
        return shaderCatalog.selectLines;
      }
      if (pass === 'select') {
        return shaderCatalog.select;
      }
      return shaderCatalog.lines;
    },
    destroy: function () {
      BaseGeom.prototype.destroy.call(this);
      for (var i = 0; i < this._vertArrays.length; ++i) {
        this._vertArrays[i].destroy();
      }
      this._vertArrays = [];
    },
    _drawVertArrays: function (cam, shader, vertArrays, additionalTransforms) {
      var pointSizeMul = cam.upsamplingFactor();
      if (shader.selectAttrib !== -1) {
        pointSizeMul = 4 * cam.upsamplingFactor();
      }
      var i;
      if (additionalTransforms) {
        cam.bind(shader);
        this._gl.lineWidth(pointSizeMul * this._lineWidth);
        if (shader.pointSize) {
          this._gl.uniform1f(shader.pointSize, pointSizeMul * this._pointSize);
        }
        for (i = 0; i < vertArrays.length; ++i) {
          vertArrays[i].drawSymmetryRelated(cam, shader, additionalTransforms);
        }
      } else {
        cam.bind(shader);
        this._gl.lineWidth(pointSizeMul * this._lineWidth);
        this._gl.uniform1i(shader.symId, 255);
        if (shader.pointSize) {
          this._gl.uniform1f(shader.pointSize, pointSizeMul * this._pointSize);
        }
        for (i = 0; i < vertArrays.length; ++i) {
          vertArrays[i].bind(shader);
          vertArrays[i].draw();
          vertArrays[i].releaseAttribs(shader);
        }
      }
    },
    vertArray: function () {
      return this._va;
    }
  });
  return LineGeom;
}(gfxChainData);
gfxGeomBuilders = function () {
  var vec3 = glMatrix.vec3;
  function ProtoSphere(stacks, arcs) {
    this._arcs = arcs;
    this._stacks = stacks;
    this._indices = new Uint16Array(3 * arcs * stacks * 2);
    this._verts = new Float32Array(3 * arcs * stacks);
    var vert_angle = Math.PI / (stacks - 1);
    var horz_angle = Math.PI * 2 / arcs;
    var i, j;
    for (i = 0; i < this._stacks; ++i) {
      var radius = Math.sin(i * vert_angle);
      var z = Math.cos(i * vert_angle);
      for (j = 0; j < this._arcs; ++j) {
        var nx = radius * Math.cos(j * horz_angle);
        var ny = radius * Math.sin(j * horz_angle);
        this._verts[3 * (j + i * this._arcs)] = nx;
        this._verts[3 * (j + i * this._arcs) + 1] = ny;
        this._verts[3 * (j + i * this._arcs) + 2] = z;
      }
    }
    var index = 0;
    for (i = 0; i < this._stacks - 1; ++i) {
      for (j = 0; j < this._arcs; ++j) {
        this._indices[index] = i * this._arcs + j;
        this._indices[index + 1] = i * this._arcs + (j + 1) % this._arcs;
        this._indices[index + 2] = (i + 1) * this._arcs + j;
        index += 3;
        this._indices[index] = i * this._arcs + (j + 1) % this._arcs;
        this._indices[index + 1] = (i + 1) * this._arcs + (j + 1) % this._arcs;
        this._indices[index + 2] = (i + 1) * this._arcs + j;
        index += 3;
      }
    }
  }
  ProtoSphere.prototype = {
    addTransformed: function () {
      var pos = vec3.create(), normal = vec3.create();
      return function (va, center, radius, color, objId) {
        var baseIndex = va.numVerts();
        for (var i = 0; i < this._stacks * this._arcs; ++i) {
          vec3.set(normal, this._verts[3 * i], this._verts[3 * i + 1], this._verts[3 * i + 2]);
          vec3.copy(pos, normal);
          vec3.scale(pos, pos, radius);
          vec3.add(pos, pos, center);
          va.addVertex(pos, normal, color, objId);
        }
        for (i = 0; i < this._indices.length / 3; ++i) {
          va.addTriangle(baseIndex + this._indices[i * 3], baseIndex + this._indices[i * 3 + 1], baseIndex + this._indices[i * 3 + 2]);
        }
      };
    }(),
    numIndices: function () {
      return this._indices.length;
    },
    numVerts: function () {
      return this._verts.length / 3;
    }
  };
  function TubeProfile(points, num, strength) {
    var interpolated = geom.catmullRomSpline(points, points.length / 3, num, strength, true);
    this._indices = new Uint16Array(interpolated.length * 2);
    this._verts = interpolated;
    this._normals = new Float32Array(interpolated.length);
    this._arcs = interpolated.length / 3;
    var normal = vec3.create();
    for (var i = 0; i < this._arcs; ++i) {
      var i_prev = i === 0 ? this._arcs - 1 : i - 1;
      var i_next = i === this._arcs - 1 ? 0 : i + 1;
      normal[0] = this._verts[3 * i_next + 1] - this._verts[3 * i_prev + 1];
      normal[1] = this._verts[3 * i_prev] - this._verts[3 * i_next];
      vec3.normalize(normal, normal);
      this._normals[3 * i] = normal[0];
      this._normals[3 * i + 1] = normal[1];
      this._normals[3 * i + 2] = normal[2];
    }
    for (i = 0; i < this._arcs; ++i) {
      this._indices[6 * i] = i;
      this._indices[6 * i + 1] = i + this._arcs;
      this._indices[6 * i + 2] = (i + 1) % this._arcs + this._arcs;
      this._indices[6 * i + 3] = i;
      this._indices[6 * i + 4] = (i + 1) % this._arcs + this._arcs;
      this._indices[6 * i + 5] = (i + 1) % this._arcs;
    }
  }
  TubeProfile.prototype = {
    addTransformed: function () {
      var pos = vec3.create(), normal = vec3.create();
      return function (vertArray, center, radius, rotation, color, first, offset, objId) {
        var arcs = this._arcs;
        var norms = this._normals;
        var verts = this._verts;
        var baseIndex = vertArray.numVerts() - arcs;
        for (var i = 0; i < arcs; ++i) {
          vec3.set(pos, radius * verts[3 * i], radius * verts[3 * i + 1], 0);
          vec3.transformMat3(pos, pos, rotation);
          vec3.add(pos, pos, center);
          vec3.set(normal, norms[3 * i], norms[3 * i + 1], 0);
          vec3.transformMat3(normal, normal, rotation);
          vertArray.addVertex(pos, normal, color, objId);
        }
        if (first) {
          return;
        }
        if (offset === 0) {
          for (i = 0; i < this._indices.length / 3; ++i) {
            vertArray.addTriangle(baseIndex + this._indices[i * 3], baseIndex + this._indices[i * 3 + 1], baseIndex + this._indices[i * 3 + 2]);
          }
          return;
        }
        for (i = 0; i < arcs; ++i) {
          vertArray.addTriangle(baseIndex + (i + offset) % arcs, baseIndex + i + arcs, baseIndex + (i + 1) % arcs + arcs);
          vertArray.addTriangle(baseIndex + (i + offset) % arcs, baseIndex + (i + 1) % arcs + arcs, baseIndex + (i + 1 + offset) % arcs);
        }
      };
    }()
  };
  function ProtoCylinder(arcs) {
    this._arcs = arcs;
    this._indices = new Uint16Array(arcs * 3 * 2);
    this._verts = new Float32Array(3 * arcs * 2);
    this._normals = new Float32Array(3 * arcs * 2);
    var angle = Math.PI * 2 / this._arcs;
    for (var i = 0; i < this._arcs; ++i) {
      var cos_angle = Math.cos(angle * i);
      var sin_angle = Math.sin(angle * i);
      this._verts[3 * i] = cos_angle;
      this._verts[3 * i + 1] = sin_angle;
      this._verts[3 * i + 2] = -0.5;
      this._verts[3 * arcs + 3 * i] = cos_angle;
      this._verts[3 * arcs + 3 * i + 1] = sin_angle;
      this._verts[3 * arcs + 3 * i + 2] = 0.5;
      this._normals[3 * i] = cos_angle;
      this._normals[3 * i + 1] = sin_angle;
      this._normals[3 * arcs + 3 * i] = cos_angle;
      this._normals[3 * arcs + 3 * i + 1] = sin_angle;
    }
    for (i = 0; i < this._arcs; ++i) {
      this._indices[6 * i] = i % this._arcs;
      this._indices[6 * i + 1] = arcs + (i + 1) % this._arcs;
      this._indices[6 * i + 2] = (i + 1) % this._arcs;
      this._indices[6 * i + 3] = i % this._arcs;
      this._indices[6 * i + 4] = arcs + i % this._arcs;
      this._indices[6 * i + 5] = arcs + (i + 1) % this._arcs;
    }
  }
  ProtoCylinder.prototype = {
    numVerts: function () {
      return this._verts.length / 3;
    },
    numIndices: function () {
      return this._indices.length;
    },
    addTransformed: function () {
      var pos = vec3.create(), normal = vec3.create();
      return function (va, center, length, radius, rotation, colorOne, colorTwo, idOne, idTwo) {
        var baseIndex = va.numVerts();
        var verts = this._verts;
        var norms = this._normals;
        var arcs = this._arcs;
        for (var i = 0; i < 2 * arcs; ++i) {
          vec3.set(pos, radius * verts[3 * i], radius * verts[3 * i + 1], length * verts[3 * i + 2]);
          vec3.transformMat3(pos, pos, rotation);
          vec3.add(pos, pos, center);
          vec3.set(normal, norms[3 * i], norms[3 * i + 1], norms[3 * i + 2]);
          vec3.transformMat3(normal, normal, rotation);
          var objId = i < arcs ? idOne : idTwo;
          va.addVertex(pos, normal, i < arcs ? colorOne : colorTwo, objId);
        }
        var indices = this._indices;
        for (i = 0; i < indices.length / 3; ++i) {
          va.addTriangle(baseIndex + indices[i * 3], baseIndex + indices[i * 3 + 1], baseIndex + indices[i * 3 + 2]);
        }
      };
    }()
  };
  return {
    TubeProfile: TubeProfile,
    ProtoCylinder: ProtoCylinder,
    ProtoSphere: ProtoSphere
  };
}();
gfxVertAssoc = function () {
  function AtomVertexAssoc(structure, callColoringBeginEnd) {
    this._structure = structure;
    this._assocs = [];
    this._callBeginEnd = callColoringBeginEnd;
  }
  AtomVertexAssoc.prototype = {
    addAssoc: function (atom, va, vertStart, vertEnd) {
      this._assocs.push({
        atom: atom,
        vertexArray: va,
        vertStart: vertStart,
        vertEnd: vertEnd
      });
    },
    recolor: function (colorOp, view) {
      var colorData = new Float32Array(view.atomCount() * 4);
      if (this._callBeginEnd) {
        colorOp.begin(this._structure);
      }
      var atomMap = {};
      view.eachAtom(function (atom, index) {
        atomMap[atom.index()] = index;
        colorOp.colorFor(atom, colorData, index * 4);
      });
      if (this._callBeginEnd) {
        colorOp.end(this._structure);
      }
      for (var i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        var ai = atomMap[assoc.atom.index()];
        if (ai === undefined) {
          continue;
        }
        var r = colorData[ai * 4 + 0], g = colorData[ai * 4 + 1], b = colorData[ai * 4 + 2], a = colorData[ai * 4 + 3];
        var va = assoc.vertexArray;
        for (var j = assoc.vertStart; j < assoc.vertEnd; ++j) {
          va.setColor(j, r, g, b, a);
        }
      }
    },
    getColorForAtom: function (atom, color) {
      for (var i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        if (assoc.atom.full() === atom.full()) {
          return assoc.vertexArray.getColor(assoc.vertStart, color);
        }
      }
      return null;
    },
    setSelection: function (view) {
      var atomMap = {};
      view.eachAtom(function (atom) {
        atomMap[atom.index()] = true;
      });
      for (var i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        var ai = atomMap[assoc.atom.index()];
        var selected = ai !== true ? 0 : 1;
        var va = assoc.vertexArray;
        for (var j = assoc.vertStart; j < assoc.vertEnd; ++j) {
          va.setSelected(j, selected);
        }
      }
    },
    setOpacity: function (val, view) {
      var atomMap = {};
      view.eachAtom(function (atom) {
        atomMap[atom.index()] = true;
      });
      for (var i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        var ai = atomMap[assoc.atom.index()];
        if (ai !== true) {
          continue;
        }
        var va = assoc.vertexArray;
        for (var j = assoc.vertStart; j < assoc.vertEnd; ++j) {
          va.setOpacity(j, val);
        }
      }
    }
  };
  function TraceVertexAssoc(structure, interpolation, callColoringBeginEnd) {
    this._structure = structure;
    this._assocs = [];
    this._callBeginEnd = callColoringBeginEnd;
    this._interpolation = interpolation || 1;
    this._perResidueColors = {};
  }
  TraceVertexAssoc.prototype = {
    setPerResidueColors: function (traceIndex, colors) {
      this._perResidueColors[traceIndex] = colors;
    },
    addAssoc: function (traceIndex, vertexArray, slice, vertStart, vertEnd) {
      this._assocs.push({
        traceIndex: traceIndex,
        slice: slice,
        vertStart: vertStart,
        vertEnd: vertEnd,
        vertexArray: vertexArray
      });
    },
    recolor: function (colorOp, view) {
      if (this._callBeginEnd) {
        colorOp.begin(this._structure);
      }
      var colorData = [];
      var i, j;
      var traces = this._structure.backboneTraces();
      console.assert(this._perResidueColors, 'per-residue colors must be set for recoloring to work');
      for (i = 0; i < traces.length; ++i) {
        var data = this._perResidueColors[i];
        console.assert(data, 'no per-residue colors. Seriously, man?');
        var index = 0;
        var trace = traces[i];
        for (j = 0; j < trace.length(); ++j) {
          if (!view.containsResidue(trace.residueAt(j))) {
            index += 4;
            continue;
          }
          colorOp.colorFor(trace.centralAtomAt(j), data, index);
          index += 4;
        }
        if (this._interpolation > 1) {
          colorData.push(color.interpolateColor(data, this._interpolation));
        } else {
          colorData.push(data);
        }
      }
      for (i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        var ai = assoc.slice;
        var newColors = colorData[assoc.traceIndex];
        var r = newColors[ai * 4], g = newColors[ai * 4 + 1], b = newColors[ai * 4 + 2], a = newColors[ai * 4 + 3];
        var va = assoc.vertexArray;
        for (j = assoc.vertStart; j < assoc.vertEnd; ++j) {
          va.setColor(j, r, g, b, a);
        }
      }
      if (this._callBeginEnd) {
        colorOp.end(this._structure);
      }
    },
    getColorForAtom: function (atom, color) {
      var i, j;
      var traces = this._structure.backboneTraces();
      var residue = atom.full().residue();
      for (i = 0; i < traces.length; ++i) {
        var data = this._perResidueColors[i];
        var index = 0;
        var trace = traces[i];
        for (j = 0; j < trace.length(); ++j) {
          if (residue === trace.residueAt(j).full()) {
            color[0] = data[index + 0];
            color[1] = data[index + 1];
            color[2] = data[index + 2];
            color[3] = data[index + 3];
            return color;
          }
          index += 4;
        }
      }
      return null;
    },
    setSelection: function (view) {
      var selData = [];
      var i, j;
      var traces = this._structure.backboneTraces();
      for (i = 0; i < traces.length; ++i) {
        var data = new Float32Array(this._perResidueColors[i].length);
        var index = 0;
        var trace = traces[i];
        for (j = 0; j < trace.length(); ++j) {
          var selected = view.containsResidue(trace.residueAt(j)) ? 1 : 0;
          data[index] = selected;
          index += 1;
        }
        if (this._interpolation > 1) {
          selData.push(geom.interpolateScalars(data, this._interpolation));
        } else {
          selData.push(data);
        }
      }
      for (i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        var ai = assoc.slice;
        var sel = selData[assoc.traceIndex];
        var a = sel[ai];
        var va = assoc.vertexArray;
        for (j = assoc.vertStart; j < assoc.vertEnd; ++j) {
          va.setSelected(j, a);
        }
      }
    },
    setOpacity: function (val, view) {
      var colorData = [];
      var i, j;
      var traces = this._structure.backboneTraces();
      for (i = 0; i < traces.length; ++i) {
        var data = this._perResidueColors[i];
        var index = 0;
        var trace = traces[i];
        for (j = 0; j < trace.length(); ++j) {
          if (!view.containsResidue(trace.residueAt(j))) {
            index += 4;
            continue;
          }
          data[index + 3] = val;
          index += 4;
        }
        if (this._interpolation > 1) {
          colorData.push(color.interpolateColor(data, this._interpolation));
        } else {
          colorData.push(data);
        }
      }
      for (i = 0; i < this._assocs.length; ++i) {
        var assoc = this._assocs[i];
        var ai = assoc.slice;
        var newColors = colorData[assoc.traceIndex];
        var a = newColors[ai * 4 + 3];
        var va = assoc.vertexArray;
        for (j = assoc.vertStart; j < assoc.vertEnd; ++j) {
          va.setOpacity(j, a);
        }
      }
    }
  };
  return {
    TraceVertexAssoc: TraceVertexAssoc,
    AtomVertexAssoc: AtomVertexAssoc
  };
}();
gfxRender = function (BillboardGeom, LineGeom) {
  var vec3 = glMatrix.vec3;
  var vec4 = glMatrix.vec4;
  var mat3 = glMatrix.mat3;
  var TubeProfile = gfxGeomBuilders.TubeProfile;
  var ProtoSphere = gfxGeomBuilders.ProtoSphere;
  var ProtoCylinder = gfxGeomBuilders.ProtoCylinder;
  var TraceVertexAssoc = gfxVertAssoc.TraceVertexAssoc;
  var AtomVertexAssoc = gfxVertAssoc.AtomVertexAssoc;
  var interpolateColor = color.interpolateColor;
  var exports = {};
  var R = 0.6;
  var R2 = 0.8071;
  var COIL_POINTS = [
    -R,
    -R,
    0,
    R,
    -R,
    0,
    R,
    R,
    0,
    -R,
    R,
    0
  ];
  var HELIX_POINTS = [
    -6 * R,
    -0.9 * R2,
    0,
    -5.8 * R,
    -1 * R2,
    0,
    5.8 * R,
    -1 * R2,
    0,
    6 * R,
    -0.9 * R2,
    0,
    6 * R,
    0.9 * R2,
    0,
    5.8 * R,
    1 * R2,
    0,
    -5.8 * R,
    1 * R2,
    0,
    -6 * R,
    0.9 * R2,
    0
  ];
  var ARROW_POINTS = [
    -10 * R,
    -0.9 * R2,
    0,
    -9.8 * R,
    -1 * R2,
    0,
    9.8 * R,
    -1 * R2,
    0,
    10 * R,
    -0.9 * R2,
    0,
    10 * R,
    0.9 * R2,
    0,
    9.8 * R,
    1 * R2,
    0,
    -9.8 * R,
    1 * R2,
    0,
    -10 * R,
    0.9 * R2,
    0
  ];
  var VDW_RADIUS = {
    H: 1.1,
    C: 1.7,
    N: 1.55,
    O: 1.52,
    F: 1.47,
    CL: 1.75,
    BR: 1.85,
    I: 1.98,
    HE: 1.4,
    NE: 1.54,
    AR: 1.88,
    XE: 2.16,
    KR: 2.02,
    P: 1.8,
    S: 1.8,
    B: 1.92,
    LI: 1.82,
    NA: 2.27,
    K: 2.75,
    RB: 3.03,
    CS: 3.43,
    FR: 3.48,
    BE: 1.53,
    MG: 1.73,
    SR: 2.49,
    BA: 2.68,
    RA: 2.83,
    TI: 2.11,
    FE: 2.04,
    CU: 1.96
  };
  var smoothStrandInplace = function () {
    var bf = vec3.create(), af = vec3.create(), cf = vec3.create();
    return function (p, from, to, length) {
      from = Math.max(from, 1);
      to = Math.min(length - 1, to);
      var startIndex = 3 * (from - 1);
      vec3.set(bf, p[startIndex], p[startIndex + 1], p[startIndex + 2]);
      vec3.set(cf, p[3 * from], p[3 * from + 1], p[3 * from + 2]);
      for (var i = from; i < to; ++i) {
        startIndex = 3 * (i + 1);
        vec3.set(af, p[startIndex], p[startIndex + 1], p[startIndex + 2]);
        p[3 * i + 0] = af[0] * 0.25 + cf[0] * 0.5 + bf[0] * 0.25;
        p[3 * i + 1] = af[1] * 0.25 + cf[1] * 0.5 + bf[1] * 0.25;
        p[3 * i + 2] = af[2] * 0.25 + cf[2] * 0.5 + bf[2] * 0.25;
        vec3.copy(bf, cf);
        vec3.copy(cf, af);
      }
    };
  }();
  var spheresForChain = function () {
    var color = vec4.fromValues(0, 0, 0, 1);
    return function (meshGeom, vertAssoc, opts, chain) {
      var atomCount = chain.atomCount();
      var idRange = opts.idPool.getContinuousRange(atomCount);
      meshGeom.addIdRange(idRange);
      var vertsPerSphere = opts.protoSphere.numVerts();
      var indicesPerSphere = opts.protoSphere.numIndices();
      var radius = 1.5 * opts.radiusMultiplier;
      meshGeom.addChainVertArray(chain, vertsPerSphere * atomCount, indicesPerSphere * atomCount);
      chain.eachAtom(function (atom) {
        var va = meshGeom.vertArrayWithSpaceFor(vertsPerSphere);
        opts.color.colorFor(atom, color, 0);
        var vertStart = va.numVerts();
        var objId = idRange.nextId({
          geom: meshGeom,
          atom: atom
        });
        opts.protoSphere.addTransformed(va, atom.pos(), radius, color, objId);
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
      });
    };
  }();
  exports.spheres = function (structure, gl, opts) {
    console.time('spheres');
    var protoSphere = new ProtoSphere(opts.sphereDetail, opts.sphereDetail);
    opts.protoSphere = protoSphere;
    var geom = new MeshGeom(gl, opts.float32Allocator, opts.uint16Allocator);
    var vertAssoc = new AtomVertexAssoc(structure, true);
    geom.addVertAssoc(vertAssoc);
    geom.setShowRelated(opts.showRelated);
    opts.color.begin(structure);
    structure.eachChain(function (chain) {
      spheresForChain(geom, vertAssoc, opts, chain);
    });
    opts.color.end(structure);
    console.timeEnd('spheres');
    return geom;
  };
  var billboardedSpheresForChain = function () {
    var color = vec4.fromValues(0, 0, 0, 1);
    return function (meshGeom, vertAssoc, opts, chain) {
      var atomCount = chain.atomCount();
      var idRange = opts.idPool.getContinuousRange(atomCount);
      meshGeom.addIdRange(idRange);
      var vertsPerSphere = 4;
      var indicesPerSphere = 6;
      var radius = 1.5 * opts.radiusMultiplier;
      meshGeom.addChainVertArray(chain, vertsPerSphere * atomCount, indicesPerSphere * atomCount);
      chain.eachAtom(function (atom) {
        var va = meshGeom.vertArrayWithSpaceFor(vertsPerSphere);
        opts.color.colorFor(atom, color, 0);
        var objId = idRange.nextId({
          geom: meshGeom,
          atom: atom
        });
        var vertStart = va.numVerts();
        var p = atom.pos();
        va.addVertex(p, [
          -1,
          -1,
          radius
        ], color, objId);
        va.addVertex(p, [
          +1,
          +1,
          radius
        ], color, objId);
        va.addVertex(p, [
          +1,
          -1,
          radius
        ], color, objId);
        va.addVertex(p, [
          -1,
          +1,
          radius
        ], color, objId);
        va.addTriangle(vertStart + 0, vertStart + 1, vertStart + 2);
        va.addTriangle(vertStart + 0, vertStart + 3, vertStart + 1);
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
      });
    };
  }();
  exports.billboardedSpheres = function (structure, gl, opts) {
    console.time('billboardedSpheres');
    var geom = new BillboardGeom(gl, opts.float32Allocator, opts.uint16Allocator);
    var vertAssoc = new AtomVertexAssoc(structure, true);
    geom.addVertAssoc(vertAssoc);
    geom.setShowRelated(opts.showRelated);
    opts.color.begin(structure);
    structure.eachChain(function (chain) {
      billboardedSpheresForChain(geom, vertAssoc, opts, chain);
    });
    opts.color.end(structure);
    console.timeEnd('billboardedSpheres');
    return geom;
  };
  var ballsAndSticksForChain = function () {
    var midPoint = vec3.create(), dir = vec3.create();
    var color = vec4.fromValues(0, 0, 0, 1);
    var left = vec3.create(), up = vec3.create();
    var rotation = mat3.create();
    return function (meshGeom, vertAssoc, opts, chain) {
      var atomCount = chain.atomCount();
      var bondCount = 0;
      chain.eachAtom(function (a) {
        bondCount += a.bonds().length;
      });
      var numVerts = atomCount * opts.protoSphere.numVerts() + bondCount * opts.protoCyl.numVerts();
      var numIndices = atomCount * opts.protoSphere.numIndices() + bondCount * opts.protoCyl.numIndices();
      meshGeom.addChainVertArray(chain, numVerts, numIndices);
      var idRange = opts.idPool.getContinuousRange(atomCount);
      meshGeom.addIdRange(idRange);
      chain.eachAtom(function (atom) {
        var atomScale = opts.scaleByAtomRadius ? VDW_RADIUS[atom.element()] || 1 : 1;
        var atomRadius = opts.sphereRadius * atomScale;
        var atomVerts = opts.protoSphere.numVerts() + atom.bondCount() * opts.protoCyl.numVerts();
        var va = meshGeom.vertArrayWithSpaceFor(atomVerts);
        var vertStart = va.numVerts();
        var objId = idRange.nextId({
          geom: meshGeom,
          atom: atom
        });
        opts.color.colorFor(atom, color, 0);
        opts.protoSphere.addTransformed(va, atom.pos(), atomRadius, color, objId);
        atom.eachBond(function (bond) {
          bond.mid_point(midPoint);
          vec3.sub(dir, atom.pos(), midPoint);
          var length = vec3.length(dir);
          vec3.scale(dir, dir, 1 / length);
          geom.buildRotation(rotation, dir, left, up, false);
          vec3.add(midPoint, midPoint, atom.pos());
          vec3.scale(midPoint, midPoint, 0.5);
          opts.protoCyl.addTransformed(va, midPoint, length, opts.cylRadius, rotation, color, color, objId, objId);
        });
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
      });
    };
  }();
  exports.ballsAndSticks = function (structure, gl, opts) {
    console.time('ballsAndSticks');
    var vertAssoc = new AtomVertexAssoc(structure, true);
    var protoSphere = new ProtoSphere(opts.sphereDetail, opts.sphereDetail);
    var protoCyl = new ProtoCylinder(opts.arcDetail);
    opts.protoSphere = protoSphere;
    opts.protoCyl = protoCyl;
    var meshGeom = new MeshGeom(gl, opts.float32Allocator, opts.uint16Allocator);
    meshGeom.addVertAssoc(vertAssoc);
    meshGeom.setShowRelated(opts.showRelated);
    opts.color.begin(structure);
    structure.eachChain(function (chain) {
      ballsAndSticksForChain(meshGeom, vertAssoc, opts, chain);
    });
    opts.color.end(structure);
    console.timeEnd('ballsAndSticks');
    return meshGeom;
  };
  var pointsForChain = function () {
    var clr = vec4.fromValues(0, 0, 0, 1);
    return function (lineGeom, vertAssoc, chain, opts) {
      var atomCount = chain.atomCount();
      var idRange = opts.idPool.getContinuousRange(atomCount);
      lineGeom.addIdRange(idRange);
      var va = lineGeom.addChainVertArray(chain, atomCount);
      va.setDrawAsPoints(true);
      chain.eachAtom(function (atom) {
        var vertStart = va.numVerts();
        opts.color.colorFor(atom, clr, 0);
        var objId = idRange.nextId({
          geom: lineGeom,
          atom: atom
        });
        va.addPoint(atom.pos(), clr, objId);
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
      });
    };
  }();
  exports.points = function (structure, gl, opts) {
    console.time('points');
    var vertAssoc = new AtomVertexAssoc(structure, true);
    opts.color.begin(structure);
    var lineGeom = new LineGeom(gl, opts.float32Allocator);
    lineGeom.setPointSize(opts.pointSize);
    lineGeom.addVertAssoc(vertAssoc);
    lineGeom.setShowRelated(opts.showRelated);
    structure.eachChain(function (chain) {
      pointsForChain(lineGeom, vertAssoc, chain, opts);
    });
    opts.color.end(structure);
    console.timeEnd('points');
    return lineGeom;
  };
  var linesForChain = function () {
    var mp = vec3.create();
    var clr = vec4.fromValues(0, 0, 0, 1);
    return function (lineGeom, vertAssoc, chain, opts) {
      var lineCount = 0;
      var atomCount = chain.atomCount();
      var idRange = opts.idPool.getContinuousRange(atomCount);
      lineGeom.addIdRange(idRange);
      chain.eachAtom(function (atom) {
        var numBonds = atom.bonds().length;
        if (numBonds) {
          lineCount += numBonds;
        } else {
          lineCount += 3;
        }
      });
      var va = lineGeom.addChainVertArray(chain, lineCount * 2);
      chain.eachAtom(function (atom) {
        var vertStart = va.numVerts();
        var objId = idRange.nextId({
          geom: lineGeom,
          atom: atom
        });
        if (atom.bonds().length) {
          atom.eachBond(function (bond) {
            bond.mid_point(mp);
            opts.color.colorFor(atom, clr, 0);
            va.addLine(atom.pos(), clr, mp, clr, objId, objId);
          });
        } else {
          var cs = 0.2;
          var pos = atom.pos();
          opts.color.colorFor(atom, clr, 0);
          va.addLine([
            pos[0] - cs,
            pos[1],
            pos[2]
          ], clr, [
            pos[0] + cs,
            pos[1],
            pos[2]
          ], clr, objId, objId);
          va.addLine([
            pos[0],
            pos[1] - cs,
            pos[2]
          ], clr, [
            pos[0],
            pos[1] + cs,
            pos[2]
          ], clr, objId, objId);
          va.addLine([
            pos[0],
            pos[1],
            pos[2] - cs
          ], clr, [
            pos[0],
            pos[1],
            pos[2] + cs
          ], clr, objId, objId);
        }
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
      });
    };
  }();
  exports.lines = function (structure, gl, opts) {
    console.time('lines');
    var vertAssoc = new AtomVertexAssoc(structure, true);
    opts.color.begin(structure);
    var lineGeom = new LineGeom(gl, opts.float32Allocator);
    lineGeom.setLineWidth(opts.lineWidth);
    lineGeom.addVertAssoc(vertAssoc);
    lineGeom.setShowRelated(opts.showRelated);
    structure.eachChain(function (chain) {
      linesForChain(lineGeom, vertAssoc, chain, opts);
    });
    opts.color.end(structure);
    console.timeEnd('lines');
    return lineGeom;
  };
  var _lineTraceNumVerts = function (traces) {
    var numVerts = 0;
    for (var i = 0; i < traces.length; ++i) {
      numVerts += 2 * (traces[i].length() - 1);
    }
    return numVerts;
  };
  var makeLineTrace = function () {
    var colorOne = vec4.fromValues(0, 0, 0, 1), colorTwo = vec4.fromValues(0, 0, 0, 1);
    var posOne = vec3.create(), posTwo = vec3.create();
    return function makeLineTrace(lineGeom, vertAssoc, va, traceIndex, trace, opts) {
      vertAssoc.addAssoc(traceIndex, va, 0, va.numVerts(), va.numVerts() + 1);
      var colors = opts.float32Allocator.request(trace.length() * 4);
      var idRange = opts.idPool.getContinuousRange(trace.length());
      lineGeom.addIdRange(idRange);
      var idOne = idRange.nextId({
        geom: lineGeom,
        atom: trace.centralAtomAt(0),
        isTrace: true
      });
      var idTwo;
      for (var i = 1; i < trace.length(); ++i) {
        opts.color.colorFor(trace.centralAtomAt(i - 1), colorOne, 0);
        colors[(i - 1) * 4 + 0] = colorOne[0];
        colors[(i - 1) * 4 + 1] = colorOne[1];
        colors[(i - 1) * 4 + 2] = colorOne[2];
        colors[(i - 1) * 4 + 3] = colorOne[3];
        opts.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
        trace.posAt(posOne, i - 1);
        trace.posAt(posTwo, i);
        idTwo = idRange.nextId({
          geom: lineGeom,
          atom: trace.centralAtomAt(i),
          isTrace: true
        });
        va.addLine(posOne, colorOne, posTwo, colorTwo, idOne, idTwo);
        idOne = idTwo;
        idTwo = null;
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(traceIndex, va, i, vertEnd - 1, vertEnd + (i === trace.length() - 1 ? 0 : 1));
      }
      colors[trace.length() * 4 - 4] = colorTwo[0];
      colors[trace.length() * 4 - 3] = colorTwo[1];
      colors[trace.length() * 4 - 2] = colorTwo[2];
      colors[trace.length() * 4 - 1] = colorTwo[3];
      vertAssoc.setPerResidueColors(traceIndex, colors);
      return traceIndex + 1;
    };
  }();
  var lineTraceForChain = function (lineGeom, vertAssoc, opts, traceIndex, chain) {
    var backboneTraces = chain.backboneTraces();
    var numVerts = _lineTraceNumVerts(backboneTraces);
    var va = lineGeom.addChainVertArray(chain, numVerts);
    for (var i = 0; i < backboneTraces.length; ++i) {
      traceIndex = makeLineTrace(lineGeom, vertAssoc, va, traceIndex, backboneTraces[i], opts);
    }
    return traceIndex;
  };
  exports.lineTrace = function (structure, gl, opts) {
    console.time('lineTrace');
    var vertAssoc = new TraceVertexAssoc(structure, 1, true);
    opts.color.begin(structure);
    var lineGeom = new LineGeom(gl, opts.float32Allocator);
    lineGeom.setLineWidth(opts.lineWidth);
    var traceIndex = 0;
    structure.eachChain(function (chain) {
      traceIndex = lineTraceForChain(lineGeom, vertAssoc, opts, traceIndex, chain);
    });
    lineGeom.addVertAssoc(vertAssoc);
    lineGeom.setShowRelated(opts.showRelated);
    opts.color.end(structure);
    console.timeEnd('lineTrace');
    return lineGeom;
  };
  var _slineNumVerts = function (traces, splineDetail) {
    var numVerts = 0;
    for (var i = 0; i < traces.length; ++i) {
      numVerts += 2 * (splineDetail * (traces[i].length() - 1) + 1);
    }
    return numVerts;
  };
  var slineMakeTrace = function () {
    var posOne = vec3.create(), posTwo = vec3.create();
    var colorOne = vec4.fromValues(0, 0, 0, 1), colorTwo = vec4.fromValues(0, 0, 0, 1);
    return function (lineGeom, vertAssoc, va, opts, traceIndex, trace) {
      var firstSlice = trace.fullTraceIndex(0);
      var positions = opts.float32Allocator.request(trace.length() * 3);
      var colors = opts.float32Allocator.request(trace.length() * 4);
      var objIds = [];
      var i;
      var idRange = opts.idPool.getContinuousRange(trace.length());
      lineGeom.addIdRange(idRange);
      for (i = 0; i < trace.length(); ++i) {
        var atom = trace.centralAtomAt(i);
        trace.smoothPosAt(posOne, i, opts.strength);
        opts.color.colorFor(atom, colors, 4 * i);
        positions[i * 3] = posOne[0];
        positions[i * 3 + 1] = posOne[1];
        positions[i * 3 + 2] = posOne[2];
        objIds.push(idRange.nextId({
          geom: lineGeom,
          atom: atom,
          isTrace: true
        }));
      }
      var idStart = objIds[0], idEnd = 0;
      var sdiv = geom.catmullRomSpline(positions, trace.length(), opts.splineDetail, opts.strength, false, opts.float32Allocator);
      var interpColors = interpolateColor(colors, opts.splineDetail);
      var vertStart = va.numVerts();
      vertAssoc.addAssoc(traceIndex, va, firstSlice, vertStart, vertStart + 1);
      var halfSplineDetail = Math.floor(opts.splineDetail / 2);
      var steps = geom.catmullRomSplineNumPoints(trace.length(), opts.splineDetail, false);
      for (i = 1; i < steps; ++i) {
        posOne[0] = sdiv[3 * (i - 1)];
        posOne[1] = sdiv[3 * (i - 1) + 1];
        posOne[2] = sdiv[3 * (i - 1) + 2];
        posTwo[0] = sdiv[3 * (i - 0)];
        posTwo[1] = sdiv[3 * (i - 0) + 1];
        posTwo[2] = sdiv[3 * (i - 0) + 2];
        colorOne[0] = interpColors[4 * (i - 1) + 0];
        colorOne[1] = interpColors[4 * (i - 1) + 1];
        colorOne[2] = interpColors[4 * (i - 1) + 2];
        colorOne[3] = interpColors[4 * (i - 1) + 3];
        colorTwo[0] = interpColors[4 * (i - 0) + 0];
        colorTwo[1] = interpColors[4 * (i - 0) + 1];
        colorTwo[2] = interpColors[4 * (i - 0) + 2];
        colorTwo[3] = interpColors[4 * (i - 0) + 3];
        var index = Math.floor((i + halfSplineDetail) / opts.splineDetail);
        idEnd = objIds[Math.min(objIds.length - 1, index)];
        va.addLine(posOne, colorOne, posTwo, colorTwo, idStart, idEnd);
        idStart = idEnd;
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(traceIndex, va, firstSlice + i, vertEnd - 1, vertEnd + (i === trace.length - 1 ? 0 : 1));
      }
      vertAssoc.setPerResidueColors(traceIndex, colors);
      opts.float32Allocator.release(positions);
      opts.float32Allocator.release(sdiv);
      return traceIndex + 1;
    };
  }();
  var slineForChain = function (lineGeom, vertAssoc, opts, chain, traceIndex) {
    var backboneTraces = chain.backboneTraces();
    var numVerts = _slineNumVerts(backboneTraces, opts.splineDetail);
    var va = lineGeom.addChainVertArray(chain, numVerts);
    for (var i = 0; i < backboneTraces.length; ++i) {
      traceIndex = slineMakeTrace(lineGeom, vertAssoc, va, opts, traceIndex, backboneTraces[i]);
    }
    return traceIndex;
  };
  exports.sline = function (structure, gl, opts) {
    console.time('sline');
    opts.color.begin(structure);
    var vertAssoc = new TraceVertexAssoc(structure, opts.splineDetail, 1, true);
    var lineGeom = new LineGeom(gl, opts.float32Allocator);
    lineGeom.addVertAssoc(vertAssoc);
    lineGeom.setLineWidth(opts.lineWidth);
    lineGeom.setShowRelated(opts.showRelated);
    var traceIndex = 0;
    structure.eachChain(function (chain) {
      traceIndex = slineForChain(lineGeom, vertAssoc, opts, chain, traceIndex);
    });
    opts.color.end(structure);
    console.timeEnd('sline');
    return lineGeom;
  };
  var _traceNumVerts = function (traces, sphereNumVerts, cylNumVerts) {
    var numVerts = 0;
    for (var i = 0; i < traces.length; ++i) {
      numVerts += traces[i].length() * sphereNumVerts;
      numVerts += (traces[i].length() - 1) * cylNumVerts;
    }
    return numVerts;
  };
  var _traceNumIndices = function (traces, sphereNumIndices, cylNumIndices) {
    var numIndices = 0;
    for (var i = 0; i < traces.length; ++i) {
      numIndices += traces[i].length() * sphereNumIndices;
      numIndices += (traces[i].length() - 1) * cylNumIndices;
    }
    return numIndices;
  };
  var traceForChain = function (meshGeom, vertAssoc, opts, traceIndex, chain) {
    var traces = chain.backboneTraces();
    var numVerts = _traceNumVerts(traces, opts.protoSphere.numVerts(), opts.protoCyl.numVerts());
    var numIndices = _traceNumIndices(traces, opts.protoSphere.numIndices(), opts.protoCyl.numIndices());
    meshGeom.addChainVertArray(chain, numVerts, numIndices);
    for (var ti = 0; ti < traces.length; ++ti) {
      _renderSingleTrace(meshGeom, vertAssoc, traces[ti], traceIndex, opts);
      traceIndex++;
    }
    return traceIndex;
  };
  exports.trace = function (structure, gl, opts) {
    console.time('trace');
    opts.protoCyl = new ProtoCylinder(opts.arcDetail);
    opts.protoSphere = new ProtoSphere(opts.sphereDetail, opts.sphereDetail);
    var meshGeom = new MeshGeom(gl, opts.float32Allocator, opts.uint16Allocator);
    var vertAssoc = new TraceVertexAssoc(structure, 1, true);
    meshGeom.addVertAssoc(vertAssoc);
    meshGeom.setShowRelated(opts.showRelated);
    opts.color.begin(structure);
    var traceIndex = 0;
    structure.eachChain(function (chain) {
      traceIndex = traceForChain(meshGeom, vertAssoc, opts, traceIndex, chain);
    });
    opts.color.end(structure);
    console.timeEnd('trace');
    return meshGeom;
  };
  var _cartoonNumVerts = function (traces, vertsPerSlice, splineDetail) {
    var numVerts = 0;
    for (var i = 0; i < traces.length; ++i) {
      var traceVerts = ((traces[i].length() - 1) * splineDetail + 1) * vertsPerSlice;
      var splits = Math.ceil((traceVerts + 2) / 65536);
      numVerts += traceVerts + (splits - 1) * vertsPerSlice;
      numVerts += 2;
    }
    return numVerts;
  };
  var _cartoonNumIndices = function (traces, vertsPerSlice, splineDetail) {
    var numIndices = 0;
    for (var i = 0; i < traces.length; ++i) {
      numIndices += (traces[i].length() * splineDetail - 1) * vertsPerSlice * 6;
      numIndices += 2 * 3 * vertsPerSlice;
    }
    return numIndices;
  };
  var _addNucleotideSticks = function () {
    var rotation = mat3.create();
    var up = vec3.create(), left = vec3.create(), dir = vec3.create();
    var center = vec3.create();
    var color = vec4.create();
    return function (meshGeom, vertAssoc, traces, opts) {
      var radius = opts.radius * 1.8;
      var vertsPerNucleotideStick = opts.protoCyl.numVerts() + 2 * opts.protoSphere.numVerts();
      for (var i = 0; i < traces.length; ++i) {
        var trace = traces[i];
        var idRange = opts.idPool.getContinuousRange(trace.length());
        meshGeom.addIdRange(idRange);
        for (var j = 0; j < trace.length(); ++j) {
          var va = meshGeom.vertArrayWithSpaceFor(vertsPerNucleotideStick);
          var vertStart = va.numVerts();
          var residue = trace.residueAt(j);
          var resName = residue.name();
          var startAtom = residue.atom('C3\'');
          var endAtom = null;
          if (resName === 'A' || resName === 'G' || resName === 'DA' || resName === 'DG') {
            endAtom = residue.atom('N1');
          } else {
            endAtom = residue.atom('N3');
          }
          if (endAtom === null || startAtom === null) {
            continue;
          }
          var objId = idRange.nextId({
            geom: meshGeom,
            atom: endAtom,
            isTrace: true
          });
          vec3.add(center, startAtom.pos(), endAtom.pos());
          vec3.scale(center, center, 0.5);
          opts.color.colorFor(endAtom, color, 0);
          vec3.sub(dir, endAtom.pos(), startAtom.pos());
          var length = vec3.length(dir);
          vec3.scale(dir, dir, 1 / length);
          geom.buildRotation(rotation, dir, left, up, false);
          opts.protoCyl.addTransformed(va, center, length, radius, rotation, color, color, objId, objId);
          opts.protoSphere.addTransformed(va, endAtom.pos(), radius, color, objId);
          opts.protoSphere.addTransformed(va, startAtom.pos(), radius, color, objId);
          var vertEnd = va.numVerts();
          console.assert(vertEnd <= 65536, 'too many vertices');
          vertAssoc.addAssoc(endAtom, va, vertStart, vertEnd);
        }
      }
    };
  }();
  var cartoonForChain = function (meshGeom, vertAssoc, nucleotideAssoc, opts, traceIndex, chain) {
    var traces = chain.backboneTraces();
    var numVerts = _cartoonNumVerts(traces, opts.arcDetail * 4, opts.splineDetail);
    var numIndices = _cartoonNumIndices(traces, opts.arcDetail * 4, opts.splineDetail);
    var nucleicAcidTraces = [];
    var vertForBaseSticks = opts.protoCyl.numVerts() + 2 * opts.protoSphere.numVerts();
    var indicesForBaseSticks = opts.protoCyl.numIndices() + 2 * opts.protoSphere.numIndices();
    for (var i = 0; i < traces.length; ++i) {
      var trace = traces[i];
      if (trace.residueAt(0).isNucleotide()) {
        nucleicAcidTraces.push(trace);
        numVerts += trace.length() * vertForBaseSticks;
        numIndices += trace.length() * indicesForBaseSticks;
      }
    }
    meshGeom.addChainVertArray(chain, numVerts, numIndices);
    for (var ti = 0; ti < traces.length; ++ti) {
      traceIndex = _cartoonForSingleTrace(meshGeom, vertAssoc, traces[ti], traceIndex, opts);
    }
    _addNucleotideSticks(meshGeom, nucleotideAssoc, nucleicAcidTraces, opts);
    return traceIndex;
  };
  exports.cartoon = function (structure, gl, opts) {
    console.time('cartoon');
    opts.arrowSkip = Math.floor(opts.splineDetail * 3 / 4);
    opts.coilProfile = new TubeProfile(COIL_POINTS, opts.arcDetail, 1);
    opts.arrowProfile = new TubeProfile(ARROW_POINTS, opts.arcDetail / 2, 0.1);
    opts.helixProfile = new TubeProfile(HELIX_POINTS, opts.arcDetail / 2, 0.1);
    opts.strandProfile = new TubeProfile(HELIX_POINTS, opts.arcDetail / 2, 0.1);
    opts.protoCyl = new ProtoCylinder(opts.arcDetail * 4);
    opts.protoSphere = new ProtoSphere(opts.arcDetail * 4, opts.arcDetail * 4);
    var meshGeom = new MeshGeom(gl, opts.float32Allocator, opts.uint16Allocator);
    var vertAssoc = new TraceVertexAssoc(structure, opts.splineDetail, true);
    meshGeom.addVertAssoc(vertAssoc);
    meshGeom.setShowRelated(opts.showRelated);
    opts.color.begin(structure);
    var traceIndex = 0;
    var selection = structure.select({
      anames: [
        'N1',
        'N3'
      ]
    });
    var nucleotideAssoc = new AtomVertexAssoc(selection, true);
    meshGeom.addVertAssoc(nucleotideAssoc);
    structure.eachChain(function (chain) {
      traceIndex = cartoonForChain(meshGeom, vertAssoc, nucleotideAssoc, opts, traceIndex, chain);
    });
    opts.color.end(structure);
    console.timeEnd('cartoon');
    return meshGeom;
  };
  exports.surface = function () {
    var pos = vec3.create(), normal = vec3.create(), color = vec4.fromValues(0.8, 0.8, 0.8, 1);
    return function (data, gl, opts) {
      var offset = 0;
      data.getUint32(0);
      offset += 4;
      var numVerts = data.getUint32(offset);
      offset += 4;
      var vertexStride = 4 * 6;
      var facesDataStart = vertexStride * numVerts + offset;
      var numFaces = data.getUint32(facesDataStart);
      var meshGeom = new MeshGeom(gl, opts.float32Allocator, opts.uint16Allocator);
      meshGeom.setShowRelated('asym');
      var va = meshGeom.addVertArray(numVerts, numFaces * 3);
      var i;
      for (i = 0; i < numVerts; ++i) {
        vec3.set(pos, data.getFloat32(offset + 0), data.getFloat32(offset + 4), data.getFloat32(offset + 8));
        offset += 12;
        vec3.set(normal, data.getFloat32(offset + 0), data.getFloat32(offset + 4), data.getFloat32(offset + 8));
        offset += 12;
        va.addVertex(pos, normal, color, 0);
      }
      offset = facesDataStart + 4;
      for (i = 0; i < numFaces; ++i) {
        var idx0 = data.getUint32(offset + 0), idx1 = data.getUint32(offset + 4), idx2 = data.getUint32(offset + 8);
        offset += 12;
        va.addTriangle(idx0 - 1, idx2 - 1, idx1 - 1);
      }
      return meshGeom;
    };
  }();
  var _cartoonAddTube = function () {
    var rotation = mat3.create();
    var up = vec3.create();
    return function (vertArray, pos, left, ss, tangent, color, radius, first, opts, offset, objId) {
      var prof = opts.coilProfile;
      if (ss !== 'C' && !opts.forceTube) {
        if (ss === 'H') {
          prof = opts.helixProfile;
        } else if (ss === 'E') {
          prof = opts.strandProfile;
        } else if (ss === 'A') {
          prof = opts.arrowProfile;
        }
      } else {
        if (first) {
          geom.ortho(left, tangent);
        } else {
          vec3.cross(left, up, tangent);
        }
      }
      geom.buildRotation(rotation, tangent, left, up, true);
      prof.addTransformed(vertArray, pos, radius, rotation, color, first, offset, objId);
    };
  }();
  var _colorPosNormalsFromTrace = function () {
    var pos = vec3.create();
    var normal = vec3.create(), lastNormal = vec3.create();
    return function (meshGeom, trace, colors, positions, normals, objIds, pool, opts) {
      var strandStart = null, strandEnd = null;
      var trace_length = trace.length();
      vec3.set(lastNormal, 0, 0, 0);
      for (var i = 0; i < trace_length; ++i) {
        objIds.push(pool.nextId({
          geom: meshGeom,
          atom: trace.centralAtomAt(i),
          isTrace: true
        }));
        trace.smoothPosAt(pos, i, opts.strength);
        positions[i * 3] = pos[0];
        positions[i * 3 + 1] = pos[1];
        positions[i * 3 + 2] = pos[2];
        trace.smoothNormalAt(normal, i, opts.strength);
        var atom = trace.centralAtomAt(i);
        opts.color.colorFor(atom, colors, i * 4);
        if (vec3.dot(normal, lastNormal) < 0) {
          vec3.scale(normal, normal, -1);
        }
        if (trace.residueAt(i).ss() === 'E' && !opts.forceTube && opts.smoothStrands) {
          if (strandStart === null) {
            strandStart = i;
          }
          strandEnd = i;
        }
        if (trace.residueAt(i).ss() === 'C' && strandStart !== null) {
          smoothStrandInplace(positions, strandStart, strandEnd, trace_length);
          smoothStrandInplace(normals, strandStart, strandEnd, trace_length);
          strandStart = null;
          strandEnd = null;
        }
        normals[i * 3] = positions[3 * i] + normal[0] + lastNormal[0];
        normals[i * 3 + 1] = positions[3 * i + 1] + normal[1] + lastNormal[1];
        normals[i * 3 + 2] = positions[3 * i + 2] + normal[2] + lastNormal[2];
        vec3.copy(lastNormal, normal);
      }
    };
  }();
  function capTubeStart(va, baseIndex, numTubeVerts) {
    for (var i = 0; i < numTubeVerts - 1; ++i) {
      va.addTriangle(baseIndex, baseIndex + 1 + i, baseIndex + 2 + i);
    }
    va.addTriangle(baseIndex, baseIndex + numTubeVerts, baseIndex + 1);
  }
  function capTubeEnd(va, baseIndex, numTubeVerts) {
    var center = baseIndex + numTubeVerts;
    for (var i = 0; i < numTubeVerts - 1; ++i) {
      va.addTriangle(center, baseIndex + i + 1, baseIndex + i);
    }
    va.addTriangle(center, baseIndex, baseIndex + numTubeVerts - 1);
  }
  var _cartoonForSingleTrace = function () {
    var tangent = vec3.create(), pos = vec3.create(), color = vec4.fromValues(0, 0, 0, 1), normal = vec3.create(), normal2 = vec3.create();
    return function (meshGeom, vertAssoc, trace, traceIndex, opts) {
      var numVerts = _cartoonNumVerts([trace], opts.arcDetail * 4, opts.splineDetail);
      var positions = opts.float32Allocator.request(trace.length() * 3);
      var colors = opts.float32Allocator.request(trace.length() * 4);
      var normals = opts.float32Allocator.request(trace.length() * 3);
      var objIds = [];
      var idRange = opts.idPool.getContinuousRange(trace.length());
      meshGeom.addIdRange(idRange);
      _colorPosNormalsFromTrace(meshGeom, trace, colors, positions, normals, objIds, idRange, opts);
      var vertArray = meshGeom.vertArrayWithSpaceFor(numVerts);
      var sdiv = geom.catmullRomSpline(positions, trace.length(), opts.splineDetail, opts.strength, false, opts.float32Allocator);
      var normalSdiv = geom.catmullRomSpline(normals, trace.length(), opts.splineDetail, opts.strength, false, opts.float32Allocator);
      vertAssoc.setPerResidueColors(traceIndex, colors);
      var radius = opts.radius * (trace.residueAt(0).isAminoacid() ? 1 : 1.8);
      var interpColors = interpolateColor(colors, opts.splineDetail);
      vec3.set(tangent, sdiv[3] - sdiv[0], sdiv[4] - sdiv[1], sdiv[5] - sdiv[2]);
      vec3.set(pos, sdiv[0], sdiv[1], sdiv[2]);
      vec3.set(normal, normalSdiv[0] - sdiv[0], normalSdiv[1] - sdiv[1], normalSdiv[2] - sdiv[2]);
      vec3.normalize(tangent, tangent);
      vec3.normalize(normal, normal);
      vec4.set(color, interpColors[0], interpColors[1], interpColors[2], interpColors[3]);
      var vertStart = vertArray.numVerts();
      vertArray.addVertex(pos, [
        -tangent[0],
        -tangent[1],
        -tangent[2]
      ], color, objIds[0]);
      var currentSS = trace.residueAt(0).ss();
      _cartoonAddTube(vertArray, pos, normal, currentSS, tangent, color, radius, true, opts, 0, objIds[0]);
      capTubeStart(vertArray, vertStart, opts.arcDetail * 4);
      var vertEnd = vertArray.numVerts();
      var slice = 0;
      vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
      slice += 1;
      var halfSplineDetail = Math.floor(opts.splineDetail / 2);
      var steps = geom.catmullRomSplineNumPoints(trace.length(), opts.splineDetail, false);
      var vertsPerSlice = opts.arcDetail * 4;
      for (var i = 1, e = steps; i < e; ++i) {
        var ix3 = 3 * i, ix4 = 4 * i, ipox3 = 3 * (i + 1), imox3 = 3 * (i - 1);
        vec3.set(pos, sdiv[ix3], sdiv[ix3 + 1], sdiv[ix3 + 2]);
        if (i === e - 1) {
          vec3.set(tangent, sdiv[ix3] - sdiv[imox3], sdiv[ix3 + 1] - sdiv[imox3 + 1], sdiv[ix3 + 2] - sdiv[imox3 + 2]);
        } else {
          vec3.set(tangent, sdiv[ipox3] - sdiv[imox3], sdiv[ipox3 + 1] - sdiv[imox3 + 1], sdiv[ipox3 + 2] - sdiv[imox3 + 2]);
        }
        vec3.normalize(tangent, tangent);
        vec4.set(color, interpColors[ix4], interpColors[ix4 + 1], interpColors[ix4 + 2], interpColors[ix4 + 3]);
        var offset = 0;
        var iCentered = i + opts.splineDetail / 2;
        var residueIndex = Math.floor(iCentered / opts.splineDetail);
        var prevResidueIndex = Math.floor((iCentered - 1) / opts.splineDetail);
        var arrowEndIndex = Math.floor((iCentered + opts.arrowSkip) / opts.splineDetail);
        var drawArrow = false;
        var thisSS = trace.residueAt(residueIndex).ss();
        if (!opts.forceTube) {
          if (residueIndex !== prevResidueIndex) {
            var prevSS = trace.residueAt(prevResidueIndex).ss();
            if (prevSS === 'C' && (thisSS === 'H' || thisSS === 'E')) {
              vec3.set(normal2, normalSdiv[imox3] - sdiv[imox3], normalSdiv[imox3 + 1] - sdiv[imox3 + 1], normalSdiv[imox3 + 2] - sdiv[imox3 + 2]);
              vec3.normalize(normal2, normal2);
              var argAngle = 2 * Math.PI / (opts.arcDetail * 4);
              var signedAngle = geom.signedAngle(normal, normal2, tangent);
              offset = Math.round(signedAngle / argAngle);
              offset = (offset + opts.arcDetail * 4) % (opts.arcDetail * 4);
            }
          }
          if (arrowEndIndex !== residueIndex && arrowEndIndex < trace.length()) {
            var nextSS = trace.residueAt(arrowEndIndex).ss();
            if (nextSS === 'C' && thisSS === 'E') {
              drawArrow = true;
            }
          }
        }
        vec3.set(normal, normalSdiv[3 * i] - sdiv[ix3], normalSdiv[ix3 + 1] - sdiv[ix3 + 1], normalSdiv[ix3 + 2] - sdiv[ix3 + 2]);
        vec3.normalize(normal, normal);
        vertStart = vertArray.numVerts();
        var objIndex = Math.floor((i + halfSplineDetail) / opts.splineDetail);
        var objId = objIds[Math.min(objIds.length - 1, objIndex)];
        _cartoonAddTube(vertArray, pos, normal, thisSS, tangent, color, radius, false, opts, offset, objId);
        var additionalVerts = i === e - 1 ? 1 : vertsPerSlice;
        if (vertArray.numVerts() + additionalVerts > vertArray.maxVerts()) {
          vertEnd = vertArray.numVerts();
          vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
          vertArray = meshGeom.vertArrayWithSpaceFor(additionalVerts);
          vertStart = 0;
          _cartoonAddTube(vertArray, pos, normal, thisSS, tangent, color, radius, true, opts, 0, objId);
        }
        if (drawArrow) {
          vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
          _cartoonAddTube(vertArray, pos, normal, 'A', tangent, color, radius, false, opts, 0, objId);
          i += opts.arrowSkip;
        }
        vertEnd = vertArray.numVerts();
        if (i === e - 1) {
          vertEnd += 1;
        }
        vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
        slice += 1;
        if (drawArrow) {
          slice += opts.arrowSkip;
        }
      }
      vertArray.addVertex(pos, tangent, color, objIds[objIds.length - 1]);
      capTubeEnd(vertArray, vertStart, opts.arcDetail * 4);
      opts.float32Allocator.release(normals);
      opts.float32Allocator.release(positions);
      return traceIndex + 1;
    };
  }();
  var _renderSingleTrace = function () {
    var rotation = mat3.create();
    var dir = vec3.create(), left = vec3.create(), up = vec3.create(), midPoint = vec3.create(), caPrevPos = vec3.create(), caThisPos = vec3.create();
    var colorOne = vec4.fromValues(0, 0, 0, 1);
    var colorTwo = vec4.fromValues(0, 0, 0, 1);
    return function (meshGeom, vertAssoc, trace, traceIndex, opts) {
      if (trace.length() === 0) {
        return;
      }
      var idRange = opts.idPool.getContinuousRange(trace.length());
      meshGeom.addIdRange(idRange);
      opts.color.colorFor(trace.centralAtomAt(0), colorOne, 0);
      var numVerts = _traceNumVerts([trace], opts.protoSphere.numVerts(), opts.protoCyl.numVerts());
      var remainingVerts = numVerts;
      var va = meshGeom.vertArrayWithSpaceFor(numVerts);
      var maxVerts = va.maxVerts();
      var vertStart = va.numVerts();
      trace.posAt(caPrevPos, 0);
      var idStart = idRange.nextId({
          geom: meshGeom,
          atom: trace.centralAtomAt(0),
          isTrace: true
        }), idEnd = 0;
      opts.protoSphere.addTransformed(va, caPrevPos, opts.radius, colorOne, idStart);
      var vertEnd = null;
      vertAssoc.addAssoc(traceIndex, va, 0, vertStart, vertEnd);
      var colors = opts.float32Allocator.request(trace.length() * 4);
      colors[0] = colorOne[0];
      colors[1] = colorOne[1];
      colors[2] = colorOne[2];
      colors[3] = colorOne[3];
      var vertsPerIteration = opts.protoCyl.numVerts() + opts.protoSphere.numVerts();
      for (var i = 1; i < trace.length(); ++i) {
        idEnd = idRange.nextId({
          geom: meshGeom,
          atom: trace.centralAtomAt(i),
          isTrace: true
        });
        trace.posAt(caPrevPos, i - 1);
        trace.posAt(caThisPos, i);
        opts.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
        colors[i * 4 + 0] = colorTwo[0];
        colors[i * 4 + 1] = colorTwo[1];
        colors[i * 4 + 2] = colorTwo[2];
        colors[i * 4 + 3] = colorTwo[3];
        vec3.sub(dir, caThisPos, caPrevPos);
        var length = vec3.length(dir);
        vec3.scale(dir, dir, 1 / length);
        geom.buildRotation(rotation, dir, left, up, false);
        vec3.copy(midPoint, caPrevPos);
        vec3.add(midPoint, midPoint, caThisPos);
        vec3.scale(midPoint, midPoint, 0.5);
        if (vertsPerIteration > maxVerts - va.numVerts()) {
          va = meshGeom.vertArrayWithSpaceFor(remainingVerts);
        }
        remainingVerts -= vertsPerIteration;
        var endSphere = va.numVerts();
        opts.protoCyl.addTransformed(va, midPoint, length, opts.radius, rotation, colorOne, colorTwo, idStart, idEnd);
        vertEnd = va.numVerts();
        vertEnd = vertEnd - (vertEnd - endSphere) / 2;
        opts.protoSphere.addTransformed(va, caThisPos, opts.radius, colorTwo, idEnd);
        idStart = idEnd;
        vertAssoc.addAssoc(traceIndex, va, i, vertStart, vertEnd);
        vertStart = vertEnd;
        vec3.copy(colorOne, colorTwo);
      }
      vertAssoc.setPerResidueColors(traceIndex, colors);
      vertAssoc.addAssoc(traceIndex, va, trace.length() - 1, vertStart, va.numVerts());
    };
  }();
  return exports;
}(gfxBillboardGeom, gfxLineGeom);
gfxLabel = function () {
  function TextLabel(gl, canvas, context, pos, text, options) {
    SceneNode.call(this, gl);
    var opts = options || {};
    this._options = {};
    this._options.fillStyle = opts.fillStyle || '#000';
    this._options.backgroundAlpha = opts.backgroundAlpha || 0;
    this._options.fontSize = opts.fontSize || 24;
    this._options.font = opts.font || 'Verdana';
    this._options.fontStyle = opts.fontStyle || 'normal';
    this._options.fontColor = opts.fontColor || '#000';
    this._order = 100;
    this._pos = pos;
    this._interleavedBuffer = this._gl.createBuffer();
    this._interleavedData = new Float32Array(5 * 6);
    this._prepareText(canvas, context, text);
    var halfWidth = 0.5;
    var halfHeight = 0.5;
    this._interleavedData[0] = pos[0];
    this._interleavedData[1] = pos[1];
    this._interleavedData[2] = pos[2];
    this._interleavedData[3] = -halfWidth;
    this._interleavedData[4] = -halfHeight;
    this._interleavedData[5] = pos[0];
    this._interleavedData[6] = pos[1];
    this._interleavedData[7] = pos[2];
    this._interleavedData[8] = halfWidth;
    this._interleavedData[9] = halfHeight;
    this._interleavedData[10] = pos[0];
    this._interleavedData[11] = pos[1];
    this._interleavedData[12] = pos[2];
    this._interleavedData[13] = halfWidth;
    this._interleavedData[14] = -halfHeight;
    this._interleavedData[15] = pos[0];
    this._interleavedData[16] = pos[1];
    this._interleavedData[17] = pos[2];
    this._interleavedData[18] = -halfWidth;
    this._interleavedData[19] = -halfHeight;
    this._interleavedData[20] = pos[0];
    this._interleavedData[21] = pos[1];
    this._interleavedData[22] = pos[2];
    this._interleavedData[23] = -halfWidth;
    this._interleavedData[24] = halfHeight;
    this._interleavedData[25] = pos[0];
    this._interleavedData[26] = pos[1];
    this._interleavedData[27] = pos[2];
    this._interleavedData[28] = halfWidth;
    this._interleavedData[29] = halfHeight;
  }
  function smallestPowerOfTwo(size) {
    var s = 1;
    while (s < size) {
      s *= 2;
    }
    return s;
  }
  utils.derive(TextLabel, SceneNode, {
    updateProjectionIntervals: function () {
    },
    updateSquaredSphereRadius: function (center, radius) {
      return radius;
    },
    _setupTextParameters: function (ctx) {
      ctx.fillStyle = this._options.fontColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.font = this._options.fontStyle + ' ' + this._options.fontSize + 'px ' + this._options.font;
    },
    _prepareText: function (canvas, ctx, text) {
      this._setupTextParameters(ctx);
      var estimatedWidth = ctx.measureText(text).width;
      var estimatedHeight = 24;
      canvas.width = smallestPowerOfTwo(estimatedWidth);
      canvas.height = smallestPowerOfTwo(estimatedHeight);
      ctx.fillStyle = this._options.fillStyle;
      ctx.globalAlpha = this._options.backgroundAlpha;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this._setupTextParameters(ctx);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 0.5;
      ctx.lineStyle = 'none';
      ctx.fillText(text, 0, canvas.height);
      ctx.strokeText(text, 0, canvas.height);
      this._texture = this._gl.createTexture();
      this._textureFromCanvas(this._texture, canvas);
      this._xScale = estimatedWidth / canvas.width;
      this._yScale = estimatedHeight / canvas.height;
      this._width = estimatedWidth;
      this._height = estimatedHeight;
    },
    _textureFromCanvas: function (targetTexture, srcCanvas) {
      var gl = this._gl;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    bind: function () {
      var gl = this._gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._interleavedBuffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      if (this._ready) {
        return;
      }
      gl.bufferData(gl.ARRAY_BUFFER, this._interleavedData, gl.STATIC_DRAW);
      this._ready = true;
    },
    draw: function (cam, shaderCatalog, style, pass) {
      if (!this._visible) {
        return;
      }
      if (pass !== 'normal') {
        return;
      }
      var shader = shaderCatalog.text;
      cam.bind(shader);
      this.bind();
      var gl = this._gl;
      var factor = cam.upsamplingFactor();
      gl.uniform1f(gl.getUniformLocation(shader, 'xScale'), this._xScale);
      gl.uniform1f(gl.getUniformLocation(shader, 'yScale'), this._yScale);
      gl.uniform1f(gl.getUniformLocation(shader, 'width'), factor * 2 * this._width / cam.viewportWidth());
      gl.uniform1f(gl.getUniformLocation(shader, 'height'), factor * 2 * this._height / cam.viewportHeight());
      gl.uniform1i(gl.getUniformLocation(shader, 'sampler'), 0);
      var vertAttrib = gl.getAttribLocation(shader, 'attrCenter');
      gl.enableVertexAttribArray(vertAttrib);
      gl.vertexAttribPointer(vertAttrib, 3, gl.FLOAT, false, 5 * 4, 0 * 4);
      var texAttrib = gl.getAttribLocation(shader, 'attrCorner');
      gl.vertexAttribPointer(texAttrib, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
      gl.enableVertexAttribArray(texAttrib);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(vertAttrib);
      gl.disableVertexAttribArray(texAttrib);
      gl.disable(gl.BLEND);
    }
  });
  return TextLabel;
}();
gfxCustomMesh = function (gb) {
  var vec3 = glMatrix.vec3;
  var mat3 = glMatrix.mat3;
  var forceRGB = color.forceRGB;
  var ID_CHUNK_SIZE = 100;
  function DynamicIndexedVertexArray() {
    this._vertData = [];
    this._indexData = [];
    this._numVerts = 0;
  }
  DynamicIndexedVertexArray.prototype = {
    numVerts: function () {
      return this._numVerts;
    },
    addVertex: function (pos, normal, color, objId) {
      this._numVerts += 1;
      this._vertData.push(pos[0], pos[1], pos[2], normal[0], normal[1], normal[2], color[0], color[1], color[2], color[3], objId, 0);
    },
    addTriangle: function (indexOne, indexTwo, indexThree) {
      this._indexData.push(indexOne, indexTwo, indexThree);
    },
    numIndices: function () {
      return this._indexData.length;
    },
    indexData: function () {
      return this._indexData;
    },
    vertData: function () {
      return this._vertData;
    }
  };
  function CustomMesh(name, gl, float32Allocator, uint16Allocator, idPool) {
    SceneNode.call(this, gl);
    this._float32Allocator = float32Allocator;
    this._uint16Allocator = uint16Allocator;
    this._data = new DynamicIndexedVertexArray();
    this._protoSphere = new gb.ProtoSphere(8, 8);
    this._protoCyl = new gb.ProtoCylinder(8);
    this._va = null;
    this._idRanges = [];
    this._idPool = idPool;
    this._ready = false;
    this._currentRange = null;
  }
  function capTubeStart(va, baseIndex, numTubeVerts) {
    for (var i = 0; i < numTubeVerts - 1; ++i) {
      va.addTriangle(baseIndex, baseIndex + 1 + i, baseIndex + 2 + i);
    }
    va.addTriangle(baseIndex, baseIndex + numTubeVerts, baseIndex + 1);
  }
  function capTubeEnd(va, baseIndex, numTubeVerts) {
    var center = baseIndex + numTubeVerts;
    for (var i = 0; i < numTubeVerts - 1; ++i) {
      va.addTriangle(center, baseIndex + i + 1, baseIndex + i);
    }
    va.addTriangle(center, baseIndex, baseIndex + numTubeVerts - 1);
  }
  utils.derive(CustomMesh, SceneNode, {
    updateProjectionIntervals: function () {
    },
    updateSquaredSphereRadius: function (center, radius) {
      return radius;
    },
    addTube: function () {
      var midPoint = vec3.create();
      var left = vec3.create();
      var up = vec3.create();
      var dir = vec3.create();
      var rotation = mat3.create();
      return function (start, end, radius, options) {
        options = options || {};
        var color = forceRGB(options.color || 'white');
        var cap = true;
        if (options.cap !== undefined) {
          cap = options.cap;
        }
        vec3.sub(dir, end, start);
        var length = vec3.length(dir);
        vec3.normalize(dir, dir);
        vec3.add(midPoint, start, end);
        vec3.scale(midPoint, midPoint, 0.5);
        geom.buildRotation(rotation, dir, left, up, false);
        if (cap) {
          var startIndex = this._data.numVerts();
          this._data.addVertex(start, [
            -dir[0],
            -dir[1],
            -dir[2]
          ], color, 0);
          capTubeStart(this._data, startIndex, 8);
        }
        var userData = options.userData !== undefined ? options.userData : null;
        console.log(userData);
        var objectId = this._nextObjectId({
          center: midPoint,
          userData: userData,
          geom: this
        });
        this._protoCyl.addTransformed(this._data, midPoint, length, radius, rotation, color, color, objectId, objectId);
        if (cap) {
          var baseIndex = this._data.numVerts();
          this._data.addVertex(end, dir, color, 0);
          capTubeEnd(this._data, baseIndex - 8, 8);
        }
        this._ready = false;
      };
    }(),
    _nextObjectId: function (data) {
      if (!this._currentRange || !this._currentRange.hasLeft()) {
        this._currentRange = this._idPool.getContinuousRange(ID_CHUNK_SIZE);
        this._idRanges.push(this._currentRange);
      }
      return this._currentRange.nextId(data);
    },
    destroy: function () {
      SceneNode.prototype.destroy.call(this);
      for (var i = 0; i < this._idRanges.length; ++i) {
        this._idRanges[i].recycle();
      }
    },
    addSphere: function (center, radius, options) {
      options = options || {};
      var color = forceRGB(options.color || 'white');
      var userData = options.userData !== undefined ? options.userData : null;
      var objectId = this._nextObjectId({
        center: center,
        userData: userData,
        geom: this
      });
      this._protoSphere.addTransformed(this._data, center, radius, color, objectId);
      this._ready = false;
    },
    _prepareVertexArray: function () {
      this._ready = true;
      if (this._va !== null) {
        this._va.destroy();
      }
      this._va = new IndexedVertexArray(this._gl, this._data.numVerts(), this._data.numIndices(), this._float32Allocator, this._uint16Allocator);
      this._va.setIndexData(this._data.indexData());
      this._va.setVertData(this._data.vertData());
    },
    draw: function (cam, shaderCatalog, style, pass) {
      if (!this._visible) {
        return;
      }
      if (!this._ready) {
        this._prepareVertexArray();
      }
      var shader = this.shaderForStyleAndPass(shaderCatalog, style, pass);
      if (!shader) {
        return;
      }
      cam.bind(shader);
      this._gl.uniform1i(shader.symId, 255);
      var va = this._va;
      va.bind(shader);
      va.draw();
      va.releaseAttribs(shader);
    },
    shaderForStyleAndPass: function (shaderCatalog, style, pass) {
      if (pass === 'normal') {
        if (style === 'hemilight') {
          return shaderCatalog.hemilight;
        } else {
          return shaderCatalog.phong;
        }
      }
      if (pass === 'select') {
        return shaderCatalog.select;
      }
      if (pass === 'outline') {
        return shaderCatalog.outline;
      }
      var shader = shaderCatalog[pass];
      return shader !== undefined ? shader : null;
    }
  });
  return CustomMesh;
}(gfxGeomBuilders);
gfxAnimation = function () {
  var vec3 = glMatrix.vec3;
  var quat = glMatrix.quat;
  var mat3 = glMatrix.mat3;
  function Animation(from, to, duration) {
    this._from = from;
    this._to = to;
    this._duration = duration;
    this._left = duration;
    this._start = Date.now();
    this._looping = false;
    this._finished = false;
  }
  Animation.prototype = {
    setLooping: function (looping) {
      this._looping = looping;
    },
    step: function (cam) {
      var now = Date.now();
      var elapsed = now - this._start;
      var t;
      if (this._duration === 0) {
        t = 1;
      } else {
        if (this._looping) {
          var times = Math.floor(elapsed / this._duration);
          t = (elapsed - times * this._duration) / this._duration;
        } else {
          elapsed = Math.min(this._duration, elapsed);
          t = elapsed / this._duration;
          this._finished = t === 1;
        }
      }
      this.apply(cam, t);
      return this._finished;
    },
    apply: function (cam, t) {
      var smoothInterval = (1 - Math.cos(t * Math.PI)) / 2;
      this._current = this._from * (1 - smoothInterval) + this._to * smoothInterval;
      cam.setZoom(this._current);
    },
    finished: function () {
      return this._finished;
    }
  };
  function Move(from, to, duration) {
    Animation.call(this, vec3.clone(from), vec3.clone(to), duration);
    this._current = vec3.clone(from);
  }
  utils.derive(Move, Animation, {
    apply: function (cam, t) {
      var smoothInterval = (1 - Math.cos(t * Math.PI)) / 2;
      vec3.lerp(this._current, this._from, this._to, smoothInterval);
      cam.setCenter(this._current);
    }
  });
  function Rotate(initialRotation, destinationRotation, duration) {
    var initial = mat3.create();
    var to = mat3.create();
    mat3.fromMat4(initial, initialRotation);
    mat3.fromMat4(to, destinationRotation);
    var initialQuat = quat.create();
    var toQuat = quat.create();
    quat.fromMat3(initialQuat, initial);
    quat.fromMat3(toQuat, to);
    this._current = mat3.create();
    Animation.call(this, initialQuat, toQuat, duration);
  }
  utils.derive(Rotate, Animation, {
    apply: function () {
      var quatRot = quat.create();
      return function (cam, t) {
        quat.slerp(quatRot, this._from, this._to, t);
        mat3.fromQuat(this._current, quatRot);
        cam.setRotation(this._current);
      };
    }()
  });
  function RockAndRoll(axis, duration) {
    Animation.call(this, null, null, duration);
    this._axis = vec3.clone(axis);
    this.setLooping(true);
    this._previousAngle = 0;
  }
  utils.derive(RockAndRoll, Animation, {
    apply: function () {
      var axisRot = mat3.create();
      var rotation = mat3.create();
      return function (cam, t) {
        mat3.fromMat4(rotation, cam.rotation());
        var angle = 0.2 * Math.sin(2 * t * Math.PI);
        var deltaAngle = angle - this._previousAngle;
        this._previousAngle = angle;
        geom.axisRotation(axisRot, this._axis, deltaAngle);
        mat3.mul(rotation, axisRot, rotation);
        cam.setRotation(rotation);
      };
    }()
  });
  function Spin(axis, speed) {
    var duration = 1000 * (2 * Math.PI / speed);
    Animation.call(this, null, null, duration);
    this._axis = vec3.clone(axis);
    this.setLooping(true);
    this._speed = speed;
    this._previousT = 0;
  }
  utils.derive(Spin, Animation, {
    apply: function () {
      var axisRot = mat3.create();
      var rotation = mat3.create();
      return function (cam, t) {
        mat3.fromMat4(rotation, cam.rotation());
        var angle = Math.PI * 2 * (t - this._previousT);
        this._previousT = t;
        geom.axisRotation(axisRot, this._axis, angle);
        mat3.mul(rotation, axisRot, rotation);
        cam.setRotation(rotation);
      };
    }(),
    setSpeed: function (speed) {
      this._speed = speed;
      this._duration = 1000 * (2 * Math.PI / speed);
    },
    setAxis: function (axis) {
      this._axis = axis;
    }
  });
  function AnimationControl() {
    this._animations = [];
  }
  AnimationControl.prototype = {
    run: function (camera) {
      var time = Date.now();
      this._animations = this._animations.filter(function (anim) {
        return !anim.step(camera, time);
      });
      return this._animations.length > 0;
    },
    add: function (animation) {
      this._animations.push(animation);
    },
    remove: function (animation) {
      this._animations = this._animations.filter(function (a) {
        return a !== animation;
      });
    }
  };
  function move(from, to, duration) {
    return new Move(from, to, duration);
  }
  function rotate(from, to, duration) {
    return new Rotate(from, to, duration);
  }
  function zoom(from, to, duration) {
    return new Animation(from, to, duration);
  }
  function spin(axis, speed) {
    return new Spin(axis, speed);
  }
  function rockAndRoll() {
    return new RockAndRoll([
      0,
      1,
      0
    ], 2000);
  }
  return {
    AnimationControl: AnimationControl,
    move: move,
    rotate: rotate,
    zoom: zoom,
    rockAndRoll: rockAndRoll,
    spin: spin
  };
}();
slab = function () {
  function Slab(near, far) {
    this.near = near;
    this.far = far;
  }
  function FixedSlab(options) {
    options = options || {};
    this._near = options.near || 0.1;
    this._far = options.far || 400;
  }
  FixedSlab.prototype.update = function () {
    return new Slab(this._near, this._far);
  };
  function AutoSlab() {
    this._far = 100;
  }
  AutoSlab.prototype.update = function (objects, cam) {
    var center = cam.center();
    var radius = null;
    for (var i = 0; i < objects.length; ++i) {
      var obj = objects[i];
      if (!obj.visible()) {
        continue;
      }
      radius = obj.updateSquaredSphereRadius(center, radius);
    }
    if (radius === null) {
      return null;
    }
    radius = Math.sqrt(radius);
    var zoom = cam.zoom();
    var newFar = (radius + zoom) * 1.05;
    var newNear = 0.1;
    return new Slab(newNear, newFar);
  };
  return {
    FixedSlab: FixedSlab,
    AutoSlab: AutoSlab,
    Slab: Slab
  };
}();
viewer = function (UniqueObjectIdPool, canvas, FrameBuffer, PoolAllocator, Cam, shaders, TouchHandler, MouseHandler, render, TextLabel, CustomMesh, anim) {
  var WEBGL_NOT_SUPPORTED = '<div style="vertical-align:middle; text-align:center;"><h1>WebGL not supported</h1><p>Your browser does not support WebGL. You might want to try Chrome, Firefox, IE 11, or newer versions of Safari</p><p>If you are using a recent version of one of the above browsers, your graphic card might be blocked. Check the browser documentation for details on how to unblock it.</p></div>';
  var vec3 = glMatrix.vec3;
  var mat3 = glMatrix.mat3;
  var mat4 = glMatrix.mat4;
  function isiOS() {
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  }
  function isAndroid() {
    return /Android/gi.test(navigator.userAgent);
  }
  function shouldUseHighPrecision(gl) {
    var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var highpSupported = !!highp.precision;
    return highpSupported && (isiOS() || isAndroid());
  }
  var requestAnimFrame = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  }();
  function slabModeToStrategy(mode, options) {
    mode = mode || 'auto';
    if (mode === 'fixed') {
      return new slab.FixedSlab(options);
    }
    if (mode === 'auto') {
      return new slab.AutoSlab(options);
    }
    return null;
  }
  function PickedObject(target, node, symIndex, pos, object, transform, connectivity) {
    this._pos = pos;
    this._target = target;
    this._node = node;
    this._symIndex = symIndex;
    this._legacyObject = object;
    this._legacyTransform = transform;
    this._connectivity = connectivity;
  }
  PickedObject.prototype = {
    symIndex: function () {
      return this._symIndex;
    },
    target: function () {
      return this._target;
    },
    pos: function () {
      return this._pos;
    },
    connectivity: function () {
      return this._connectivity;
    },
    node: function () {
      return this._node;
    },
    transform: function () {
      return this._legacyTransform;
    },
    object: function () {
      return this._legacyObject;
    }
  };
  function Viewer(domElement, opts) {
    this._options = this._initOptions(opts, domElement);
    this._initialized = false;
    this._objects = [];
    this._domElement = domElement;
    this._redrawRequested = false;
    this._resize = false;
    this._lastTimestamp = null;
    this._objectIdManager = new UniqueObjectIdPool();
    this._spin = null;
    this._rockAndRoll = null;
    this.listenerMap = {};
    this._animControl = new anim.AnimationControl();
    this._initKeyboardInput();
    this._initCanvas();
    this.quality(this._options.quality);
    if (this._options.click !== null) {
      this.on('click', this._options.click);
    }
    if (this._options.doubleClick !== null) {
      this.on('doubleClick', this._options.doubleClick);
    }
    if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') {
      this._initViewer();
    } else {
      document.addEventListener('DOMContentLoaded', utils.bind(this, this._initViewer));
    }
  }
  function optValue(opts, name, defaultValue) {
    if (name in opts) {
      return opts[name];
    }
    return defaultValue;
  }
  function getDoubleClickHandler(opts) {
    if (opts.atomDoubleClick) {
      console.warn('use of atomDoubleClick is deprecated. ', 'use doubleClick instead');
      return opts.atomDoubleClick;
    }
    if (opts.atomDoubleClicked) {
      console.warn('use of atomDoubleClicked is deprecated. ', 'use doubleClick instead');
      return opts.atomDoubleClicked;
    }
    if (opts.doubleClick) {
      return opts.doubleClick;
    }
    return 'center';
  }
  function getClickHandler(opts) {
    if (opts.atomClick) {
      console.warn('use of atomClick is deprecated. ', 'use click instead');
      return opts.atomClick;
    }
    if (opts.atomClicked) {
      console.warn('use of atomClicked is deprecated. ', 'use click instead');
      return opts.atomClicked;
    }
    if (opts.click) {
      return opts.click;
    }
    return null;
  }
  Viewer.prototype = {
    _initOptions: function (opts, domElement) {
      opts = opts || {};
      this._extensions = opts.extensions || [];
      this._extensions.forEach(function (ext) {
        if (ext.optionOverrides !== null) {
          utils.update(opts, ext.optionOverrides());
        }
      });
      var options = {
        width: opts.width || 500,
        height: opts.height || 500,
        animateTime: opts.animateTime || 0,
        antialias: opts.antialias,
        forceManualAntialiasing: optValue(opts, 'forceManualAntialiasing', true),
        quality: optValue(opts, 'quality', 'low'),
        style: optValue(opts, 'style', 'hemilight'),
        background: color.forceRGB(opts.background || 'white'),
        slabMode: slabModeToStrategy(opts.slabMode),
        outline: optValue(opts, 'outline', true),
        outlineColor: color.forceRGB(optValue(opts, 'outlineColor', 'black')),
        outlineWidth: optValue(opts, 'outlineWidth', 1.5),
        selectionColor: color.forceRGB(optValue(opts, 'selectionColor', '#3f3'), 0.7),
        fov: optValue(opts, 'fov', 45),
        doubleClick: getDoubleClickHandler(opts),
        click: getClickHandler(opts),
        fog: optValue(opts, 'fog', true),
        transparency: optValue(opts, 'transparency', 'alpha')
      };
      var parentRect = domElement.getBoundingClientRect();
      if (options.width === 'auto') {
        options.width = parentRect.width;
      }
      if (options.height === 'auto') {
        options.height = parentRect.height;
      }
      return options;
    },
    _ensureSize: function () {
      if (!this._resize) {
        return;
      }
      this._resize = false;
      this._cam.setViewportSize(this._canvas.viewportWidth(), this._canvas.viewportHeight());
      this._pickBuffer.resize(this._options.width, this._options.height);
    },
    resize: function (width, height) {
      if (width === this._options.width && height === this._options.height) {
        return;
      }
      this._canvas.resize(width, height);
      this._resize = true;
      this._options.width = width;
      this._options.height = height;
      this.requestRedraw();
    },
    fitParent: function () {
      var parentRect = this._domElement.getBoundingClientRect();
      this.resize(parentRect.width, parentRect.height);
    },
    gl: function () {
      return this._canvas.gl();
    },
    ok: function () {
      return this._initialized;
    },
    options: function (optName, value) {
      if (value !== undefined) {
        this._options[optName] = value;
        if (optName === 'fog') {
          this._cam.fog(value);
          this.requestRedraw();
        } else if (optName === 'fov') {
          this._cam.setFieldOfViewY(value * Math.PI / 180);
        } else if (optName === 'selectionColor') {
          this._cam.setSelectionColor(color.forceRGB(value, 0.7));
        } else if (optName === 'outlineColor') {
          this._cam.setOutlineColorColor(color.forceRGB(value));
        } else if (optName === 'outlineWidth') {
          this._cam.setOutlineWidth(value + 0);
        } else if (optName === 'transparency') {
          var sd = value === 'screendoor';
          this._cam.setScreenDoorTransparency(sd);
        }
      }
      return this._options[optName];
    },
    quality: function (qual) {
      if (qual === undefined) {
        return this._options.quality;
      }
      this._options.quality = qual;
      if (qual === 'high') {
        this._options.arcDetail = 4;
        this._options.sphereDetail = 16;
        this._options.splineDetail = 8;
      }
      if (qual === 'medium') {
        this._options.arcDetail = 2;
        this._options.sphereDetail = 10;
        this._options.splineDetail = 5;
      }
      if (qual === 'low') {
        this._options.arcDetail = 2;
        this._options.sphereDetail = 8;
        this._options.splineDetail = 3;
      }
      return this._options.quality;
    },
    imageData: function () {
      return this._canvas.imageData();
    },
    _initPickBuffer: function () {
      var fbOptions = {
        width: this._options.width,
        height: this._options.height
      };
      this._pickBuffer = new FrameBuffer(this._canvas.gl(), fbOptions);
    },
    _initViewer: function () {
      if (!this._canvas.initGL()) {
        this._domElement.removeChild(this._canvas.domElement());
        this._domElement.innerHTML = WEBGL_NOT_SUPPORTED;
        this._domElement.style.width = this._options.width + 'px';
        this._domElement.style.height = this._options.height + 'px';
        return false;
      }
      this._initPickBuffer();
      this._2dcontext = this._textureCanvas.getContext('2d');
      this._float32Allocator = new PoolAllocator(Float32Array);
      this._uint16Allocator = new PoolAllocator(Uint16Array);
      this._cam = new Cam(this._canvas.gl());
      this._cam.setUpsamplingFactor(this._canvas.superSamplingFactor());
      this._cam.setOutlineWidth(this._options.outlineWidth);
      this._cam.setOutlineEnabled(this._options.outline);
      var sd = this._options.transparency === 'screendoor';
      this._cam.setScreenDoorTransparency(sd);
      this._cam.fog(this._options.fog);
      this._cam.setFogColor(this._options.background);
      this._cam.setOutlineColor(this._options.outlineColor);
      this._cam.setSelectionColor(this._options.selectionColor);
      this._cam.setFieldOfViewY(this._options.fov * Math.PI / 180);
      this._mouseHandler.setCam(this._cam);
      var c = this._canvas;
      var p = shouldUseHighPrecision(c.gl()) ? 'highp' : 'mediump';
      this._shaderCatalog = {
        hemilight: c.initShader(shaders.HEMILIGHT_VS, shaders.PRELUDE_FS + shaders.HEMILIGHT_FS, p),
        phong: c.initShader(shaders.HEMILIGHT_VS, shaders.PRELUDE_FS + shaders.PHONG_FS, p),
        outline: c.initShader(shaders.OUTLINE_VS, shaders.PRELUDE_FS + shaders.OUTLINE_FS, p),
        lines: c.initShader(shaders.LINES_VS, shaders.PRELUDE_FS + shaders.LINES_FS, p),
        text: c.initShader(shaders.TEXT_VS, shaders.TEXT_FS, p),
        selectLines: c.initShader(shaders.SELECT_LINES_VS, shaders.SELECT_LINES_FS, p),
        select: c.initShader(shaders.SELECT_VS, shaders.SELECT_FS, p)
      };
      if (c.gl().getExtension('EXT_frag_depth')) {
        this._shaderCatalog.spheres = c.initShader(shaders.SPHERES_VS, shaders.PRELUDE_FS + shaders.SPHERES_FS, p);
        this._shaderCatalog.selectSpheres = c.initShader(shaders.SELECT_SPHERES_VS, shaders.PRELUDE_FS + shaders.SELECT_SPHERES_FS, p);
      }
      this._boundDraw = utils.bind(this, this._draw);
      this._touchHandler = new TouchHandler(this._canvas.domElement(), this, this._cam);
      var viewer = this;
      this._extensions.forEach(function (ext) {
        ext.init(viewer);
      });
      if (!this._initialized) {
        this._initialized = true;
        this._dispatchEvent({ 'name': 'viewerReadyEvent' }, 'viewerReady', this);
      }
      return true;
    },
    requestRedraw: function () {
      if (this._redrawRequested) {
        return;
      }
      this._redrawRequested = true;
      requestAnimFrame(this._boundDraw);
    },
    boundingClientRect: function () {
      return this._canvas.domElement().getBoundingClientRect();
    },
    _drawWithPass: function (pass) {
      for (var i = 0, e = this._objects.length; i !== e; ++i) {
        this._objects[i].draw(this._cam, this._shaderCatalog, this._options.style, pass);
      }
    },
    _initKeyboardInput: function () {
      if (isiOS() || isAndroid()) {
        this._keyInput = document;
        return;
      }
      var zeroSizedDiv = document.createElement('div');
      zeroSizedDiv.setAttribute('style', 'overflow:hidden;width:0;height:0');
      this._keyInput = document.createElement('textarea');
      this._domElement.appendChild(zeroSizedDiv);
      zeroSizedDiv.appendChild(this._keyInput);
      this._keyInput.focus();
    },
    focus: function () {
      if (this._keyInput !== document) {
        this._keyInput.focus();
      }
    },
    _initCanvas: function () {
      var canvasOptions = {
        antialias: this._options.antialias,
        forceManualAntialiasing: this._options.forceManualAntialiasing,
        height: this._options.height,
        width: this._options.width,
        backgroundColor: this._options.background
      };
      this._canvas = new canvas.Canvas(this._domElement, canvasOptions);
      this._textureCanvas = document.createElement('canvas');
      this._textureCanvas.style.display = 'none';
      this._domElement.appendChild(this._textureCanvas);
      this._mouseHandler = new MouseHandler(this._canvas, this, this._cam, this._options.animateTime);
      this._canvas.domElement().addEventListener('mousedown', utils.bind(this, this.focus));
    },
    translate: function () {
      var newCenter = vec3.create();
      var inverseRotation = mat4.create();
      return function (vector, ms) {
        ms |= 0;
        mat4.transpose(inverseRotation, this._cam.rotation());
        vec3.transformMat4(newCenter, vector, inverseRotation);
        vec3.sub(newCenter, this._cam.center(), newCenter);
        if (ms === 0) {
          this._cam.setCenter(newCenter);
          this.requestRedraw();
          return;
        }
        this._animControl.add(anim.move(this._cam.center(), vec3.clone(newCenter), ms));
        this.requestRedraw();
      };
    }(),
    rotate: function () {
      var normalizedAxis = vec3.create();
      var targetRotation3 = mat3.create();
      var targetRotation4 = mat4.create();
      return function (axis, angle, ms) {
        ms |= 0;
        vec3.normalize(normalizedAxis, axis);
        geom.axisRotation(targetRotation3, normalizedAxis, angle);
        mat4.fromMat3(targetRotation4, targetRotation3);
        mat4.mul(targetRotation4, targetRotation4, this._cam.rotation());
        if (ms === 0) {
          this._cam.setRotation(targetRotation4);
          this.requestRedraw();
          return;
        }
        this._animControl.add(anim.rotate(this._cam.rotation(), targetRotation4, ms));
        this.requestRedraw();
      };
    }(),
    setRotation: function (rotation, ms) {
      ms |= 0;
      if (ms === 0) {
        this._cam.setRotation(rotation);
        this.requestRedraw();
        return;
      }
      var rotation4;
      if (rotation.length === 9) {
        rotation4 = mat4.create();
        mat4.fromMat3(rotation4, rotation);
      } else {
        rotation4 = mat4.clone(rotation);
      }
      this._animControl.add(anim.rotate(this._cam.rotation(), rotation4, ms));
      this.requestRedraw();
    },
    setCamera: function (rotation, center, zoom, ms) {
      ms |= 0;
      this.setCenter(center, ms);
      this.setRotation(rotation, ms);
      this.setZoom(zoom, ms);
    },
    _animateCam: function () {
      var anotherRedraw = this._animControl.run(this._cam);
      if (anotherRedraw) {
        this.requestRedraw();
      }
    },
    _draw: function () {
      if (this._canvas === null) {
        return;
      }
      this._redrawRequested = false;
      this._animateCam();
      this._canvas.bind();
      this._ensureSize();
      var gl = this._canvas.gl();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var newSlab = this._options.slabMode.update(this._objects, this._cam);
      if (newSlab !== null) {
        this._cam.setNearFar(newSlab.near, newSlab.far);
      }
      gl.enable(gl.CULL_FACE);
      if (this._options.outline) {
        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);
        this._drawWithPass('outline');
      }
      gl.cullFace(gl.FRONT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      this._drawWithPass('normal');
    },
    setCenter: function (center, ms) {
      ms |= 0;
      if (ms === 0) {
        this._cam.setCenter(center);
        return;
      }
      this._animControl.add(anim.move(this._cam.center(), vec3.clone(center), ms));
      this.requestRedraw();
    },
    zoom: function () {
      return this._cam.zoom();
    },
    setZoom: function (zoom, ms) {
      ms |= 0;
      if (ms === 0) {
        this._cam.setZoom(zoom);
        return;
      }
      this._animControl.add(anim.zoom(this._cam.zoom(), zoom, ms));
      this.requestRedraw();
    },
    centerOn: function (what, ms) {
      this.setCenter(what.center(), ms);
    },
    clear: function () {
      for (var i = 0; i < this._objects.length; ++i) {
        this._objects[i].destroy();
      }
      this._objects = [];
    },
    on: function (eventName, callback) {
      if (eventName === 'keypress' || eventName === 'keydown' || eventName === 'keyup') {
        this._keyInput.addEventListener(eventName, callback, false);
        return;
      }
      if (eventName === 'viewpointChanged') {
        this._cam.addOnCameraChanged(callback);
        return;
      }
      if (eventName === 'mousemove' || eventName === 'mousedown' || eventName === 'mouseup') {
        this._canvas.domElement().addEventListener(eventName, callback, false);
      }
      var callbacks = this.listenerMap[eventName];
      if (typeof callbacks === 'undefined') {
        callbacks = [];
        this.listenerMap[eventName] = callbacks;
      }
      if (callback === 'center') {
        var cb = utils.bind(this._mouseHandler, this._mouseHandler._centerOnClicked);
        callbacks.push(cb);
      } else {
        callbacks.push(callback);
      }
      if (this._initialized && eventName === 'viewerReady') {
        callback(this, null);
      }
    },
    _dispatchEvent: function (event, newEventName, arg) {
      var callbacks = this.listenerMap[newEventName];
      if (callbacks) {
        callbacks.forEach(function (callback) {
          callback(arg, event);
        });
      }
    },
    RENDER_MODES: [
      'sline',
      'lines',
      'trace',
      'lineTrace',
      'cartoon',
      'tube',
      'spheres',
      'ballsAndSticks',
      'points'
    ],
    renderAs: function (name, structure, mode, opts) {
      var found = false;
      for (var i = 0; i < this.RENDER_MODES.length; ++i) {
        if (this.RENDER_MODES[i] === mode) {
          found = true;
          break;
        }
      }
      if (!found) {
        console.error('render mode', mode, 'not supported');
        return;
      }
      return this[mode](name, structure, opts);
    },
    _handleStandardMolOptions: function (opts, structure) {
      opts = this._handleStandardOptions(opts);
      opts.showRelated = opts.showRelated || 'asym';
      if (opts.showRelated && opts.showRelated !== 'asym') {
        if (structure.assembly(opts.showRelated) === null) {
          console.error('no assembly with name', opts.showRelated, '. Falling back to asymmetric unit');
          opts.showRelated = 'asym';
        }
      }
      return opts;
    },
    _handleStandardOptions: function (opts) {
      opts = utils.copy(opts);
      opts.float32Allocator = this._float32Allocator;
      opts.uint16Allocator = this._uint16Allocator;
      opts.idPool = this._objectIdManager;
      return opts;
    },
    lineTrace: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.uniform([
        1,
        0,
        1
      ]);
      options.lineWidth = options.lineWidth || 4;
      var obj = render.lineTrace(structure, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    spheres: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.byElement();
      options.sphereDetail = this.options('sphereDetail');
      options.radiusMultiplier = options.radiusMultiplier || 1;
      var obj;
      if (this._canvas.gl().getExtension('EXT_frag_depth')) {
        obj = render.billboardedSpheres(structure, this._canvas.gl(), options);
      } else {
        obj = render.spheres(structure, this._canvas.gl(), options);
      }
      return this.add(name, obj);
    },
    sline: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.uniform([
        1,
        0,
        1
      ]);
      options.splineDetail = options.splineDetail || this.options('splineDetail');
      options.strength = options.strength || 1;
      options.lineWidth = options.lineWidth || 4;
      var obj = render.sline(structure, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    cartoon: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.bySS();
      options.strength = options.strength || 1;
      options.splineDetail = options.splineDetail || this.options('splineDetail');
      options.arcDetail = options.arcDetail || this.options('arcDetail');
      options.radius = options.radius || 0.3;
      options.forceTube = options.forceTube || false;
      options.smoothStrands = options.smoothStrands === undefined ? true : options.smoothStrands;
      var obj = render.cartoon(structure, this._canvas.gl(), options);
      var added = this.add(name, obj);
      return added;
    },
    surface: function (name, data, opts) {
      var options = this._handleStandardOptions(opts);
      var obj = render.surface(data, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    tube: function (name, structure, opts) {
      opts = opts || {};
      opts.forceTube = true;
      return this.cartoon(name, structure, opts);
    },
    ballsAndSticks: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.byElement();
      options.cylRadius = options.radius || options.cylRadius || 0.1;
      options.sphereRadius = options.radius || options.sphereRadius || 0.2;
      options.arcDetail = (options.arcDetail || this.options('arcDetail')) * 2;
      options.sphereDetail = options.sphereDetail || this.options('sphereDetail');
      options.scaleByAtomRadius = optValue(options, 'scaleByAtomRadius', true);
      var obj = render.ballsAndSticks(structure, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    lines: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.byElement();
      options.lineWidth = options.lineWidth || 4;
      var obj = render.lines(structure, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    points: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.byElement();
      options.pointSize = options.pointSize || 1;
      var obj = render.points(structure, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    trace: function (name, structure, opts) {
      var options = this._handleStandardMolOptions(opts, structure);
      options.color = options.color || color.uniform([
        1,
        0,
        0
      ]);
      options.radius = options.radius || 0.3;
      options.arcDetail = (options.arcDetail || this.options('arcDetail')) * 2;
      options.sphereDetail = options.sphereDetail || this.options('sphereDetail');
      var obj = render.trace(structure, this._canvas.gl(), options);
      return this.add(name, obj);
    },
    _updateProjectionIntervals: function (axes, intervals, structure) {
      structure.eachAtom(function (atom) {
        var pos = atom.pos();
        for (var i = 0; i < 3; ++i) {
          intervals[i].update(vec3.dot(pos, axes[i]));
        }
      });
      for (var i = 0; i < 3; ++i) {
        intervals[i].extend(1.5);
      }
    },
    fitTo: function (what, ms) {
      var axes = this._cam.mainAxes();
      var intervals = [
        new utils.Range(),
        new utils.Range(),
        new utils.Range()
      ];
      if (what instanceof SceneNode) {
        what.updateProjectionIntervals(axes[0], axes[1], axes[2], intervals[0], intervals[1], intervals[2]);
      } else if (what.eachAtom !== undefined) {
        this._updateProjectionIntervals(axes, intervals, what);
      } else if (what.length !== undefined) {
        for (var i = 0; i < what.length; ++i) {
          this._updateProjectionIntervals(axes, intervals, what[i]);
        }
      }
      this._fitToIntervals(axes, intervals, ms);
    },
    _fitToIntervals: function (axes, intervals, ms) {
      if (intervals[0].empty() || intervals[1].empty() || intervals[2].empty()) {
        console.error('could not determine interval. No objects shown?');
        return;
      }
      var cx = intervals[0].center();
      var cy = intervals[1].center();
      var cz = intervals[2].center();
      var center = [
        cx * axes[0][0] + cy * axes[1][0] + cz * axes[2][0],
        cx * axes[0][1] + cy * axes[1][1] + cz * axes[2][1],
        cx * axes[0][2] + cy * axes[1][2] + cz * axes[2][2]
      ];
      var fovY = this._cam.fieldOfViewY();
      var aspect = this._cam.aspectRatio();
      var inPlaneX = intervals[0].length() / aspect;
      var inPlaneY = intervals[1].length();
      var inPlane = Math.max(inPlaneX, inPlaneY) * 0.5;
      var distanceToFront = inPlane / Math.tan(0.5 * fovY);
      var newZoom = distanceToFront + 0.5 * intervals[2].length();
      var grace = 0.5;
      var near = Math.max(distanceToFront - grace, 0.1);
      var far = 2 * grace + distanceToFront + intervals[2].length();
      this._cam.setNearFar(near, far);
      var time = ms === undefined ? this._options.animateTime : ms | 0;
      this.setCamera(this._cam.rotation(), center, newZoom, time);
      this.requestRedraw();
    },
    autoZoom: function (ms) {
      var axes = this._cam.mainAxes();
      var intervals = [
        new utils.Range(),
        new utils.Range(),
        new utils.Range()
      ];
      this.forEach(function (obj) {
        if (!obj.visible()) {
          return;
        }
        obj.updateProjectionIntervals(axes[0], axes[1], axes[2], intervals[0], intervals[1], intervals[2]);
      });
      this._fitToIntervals(axes, intervals, ms);
    },
    slabInterval: function () {
    },
    autoSlab: function () {
      var slab = this._options._slabMode.update(this._objects, this._cam);
      if (slab !== null) {
        this._cam.setNearFar(slab.near, slab.far);
      }
      this.requestRedraw();
    },
    rockAndRoll: function (enable) {
      if (enable === undefined) {
        return this._rockAndRoll !== null;
      }
      if (!!enable) {
        if (this._rockAndRoll === null) {
          this._rockAndRoll = anim.rockAndRoll();
          this._animControl.add(this._rockAndRoll);
          this.requestRedraw();
        }
        return true;
      }
      this._animControl.remove(this._rockAndRoll);
      this._rockAndRoll = null;
      this.requestRedraw();
      return false;
    },
    spin: function (speed, axis) {
      if (speed === undefined) {
        return this._spin !== null;
      }
      if (speed === false) {
        this._animControl.remove(this._spin);
        this._spin = null;
        this.requestRedraw();
        return false;
      }
      if (speed === true) {
        speed = Math.PI / 8;
      }
      axis = axis || [
        0,
        1,
        0
      ];
      if (this._spin === null) {
        this._spin = anim.spin(axis, speed);
        this._animControl.add(this._spin);
      } else {
        this._spin.setSpeed(speed);
        this._spin.setAxis(axis);
      }
      this.requestRedraw();
      return true;
    },
    slabMode: function (mode, options) {
      options = options || {};
      var strategy = slabModeToStrategy(mode, options);
      var slab = strategy.update(this._objects, this._cam);
      if (slab !== null) {
        this._cam.setNearFar(slab.near, slab.far);
      }
      this._options.slabMode = strategy;
      this.requestRedraw();
    },
    label: function (name, text, pos, options) {
      var label = new TextLabel(this._canvas.gl(), this._textureCanvas, this._2dcontext, pos, text, options);
      this.add(name, label);
      return label;
    },
    customMesh: function (name, opts) {
      var options = this._handleStandardOptions(opts);
      var mesh = new CustomMesh(name, this._canvas.gl(), options.float32Allocator, options.uint16Allocator, options.idPool);
      this.add(name, mesh);
      return mesh;
    },
    _drawPickingScene: function () {
      var gl = this._canvas.gl();
      gl.clearColor(0, 0, 0, 0);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.clearColor(this._options.background[0], this._options.background[1], this._options.background[2], 1);
      gl.cullFace(gl.FRONT);
      gl.enable(gl.CULL_FACE);
      this._drawWithPass('select');
    },
    pick: function () {
      return function (pos) {
        this._pickBuffer.bind();
        this._drawPickingScene();
        var pixels = new Uint8Array(4);
        var gl = this._canvas.gl();
        gl.readPixels(pos.x, this._options.height - pos.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        this._pickBuffer.release();
        if (pixels.data) {
          pixels = pixels.data;
        }
        var objId = pixels[0] | pixels[1] << 8 | pixels[2] << 16;
        var symIndex = pixels[3];
        var picked = this._objectIdManager.objectForId(objId);
        if (picked === undefined) {
          return null;
        }
        var transformedPos = vec3.create();
        var target = null;
        var transform = null;
        var connectivity = 'unknown';
        if (symIndex !== 255) {
          target = picked.atom;
          transform = picked.geom.symWithIndex(symIndex);
          vec3.transformMat4(transformedPos, picked.atom.pos(), transform);
          connectivity = picked.isTrace ? 'trace' : 'full';
        } else {
          if (picked.atom !== undefined) {
            target = picked.atom;
            transformedPos = picked.atom.pos();
            connectivity = picked.isTrace ? 'trace' : 'full';
          } else {
            target = picked.userData;
            transformedPos = picked.center;
          }
        }
        return new PickedObject(target, picked.geom, symIndex < 255 ? symIndex : null, transformedPos, picked, transform, connectivity);
      };
    }(),
    add: function (name, obj) {
      obj.name(name);
      this._objects.push(obj);
      this._objects.sort(function (lhs, rhs) {
        return lhs.order() - rhs.order();
      });
      this.requestRedraw();
      return obj;
    },
    _globToRegex: function (glob) {
      var r = glob.replace('.', '\\.').replace('*', '.*');
      return new RegExp('^' + r + '$');
    },
    forEach: function () {
      var callback, pattern = '*';
      if (arguments.length === 2) {
        callback = arguments[1];
        pattern = arguments[0];
      } else {
        callback = arguments[0];
      }
      var regex = this._globToRegex(pattern);
      for (var i = 0; i < this._objects.length; ++i) {
        var obj = this._objects[i];
        if (regex.test(obj.name())) {
          callback(obj, i);
        }
      }
    },
    rotation: function () {
      return this._cam.rotation();
    },
    center: function () {
      return this._cam.center();
    },
    get: function (name) {
      for (var i = 0; i < this._objects.length; ++i) {
        if (this._objects[i].name() === name) {
          return this._objects[i];
        }
      }
      console.error('could not find object with name', name);
      return null;
    },
    hide: function (glob) {
      this.forEach(glob, function (obj) {
        obj.hide();
      });
    },
    show: function (glob) {
      this.forEach(glob, function (obj) {
        obj.show();
      });
    },
    rm: function (glob) {
      var newObjects = [];
      var regex = this._globToRegex(glob);
      for (var i = 0; i < this._objects.length; ++i) {
        var obj = this._objects[i];
        if (!regex.test(obj.name())) {
          newObjects.push(obj);
        } else {
          obj.destroy();
        }
      }
      this._objects = newObjects;
    },
    all: function () {
      return this._objects;
    },
    isWebGLSupported: function () {
      return this._canvas.isWebGLSupported();
    },
    destroy: function () {
      this.clear();
      this._canvas.destroy();
      this._canvas = null;
    }
  };
  Viewer.prototype.addListener = Viewer.prototype.on;
  return {
    Viewer: function (elem, options) {
      return new Viewer(elem, options);
    },
    isWebGLSupported: canvas.isWebGLSupported
  };
}(uniqueObjectIdPool, gfxCanvas, gfxFramebuffer, bufferAllocators, gfxCam, gfxShaders, touch, mouse, gfxRender, gfxLabel, gfxCustomMesh, gfxAnimation);
molSymmetry = function () {
  function SymGenerator(chains, matrices) {
    this._chains = chains || [];
    this._matrices = matrices || [];
  }
  SymGenerator.prototype = {
    addChain: function (name) {
      this._chains.push(name);
    },
    chains: function () {
      return this._chains;
    },
    addMatrix: function (matrix) {
      this._matrices.push(matrix);
    },
    matrices: function () {
      return this._matrices;
    },
    matrix: function (index) {
      return this._matrices[index];
    }
  };
  function Assembly(name) {
    this._name = name;
    this._generators = [];
  }
  Assembly.prototype = {
    name: function () {
      return this._name;
    },
    generators: function () {
      return this._generators;
    },
    generator: function (index) {
      return this._generators[index];
    },
    addGenerator: function (gen) {
      this._generators.push(gen);
    }
  };
  return {
    SymGenerator: SymGenerator,
    Assembly: Assembly
  };
}();
molAtom = function () {
  var vec3 = glMatrix.vec3;
  function AtomBase() {
  }
  AtomBase.prototype = {
    bondCount: function () {
      return this.bonds().length;
    },
    eachBond: function (callback) {
      var bonds = this.bonds();
      for (var i = 0, e = bonds.length; i < e; ++i) {
        callback(bonds[i]);
      }
    },
    isConnectedTo: function (otherAtom) {
      if (otherAtom === null) {
        return false;
      }
      var other = otherAtom.full();
      var me = this.full();
      var bonds = this.bonds();
      for (var i = 0, e = bonds.length; i < e; ++i) {
        var bond = bonds[i];
        if (bond.atom_one() === me && bond.atom_two() === other || bond.atom_one() === other && bond.atom_two() === me) {
          return true;
        }
      }
      return false;
    }
  };
  function Atom(residue, name, pos, element, index, isHetatm, occupancy, tempFactor, serial) {
    AtomBase.call(this);
    this._properties = {};
    this._residue = residue;
    this._bonds = [];
    this._isHetatm = !!isHetatm;
    this._name = name;
    this._pos = pos;
    this._index = index;
    this._element = element;
    this._occupancy = occupancy !== undefined ? occupancy : null;
    this._tempFactor = tempFactor !== undefined ? tempFactor : null;
    this._serial = serial | 0;
  }
  utils.derive(Atom, AtomBase, {
    addBond: function (bond) {
      this._bonds.push(bond);
    },
    name: function () {
      return this._name;
    },
    bonds: function () {
      return this._bonds;
    },
    residue: function () {
      return this._residue;
    },
    structure: function () {
      return this._residue.structure();
    },
    full: function () {
      return this;
    },
    qualifiedName: function () {
      return this.residue().qualifiedName() + '.' + this.name();
    },
    pos: function () {
      return this._pos;
    },
    setPos: function (pos) {
      vec3.copy(this._pos, pos);
    },
    element: function () {
      return this._element;
    },
    index: function () {
      return this._index;
    },
    occupancy: function () {
      return this._occupancy;
    },
    tempFactor: function () {
      return this._tempFactor;
    },
    serial: function () {
      return this._serial;
    },
    isHetatm: function () {
      return this._isHetatm;
    },
    prop: function (propName) {
      var fn = this[propName];
      if (fn !== undefined) {
        return fn.call(this);
      }
      var property = this._properties[propName];
      return property === undefined ? 0 : property;
    },
    setProp: function (propName, value) {
      this._properties[propName] = value;
    }
  });
  function AtomView(resView, atom) {
    AtomBase.call(this);
    this._resView = resView;
    this._atom = atom;
    this._bonds = [];
  }
  utils.derive(AtomView, AtomBase, {
    full: function () {
      return this._atom;
    },
    name: function () {
      return this._atom.name();
    },
    pos: function () {
      return this._atom.pos();
    },
    element: function () {
      return this._atom.element();
    },
    residue: function () {
      return this._resView;
    },
    bonds: function () {
      return this._atom.bonds();
    },
    index: function () {
      return this._atom.index();
    },
    occupancy: function () {
      return this._atom.occupancy();
    },
    tempFactor: function () {
      return this._atom.tempFactor();
    },
    serial: function () {
      return this._atom.serial();
    },
    qualifiedName: function () {
      return this._atom.qualifiedName();
    },
    isHetatm: function () {
      return this._atom.isHetatm();
    },
    prop: function (propName) {
      return this._atom.prop(propName);
    },
    setProp: function (propName, value) {
      this._atom.setProp(propName, value);
    }
  });
  return {
    Atom: Atom,
    AtomView: AtomView
  };
}();
molResidue = function (atom) {
  var vec3 = glMatrix.vec3;
  var Atom = atom.Atom;
  var AtomView = atom.AtomView;
  function ResidueBase() {
  }
  ResidueBase.prototype = {
    isWater: function () {
      return this.name() === 'HOH' || this.name() === 'DOD';
    },
    eachAtom: function (callback, index) {
      index |= 0;
      for (var i = 0; i < this._atoms.length; i += 1) {
        if (callback(this._atoms[i], index) === false) {
          return false;
        }
        index += 1;
      }
      return index;
    },
    qualifiedName: function () {
      var name = this.chain().name() + '.' + this.name() + this.num();
      if (this.insCode() === '\0') {
        return name;
      }
      return name + this.insCode();
    },
    atom: function (index_or_name) {
      if (typeof index_or_name === 'string') {
        for (var i = 0; i < this._atoms.length; ++i) {
          if (this._atoms[i].name() === index_or_name) {
            return this._atoms[i];
          }
        }
        return null;
      }
      if (index_or_name >= this._atoms.length || index_or_name < 0) {
        return null;
      }
      return this._atoms[index_or_name];
    },
    centralAtom: function () {
      if (this.isAminoacid()) {
        return this.atom('CA');
      }
      if (this.isNucleotide()) {
        return this.atom('C3\'');
      }
      return null;
    },
    center: function () {
      var count = 0;
      var c = vec3.create();
      this.eachAtom(function (atom) {
        vec3.add(c, c, atom.pos());
        count += 1;
      });
      if (count > 0) {
        vec3.scale(c, c, 1 / count);
      }
      return c;
    },
    isAminoacid: function () {
      return this._isAminoacid;
    },
    isNucleotide: function () {
      return this._isNucleotide;
    }
  };
  function Residue(chain, name, num, insCode) {
    ResidueBase.call(this);
    this._name = name;
    this._num = num;
    this._insCode = insCode;
    this._atoms = [];
    this._ss = 'C';
    this._chain = chain;
    this._isAminoacid = false;
    this._isNucleotide = false;
    this._index = chain.residues().length;
    this._properties = {};
  }
  utils.derive(Residue, ResidueBase, {
    _deduceType: function () {
      this._isNucleotide = this.atom('P') !== null && this.atom('C3\'') !== null;
      this._isAminoacid = this.atom('N') !== null && this.atom('CA') !== null && this.atom('C') !== null && this.atom('O') !== null;
    },
    name: function () {
      return this._name;
    },
    insCode: function () {
      return this._insCode;
    },
    num: function () {
      return this._num;
    },
    full: function () {
      return this;
    },
    addAtom: function (name, pos, element, isHetatm, occupancy, tempFactor, serial) {
      var atom = new Atom(this, name, pos, element, this.structure().nextAtomIndex(), isHetatm, occupancy, tempFactor, serial | 0);
      this._atoms.push(atom);
      return atom;
    },
    ss: function () {
      return this._ss;
    },
    setSS: function (ss) {
      this._ss = ss;
    },
    index: function () {
      return this._index;
    },
    atoms: function () {
      return this._atoms;
    },
    chain: function () {
      return this._chain;
    },
    structure: function () {
      return this._chain.structure();
    },
    prop: function (propName) {
      var fn = this[propName];
      if (fn !== undefined) {
        return fn.call(this);
      }
      var property = this._properties[propName];
      return property === undefined ? 0 : property;
    },
    setProp: function (propName, value) {
      this._properties[propName] = value;
    }
  });
  function ResidueView(chainView, residue) {
    ResidueBase.call(this);
    this._chainView = chainView;
    this._atoms = [];
    this._residue = residue;
  }
  utils.derive(ResidueView, ResidueBase, {
    addAtom: function (atom, checkDuplicates) {
      if (checkDuplicates) {
        for (var i = 0; i < this._atoms.length; ++i) {
          var ai = this._atoms[i];
          if (ai.index() === atom.index()) {
            return ai;
          }
        }
      }
      var atomView = new AtomView(this, atom.full());
      this._atoms.push(atomView);
      return atomView;
    },
    removeAtom: function (atom) {
      var lengthBefore = this._atoms.length;
      this._atoms = this._atoms.filter(function (a) {
        return a.index() !== atom.index();
      });
      return lengthBefore !== this._atoms.length;
    },
    full: function () {
      return this._residue;
    },
    num: function () {
      return this._residue.num();
    },
    insCode: function () {
      return this._residue.insCode();
    },
    ss: function () {
      return this._residue.ss();
    },
    index: function () {
      return this._residue.index();
    },
    chain: function () {
      return this._chainView;
    },
    name: function () {
      return this._residue.name();
    },
    atoms: function () {
      return this._atoms;
    },
    qualifiedName: function () {
      return this._residue.qualifiedName();
    },
    containsResidue: function (residue) {
      return this._residue.full() === residue.full();
    },
    isAminoacid: function () {
      return this._residue.isAminoacid();
    },
    isNucleotide: function () {
      return this._residue.isNucleotide();
    },
    isWater: function () {
      return this._residue.isWater();
    },
    prop: function (propName) {
      return this._residue.prop(propName);
    },
    setProp: function (propName, value) {
      this._residue.setProp(propName, value);
    }
  });
  return {
    ResidueView: ResidueView,
    Residue: Residue
  };
}(molAtom);
molTrace = function () {
  var vec3 = glMatrix.vec3;
  function BackboneTrace() {
    this._trace = [];
  }
  BackboneTrace.prototype = {
    push: function (residue) {
      this._trace.push(residue);
    },
    length: function () {
      return this._trace.length;
    },
    residueAt: function (index) {
      return this._trace[index];
    },
    posAt: function (out, index) {
      vec3.copy(out, this._trace[index].centralAtom().pos());
      return out;
    },
    normalAt: function (out, index) {
      var residue = this._trace[index];
      if (residue.isAminoacid()) {
        vec3.sub(out, residue.atom('O').pos(), residue.atom('C').pos());
      }
      vec3.normalize(out, out);
      return out;
    },
    centralAtomAt: function (index) {
      return this._trace[index].centralAtom();
    },
    tangentAt: function () {
      var posBefore = vec3.create();
      var posAfter = vec3.create();
      return function (out, index) {
        if (index > 0) {
          this.posAt(posBefore, index - 1);
        } else {
          this.posAt(posBefore, index);
        }
        if (index < this._trace.length - 1) {
          this.posAt(posAfter, index + 1);
        } else {
          this.posAt(posAfter, index);
        }
        vec3.sub(out, posAfter, posBefore);
      };
    }(),
    fullTraceIndex: function (index) {
      return index;
    },
    residues: function () {
      return this._trace;
    },
    subsets: function (residues) {
      var fullTraceIdx = 0, listIdx = 0;
      var subsets = [];
      while (listIdx < residues.length && fullTraceIdx < this._trace.length) {
        var residueIndex = residues[listIdx].full().index();
        while (this._trace.length > fullTraceIdx && this._trace[fullTraceIdx].index() < residueIndex) {
          ++fullTraceIdx;
        }
        if (fullTraceIdx >= this._trace.length) {
          break;
        }
        var traceIndex = this._trace[fullTraceIdx].index();
        while (residues.length > listIdx && residues[listIdx].full().index() < traceIndex) {
          ++listIdx;
        }
        if (listIdx >= residues.length) {
          break;
        }
        var fullTraceBegin = fullTraceIdx;
        while (residues.length > listIdx && this._trace.length > fullTraceIdx && residues[listIdx].full().index() === this._trace[fullTraceIdx].index()) {
          ++listIdx;
          ++fullTraceIdx;
        }
        var fullTraceEnd = fullTraceIdx;
        subsets.push(new TraceSubset(this, fullTraceBegin, fullTraceEnd));
      }
      return subsets;
    }
  };
  BackboneTrace.prototype.smoothPosAt = BackboneTrace.prototype.posAt;
  BackboneTrace.prototype.smoothNormalAt = BackboneTrace.prototype.normalAt;
  function TraceSubset(fullTrace, fullTraceBegin, fullTraceEnd) {
    this._fullTrace = fullTrace;
    this._fullTraceBegin = fullTraceBegin;
    this._fullTraceEnd = fullTraceEnd;
    this._isNTerminal = this._fullTraceBegin === 0;
    this._isCTerminal = this._fullTrace.length() === this._fullTraceEnd;
    var length = this._fullTraceEnd - this._fullTraceBegin;
    if (!this._isCTerminal) {
      ++length;
    }
    if (!this._isNTerminal) {
      ++length;
      this._fullTraceBegin -= 1;
    }
    this._length = length;
  }
  TraceSubset.prototype = {
    length: function () {
      return this._length;
    },
    residueAt: function (index) {
      return this._fullTrace.residueAt(this._fullTraceBegin + index);
    },
    residues: function () {
      var residues = [];
      for (var i = 0; i < this._length; ++i) {
        residues.push(this.residueAt(i));
      }
      return residues;
    },
    _interpolate: function () {
      var tangentOne = vec3.create();
      var tangentTwo = vec3.create();
      return function (out, indexOne, indexTwo, strength) {
        this.tangentAt(tangentOne, indexOne);
        this.tangentAt(tangentTwo, indexTwo);
        vec3.scale(tangentOne, tangentOne, strength);
        vec3.scale(tangentTwo, tangentTwo, strength);
        geom.cubicHermiteInterpolate(out, this.centralAtomAt(indexOne).pos(), tangentOne, this.centralAtomAt(indexTwo).pos(), tangentTwo, 0.5, 0);
        return out;
      };
    }(),
    smoothPosAt: function () {
      return function (out, index, strength) {
        if (index === 0 && !this._isNTerminal) {
          return this._interpolate(out, index, index + 1, strength);
        }
        if (index === this._length - 1 && !this._isCTerminal) {
          return this._interpolate(out, index - 1, index, strength);
        }
        var atom = this.centralAtomAt(index);
        vec3.copy(out, atom.pos());
        return out;
      };
    }(),
    smoothNormalAt: function () {
      return function (out, index) {
        this._fullTrace.normalAt(out, index + this._fullTraceBegin);
        return out;
      };
    }(),
    posAt: function (out, index) {
      var atom = this.centralAtomAt(index);
      var atom2 = null;
      vec3.copy(out, atom.pos());
      if (index === 0 && !this._isNTerminal) {
        atom2 = this.centralAtomAt(index + 1);
        vec3.add(out, out, atom2.pos());
        vec3.scale(out, out, 0.5);
      }
      if (index === this._length - 1 && !this._isCTerminal) {
        atom2 = this.centralAtomAt(index - 1);
        vec3.add(out, out, atom2.pos());
        vec3.scale(out, out, 0.5);
      }
      return out;
    },
    centralAtomAt: function (index) {
      return this.residueAt(index).centralAtom();
    },
    fullTraceIndex: function (index) {
      return this._fullTraceBegin + index;
    },
    tangentAt: function (out, index) {
      return this._fullTrace.tangentAt(out, index + this._fullTraceBegin);
    }
  };
  return {
    TraceSubset: TraceSubset,
    BackboneTrace: BackboneTrace
  };
}();
molChain = function (residue, trace) {
  var vec3 = glMatrix.vec3;
  var Residue = residue.Residue;
  var ResidueView = residue.ResidueView;
  function rnumInsCodeHash(num, insCode) {
    return num << 8 | insCode.charCodeAt(0);
  }
  function rnumComp(lhs, rhs) {
    return lhs.num() < rhs.num();
  }
  function numify(val) {
    return {
      num: function () {
        return val;
      }
    };
  }
  function ChainBase() {
  }
  ChainBase.prototype = {
    eachAtom: function (callback, index) {
      index |= 0;
      for (var i = 0; i < this._residues.length; i += 1) {
        index = this._residues[i].eachAtom(callback, index);
        if (index === false) {
          return false;
        }
      }
      return index;
    },
    atomCount: function () {
      var count = 0;
      var residues = this.residues();
      for (var ri = 0; ri < residues.length; ++ri) {
        count += residues[ri].atoms().length;
      }
      return count;
    },
    eachResidue: function (callback) {
      for (var i = 0; i < this._residues.length; i += 1) {
        if (callback(this._residues[i]) === false) {
          return false;
        }
      }
    },
    residues: function () {
      return this._residues;
    },
    structure: function () {
      return this._structure;
    },
    asView: function () {
      var view = this.structure().createEmptyView();
      view.addChain(this, true);
      return view;
    },
    residueByRnum: function (rnum) {
      var residues = this.residues();
      if (this._rnumsOrdered) {
        var index = utils.binarySearch(residues, numify(rnum), rnumComp);
        if (index === -1) {
          return null;
        }
        return residues[index];
      } else {
        for (var i = 0; i < residues.length; ++i) {
          if (residues[i].num() === rnum) {
            return residues[i];
          }
        }
        return null;
      }
    },
    residuesInRnumRange: function (start, end) {
      var matching = [];
      var i, e;
      var residues = this.residues();
      if (this._rnumsOrdered === true) {
        var startIdx = utils.indexFirstLargerEqualThan(residues, numify(start), rnumComp);
        if (startIdx === -1) {
          return matching;
        }
        var endIdx = utils.indexLastSmallerEqualThan(residues, numify(end), rnumComp);
        if (endIdx === -1) {
          return matching;
        }
        for (i = startIdx; i <= endIdx; ++i) {
          matching.push(this._residues[i]);
        }
      } else {
        for (i = 0, e = residues.length; i !== e; ++i) {
          var res = residues[i];
          if (res.num() >= start && res.num() <= end) {
            matching.push(res);
          }
        }
      }
      return matching;
    },
    prop: function (propName) {
      return this[propName]();
    }
  };
  function Chain(structure, name) {
    ChainBase.call(this);
    this._structure = structure;
    this._name = name;
    this._cachedTraces = [];
    this._residues = [];
    this._rnumsOrdered = true;
  }
  function shouldIntroduceTraceBreak(aaStretch, prevResidue, thisResidue) {
    var prevAtom, thisAtom;
    if (aaStretch) {
      prevAtom = prevResidue.atom('C');
      thisAtom = thisResidue.atom('N');
    } else {
      prevAtom = prevResidue.atom('O3\'');
      thisAtom = thisResidue.atom('P');
    }
    if (prevAtom.isConnectedTo(thisAtom)) {
      return false;
    }
    var sqrDist = vec3.sqrDist(prevAtom.pos(), thisAtom.pos());
    return Math.abs(sqrDist - 1.5 * 1.5) > 1;
  }
  function addNonEmptyTrace(traces, trace) {
    if (trace.length() < 2) {
      return;
    }
    traces.push(trace);
  }
  function checkRnumsOrdered(residues, orderedFlag, newResidue) {
    if (residues.length === 0) {
      return true;
    }
    if (!orderedFlag) {
      return false;
    }
    var combinedRNum = rnumInsCodeHash(newResidue.num(), newResidue.insCode());
    var last = residues[residues.length - 1];
    var lastCombinedRNum = rnumInsCodeHash(last.num(), last.insCode());
    return lastCombinedRNum < combinedRNum;
  }
  utils.derive(Chain, ChainBase, {
    name: function () {
      return this._name;
    },
    full: function () {
      return this;
    },
    addResidue: function (name, num, insCode) {
      insCode = insCode || '\0';
      var residue = new Residue(this, name, num, insCode);
      this._rnumsOrdered = checkRnumsOrdered(this._residues, this._rnumsOrdered, residue);
      this._residues.push(residue);
      return residue;
    },
    assignSS: function (fromNumAndIns, toNumAndIns, ss) {
      var from = rnumInsCodeHash(fromNumAndIns[0], fromNumAndIns[1]);
      var to = rnumInsCodeHash(toNumAndIns[0], toNumAndIns[1]);
      for (var i = 1; i < this._residues.length - 1; ++i) {
        var res = this._residues[i];
        var combined = rnumInsCodeHash(res.num(), res.insCode());
        if (combined < from || combined >= to) {
          continue;
        }
        res.setSS(ss);
      }
    },
    eachBackboneTrace: function (callback) {
      this._cacheBackboneTraces();
      for (var i = 0; i < this._cachedTraces.length; ++i) {
        callback(this._cachedTraces[i]);
      }
    },
    _cacheBackboneTraces: function () {
      if (this._cachedTraces.length > 0) {
        return;
      }
      var stretch = new trace.BackboneTrace();
      var aaStretch = null;
      for (var i = 0; i < this._residues.length; i += 1) {
        var residue = this._residues[i];
        var isAminoacid = residue.isAminoacid();
        var isNucleotide = residue.isNucleotide();
        if (aaStretch === true && !isAminoacid || aaStretch === false && !isNucleotide || aaStretch === null && !isNucleotide && !isAminoacid) {
          addNonEmptyTrace(this._cachedTraces, stretch);
          aaStretch = null;
          stretch = new trace.BackboneTrace();
          continue;
        }
        if (stretch.length() === 0) {
          stretch.push(residue);
          aaStretch = residue.isAminoacid();
          continue;
        }
        var prevResidue = this._residues[i - 1];
        if (shouldIntroduceTraceBreak(aaStretch, prevResidue, residue)) {
          addNonEmptyTrace(this._cachedTraces, stretch);
          stretch = new trace.BackboneTrace();
        }
        stretch.push(residue);
      }
      addNonEmptyTrace(this._cachedTraces, stretch);
    },
    backboneTraces: function () {
      var traces = [];
      this.eachBackboneTrace(function (trace) {
        traces.push(trace);
      });
      return traces;
    }
  });
  function ChainView(molView, chain) {
    ChainBase.call(this);
    this._chain = chain;
    this._residues = [];
    this._molView = molView;
    this._residueMap = {};
    this._rnumsOrdered = true;
  }
  utils.derive(ChainView, ChainBase, {
    addResidue: function (residue, recurse) {
      var resView = new ResidueView(this, residue.full());
      this._rnumsOrdered = checkRnumsOrdered(this._residues, this._rnumsOrdered, residue);
      this._residues.push(resView);
      this._residueMap[residue.full().index()] = resView;
      if (recurse) {
        var atoms = residue.atoms();
        for (var i = 0; i < atoms.length; ++i) {
          resView.addAtom(atoms[i].full(), false);
        }
      }
      return resView;
    },
    addAtom: function (atom) {
      var resView = this._residueMap[atom.residue().full().index()];
      if (resView === undefined) {
        resView = this.addResidue(atom.residue());
      }
      return resView.addAtom(atom, true);
    },
    removeAtom: function (atom, removeEmptyResidues) {
      var resView = this._residueMap[atom.residue().full().index()];
      if (resView === undefined) {
        return false;
      }
      var removed = resView.removeAtom(atom);
      if (removed && resView.atoms().length === 0 && removeEmptyResidues) {
        delete this._residueMap[atom.residue().full().index()];
        this._residues = this._residues.filter(function (r) {
          return r !== resView;
        });
      }
      return removed;
    },
    containsResidue: function (residue) {
      var resView = this._residueMap[residue.full().index()];
      if (resView === undefined) {
        return false;
      }
      return resView.full() === residue.full();
    },
    eachBackboneTrace: function (callback) {
      var fullTraces = this._chain.backboneTraces();
      for (var i = 0; i < fullTraces.length; ++i) {
        var subsets = fullTraces[i].subsets(this._residues);
        for (var j = 0; j < subsets.length; ++j) {
          callback(subsets[j]);
        }
      }
    },
    backboneTraces: function () {
      var traces = [];
      this.eachBackboneTrace(function (trace) {
        traces.push(trace);
      });
      return traces;
    },
    full: function () {
      return this._chain;
    },
    name: function () {
      return this._chain.name();
    },
    structure: function () {
      return this._molView;
    }
  });
  return {
    Chain: Chain,
    ChainView: ChainView
  };
}(molResidue, molTrace);
molBond = function () {
  var vec3 = glMatrix.vec3;
  var Bond = function (atom_a, atom_b) {
    var self = {
      atom_one: atom_a,
      atom_two: atom_b
    };
    return {
      atom_one: function () {
        return self.atom_one;
      },
      atom_two: function () {
        return self.atom_two;
      },
      mid_point: function (out) {
        if (!out) {
          out = vec3.create();
        }
        vec3.add(out, self.atom_one.pos(), self.atom_two.pos());
        vec3.scale(out, out, 0.5);
        return out;
      }
    };
  };
  return { Bond: Bond };
}();
molSelect = function () {
  function fulfillsPredicates(obj, predicates) {
    for (var i = 0; i < predicates.length; ++i) {
      if (!predicates[i](obj)) {
        return false;
      }
    }
    return true;
  }
  function _atomPredicates(dict) {
    var predicates = [];
    if (dict.aname !== undefined) {
      predicates.push(function (a) {
        return a.name() === dict.aname;
      });
    }
    if (dict.hetatm !== undefined) {
      predicates.push(function (a) {
        return a.isHetatm() === dict.hetatm;
      });
    }
    if (dict.anames !== undefined) {
      predicates.push(function (a) {
        var n = a.name();
        for (var k = 0; k < dict.anames.length; ++k) {
          if (n === dict.anames[k]) {
            return true;
          }
        }
        return false;
      });
    }
    return predicates;
  }
  function _residuePredicates(dict) {
    var predicates = [];
    if (dict.rname !== undefined) {
      predicates.push(function (r) {
        return r.name() === dict.rname;
      });
    }
    if (dict.rnames !== undefined) {
      predicates.push(function (r) {
        var n = r.name();
        for (var k = 0; k < dict.rnames.length; ++k) {
          if (n === dict.rnames[k]) {
            return true;
          }
        }
        return false;
      });
    }
    if (dict.rnums !== undefined) {
      var num_set = {};
      for (var i = 0; i < dict.rnums.length; ++i) {
        num_set[dict.rnums[i]] = true;
      }
      predicates.push(function (r) {
        var n = r.num();
        return num_set[n] === true;
      });
    }
    if (dict.rnum !== undefined) {
      predicates.push(function (r) {
        return r.num() === dict.rnum;
      });
    }
    if (dict.rtype !== undefined) {
      predicates.push(function (r) {
        return r.ss() === dict.rtype;
      });
    }
    return predicates;
  }
  function _chainPredicates(dict) {
    var predicates = [];
    if (dict.cname !== undefined) {
      dict.chain = dict.cname;
    }
    if (dict.cnames !== undefined) {
      dict.chains = dict.cnames;
    }
    if (dict.chain !== undefined) {
      predicates.push(function (c) {
        return c.name() === dict.chain;
      });
    }
    if (dict.chains !== undefined) {
      predicates.push(function (c) {
        var n = c.name();
        for (var k = 0; k < dict.chains.length; ++k) {
          if (n === dict.chains[k]) {
            return true;
          }
        }
        return false;
      });
    }
    return predicates;
  }
  function _filterResidues(chain, dict) {
    var residues = chain.residues();
    if (dict.rnumRange) {
      residues = chain.residuesInRnumRange(dict.rnumRange[0], dict.rnumRange[1]);
    }
    var selResidues = [], i, e;
    if (dict.rindexRange !== undefined) {
      for (i = dict.rindexRange[0], e = Math.min(residues.length - 1, dict.rindexRange[1]); i <= e; ++i) {
        selResidues.push(residues[i]);
      }
      return selResidues;
    }
    if (dict.rindices) {
      if (dict.rindices.length !== undefined) {
        selResidues = [];
        for (i = 0; i < dict.rindices.length; ++i) {
          selResidues.push(residues[dict.rindices[i]]);
        }
        return selResidues;
      }
    }
    return residues;
  }
  function dictSelect(structure, view, dict) {
    var residuePredicates = _residuePredicates(dict);
    var atomPredicates = _atomPredicates(dict);
    var chainPredicates = _chainPredicates(dict);
    if (dict.rindex) {
      dict.rindices = [dict.rindex];
    }
    for (var ci = 0; ci < structure._chains.length; ++ci) {
      var chain = structure._chains[ci];
      if (!fulfillsPredicates(chain, chainPredicates)) {
        continue;
      }
      var residues = _filterResidues(chain, dict);
      var chainView = null;
      for (var ri = 0; ri < residues.length; ++ri) {
        if (!fulfillsPredicates(residues[ri], residuePredicates)) {
          continue;
        }
        if (!chainView) {
          chainView = view.addChain(chain, false);
        }
        var residueView = null;
        var atoms = residues[ri].atoms();
        for (var ai = 0; ai < atoms.length; ++ai) {
          if (!fulfillsPredicates(atoms[ai], atomPredicates)) {
            continue;
          }
          if (!residueView) {
            residueView = chainView.addResidue(residues[ri], false);
          }
          residueView.addAtom(atoms[ai]);
        }
      }
    }
    return view;
  }
  function polymerSelect(structure, view) {
    for (var ci = 0; ci < structure._chains.length; ++ci) {
      var chain = structure._chains[ci];
      var traces = chain.backboneTraces();
      if (traces.length === 0) {
        continue;
      }
      var chainView = view.addChain(chain);
      for (var bi = 0; bi < traces.length; ++bi) {
        var residues = traces[bi].residues();
        for (var ri = 0; ri < residues.length; ++ri) {
          chainView.addResidue(residues[ri], true);
        }
      }
    }
    return view;
  }
  return {
    dict: dictSelect,
    polymer: polymerSelect
  };
}();
molMol = mol = function (chain, bond, select) {
  var vec3 = glMatrix.vec3;
  var Chain = chain.Chain;
  var ChainView = chain.ChainView;
  var Bond = bond.Bond;
  var ELEMENT_COVALENT_RADII = {
    H: 0.31,
    HE: 0.28,
    LI: 1.28,
    BE: 0.96,
    B: 0.84,
    C: 0.76,
    N: 0.71,
    O: 0.66,
    F: 0.57,
    NE: 0.58,
    NA: 1.66,
    MG: 1.41,
    AL: 1.21,
    SI: 1.11,
    P: 1.07,
    S: 1.05,
    CL: 1.02,
    AR: 1.06,
    K: 2.03,
    CA: 1.76,
    SC: 1.7,
    TI: 1.6,
    V: 1.53,
    CR: 1.39,
    MN: 1.39,
    FE: 1.32,
    CO: 1.26,
    NI: 1.24,
    CU: 1.32,
    ZN: 1.22,
    GA: 1.22,
    GE: 1.2,
    AS: 1.19,
    SE: 1.2,
    BR: 1.2,
    KR: 1.16,
    RB: 2.2,
    SR: 1.95,
    Y: 1.9,
    ZR: 1.75,
    NB: 1.64,
    MO: 1.54,
    TC: 1.47,
    RU: 1.46,
    RH: 1.42,
    PD: 1.39,
    AG: 1.45,
    CD: 1.44,
    IN: 1.42,
    SN: 1.39,
    SB: 1.39,
    TE: 1.38,
    I: 1.39,
    XE: 1.4,
    CS: 2.44,
    BA: 2.15,
    LA: 2.07,
    CE: 2.04,
    PR: 2.03,
    ND: 2.01,
    PM: 1.99,
    SM: 1.98,
    EU: 1.98,
    GD: 1.96,
    TB: 1.94,
    DY: 1.92,
    HO: 1.92,
    ER: 1.89,
    TM: 1.9,
    YB: 1.87,
    LU: 1.87,
    HF: 1.75,
    TA: 1.7,
    W: 1.62,
    RE: 1.51,
    OS: 1.44,
    IR: 1.41,
    PT: 1.36,
    AU: 1.36,
    HG: 1.32,
    TL: 1.45,
    PB: 1.46,
    BI: 1.48,
    PO: 1.4,
    AT: 1.5,
    RN: 1.5,
    FR: 2.6,
    RA: 2.21,
    AC: 2.15,
    TH: 2.06,
    PA: 2,
    U: 1.96,
    NP: 1.9,
    PU: 1.87,
    AM: 1.8,
    CM: 1.69
  };
  function covalentRadius(ele) {
    var r = ELEMENT_COVALENT_RADII[ele.toUpperCase()];
    if (r !== undefined) {
      return r;
    }
    return 1.5;
  }
  function connectPeptides(structure, left, right) {
    var cAtom = left.atom('C');
    var nAtom = right.atom('N');
    if (cAtom && nAtom) {
      var sqrDist = vec3.sqrDist(cAtom.pos(), nAtom.pos());
      if (sqrDist < 1.6 * 1.6) {
        structure.connect(nAtom, cAtom);
      }
    }
  }
  function connectNucleotides(structure, left, right) {
    var o3Prime = left.atom('O3\'');
    var pAtom = right.atom('P');
    if (o3Prime && pAtom) {
      var sqrDist = vec3.sqrDist(o3Prime.pos(), pAtom.pos());
      if (sqrDist < 1.7 * 1.7) {
        structure.connect(o3Prime, pAtom);
      }
    }
  }
  function MolBase() {
  }
  MolBase.prototype = {
    eachResidue: function (callback) {
      for (var i = 0; i < this._chains.length; i += 1) {
        if (this._chains[i].eachResidue(callback) === false) {
          return false;
        }
      }
    },
    eachAtom: function (callback, index) {
      index |= 0;
      for (var i = 0; i < this._chains.length; i += 1) {
        index = this._chains[i].eachAtom(callback, index);
        if (index === false) {
          return false;
        }
      }
    },
    residueCount: function () {
      var chains = this.chains();
      var count = 0;
      for (var ci = 0; ci < chains.length; ++ci) {
        count += chains[ci].residues().length;
      }
      return count;
    },
    eachChain: function (callback) {
      var chains = this.chains();
      for (var i = 0; i < chains.length; ++i) {
        if (callback(chains[i]) === false) {
          return;
        }
      }
    },
    atomCount: function () {
      var chains = this.chains();
      var count = 0;
      for (var ci = 0; ci < chains.length; ++ci) {
        count += chains[ci].atomCount();
      }
      return count;
    },
    atoms: function () {
      var atoms = [];
      this.eachAtom(function (atom) {
        atoms.push(atom);
      });
      return atoms;
    },
    atom: function (name) {
      var parts = name.split('.');
      var chain = this.chain(parts[0]);
      if (chain === null) {
        return null;
      }
      var residue = chain.residueByRnum(parseInt(parts[1], 10));
      if (residue === null) {
        return null;
      }
      return residue.atom(parts[2]);
    },
    center: function () {
      var sum = vec3.create();
      var count = 0;
      this.eachAtom(function (atom) {
        vec3.add(sum, sum, atom.pos());
        count += 1;
      });
      if (count) {
        vec3.scale(sum, sum, 1 / count);
      }
      return sum;
    },
    boundingSphere: function () {
      var center = this.center();
      var radiusSquare = 0;
      this.eachAtom(function (atom) {
        radiusSquare = Math.max(radiusSquare, vec3.sqrDist(center, atom.pos()));
      });
      return new geom.Sphere(center, Math.sqrt(radiusSquare));
    },
    backboneTraces: function () {
      var chains = this.chains();
      var traces = [];
      for (var i = 0; i < chains.length; ++i) {
        Array.prototype.push.apply(traces, chains[i].backboneTraces());
      }
      return traces;
    },
    select: function (what) {
      if (what === 'protein') {
        return this.residueSelect(function (r) {
          return r.isAminoacid();
        });
      }
      if (what === 'water') {
        return this.residueSelect(function (r) {
          return r.isWater();
        });
      }
      if (what === 'ligand') {
        return this.residueSelect(function (r) {
          return !r.isAminoacid() && !r.isWater();
        });
      }
      if (what === 'polymer') {
        return select.polymer(this, new MolView(this));
      }
      return select.dict(this, new MolView(this), what || {});
    },
    residueSelect: function (predicate) {
      console.time('Mol.residueSelect');
      var view = new MolView(this.full());
      for (var ci = 0; ci < this._chains.length; ++ci) {
        var chain = this._chains[ci];
        var chainView = null;
        var residues = chain.residues();
        for (var ri = 0; ri < residues.length; ++ri) {
          if (predicate(residues[ri])) {
            if (!chainView) {
              chainView = view.addChain(chain, false);
            }
            chainView.addResidue(residues[ri], true);
          }
        }
      }
      console.timeEnd('Mol.residueSelect');
      return view;
    },
    atomSelect: function (predicate) {
      console.time('Mol.atomSelect');
      var view = new MolView(this.full());
      for (var ci = 0; ci < this._chains.length; ++ci) {
        var chain = this._chains[ci];
        var chainView = null;
        var residues = chain.residues();
        for (var ri = 0; ri < residues.length; ++ri) {
          var residueView = null;
          var residue = residues[ri];
          var atoms = residue.atoms();
          for (var ai = 0; ai < atoms.length; ++ai) {
            if (!predicate(atoms[ai])) {
              continue;
            }
            if (!chainView) {
              chainView = view.addChain(chain, false);
            }
            if (!residueView) {
              residueView = chainView.addResidue(residue, false);
            }
            residueView.addAtom(atoms[ai]);
          }
        }
      }
      console.timeEnd('Mol.atomSelect');
      return view;
    },
    assembly: function (id) {
      var assemblies = this.assemblies();
      for (var i = 0; i < assemblies.length; ++i) {
        if (assemblies[i].name() === id) {
          return assemblies[i];
        }
      }
      return null;
    },
    chainsByName: function (chainNames) {
      var chainMap = {};
      var chains = this.chains();
      for (var i = 0; i < chains.length; ++i) {
        chainMap[chains[i].name()] = chains[i];
      }
      var filteredChains = [];
      for (var j = 0; j < chainNames.length; ++j) {
        var filteredChain = chainMap[chainNames[j]];
        if (filteredChain !== undefined) {
          filteredChains.push(filteredChain);
        }
      }
      return filteredChains;
    },
    selectWithin: function () {
      var dist = vec3.create();
      return function (mol, options) {
        console.time('Mol.selectWithin');
        options = options || {};
        var radius = options.radius || 4;
        var radiusSqr = radius * radius;
        var matchResidues = !!options.matchResidues;
        var targetAtoms = [];
        mol.eachAtom(function (a) {
          targetAtoms.push(a);
        });
        var view = new MolView(this.full());
        var addedRes = null, addedChain = null;
        var chains = this.chains();
        var skipResidue = false;
        for (var ci = 0; ci < chains.length; ++ci) {
          var residues = chains[ci].residues();
          addedChain = null;
          for (var ri = 0; ri < residues.length; ++ri) {
            addedRes = null;
            skipResidue = false;
            var atoms = residues[ri].atoms();
            for (var ai = 0; ai < atoms.length; ++ai) {
              if (skipResidue) {
                break;
              }
              for (var wi = 0; wi < targetAtoms.length; ++wi) {
                vec3.sub(dist, atoms[ai].pos(), targetAtoms[wi].pos());
                if (vec3.sqrLen(dist) > radiusSqr) {
                  continue;
                }
                if (!addedChain) {
                  addedChain = view.addChain(chains[ci].full(), false);
                }
                if (!addedRes) {
                  addedRes = addedChain.addResidue(residues[ri].full(), matchResidues);
                }
                if (matchResidues) {
                  skipResidue = true;
                  break;
                }
                addedRes.addAtom(atoms[ai].full());
                break;
              }
            }
          }
        }
        console.timeEnd('Mol.selectWithin');
        return view;
      };
    }(),
    createEmptyView: function () {
      return new MolView(this.full());
    }
  };
  function Mol() {
    MolBase.call(this);
    this._chains = [];
    this._assemblies = [];
    this._nextAtomIndex = 0;
  }
  utils.derive(Mol, MolBase, {
    addAssembly: function (assembly) {
      this._assemblies.push(assembly);
    },
    setAssemblies: function (assemblies) {
      this._assemblies = assemblies;
    },
    assemblies: function () {
      return this._assemblies;
    },
    chains: function () {
      return this._chains;
    },
    full: function () {
      return this;
    },
    containsResidue: function (residue) {
      return residue.full().structure() === this;
    },
    chainByName: function (name) {
      for (var i = 0; i < this._chains.length; ++i) {
        if (this._chains[i].name() === name) {
          return this._chains[i];
        }
      }
      return null;
    },
    chain: function (name) {
      return this.chainByName(name);
    },
    nextAtomIndex: function () {
      var nextIndex = this._nextAtomIndex;
      this._nextAtomIndex += 1;
      return nextIndex;
    },
    addChain: function (name) {
      var chain = new Chain(this, name);
      this._chains.push(chain);
      return chain;
    },
    connect: function (atom_a, atom_b) {
      var bond = new Bond(atom_a, atom_b);
      atom_a.addBond(bond);
      atom_b.addBond(bond);
      return bond;
    },
    deriveConnectivity: function () {
      console.time('Mol.deriveConnectivity');
      var thisStructure = this;
      var prevResidue = null;
      this.eachResidue(function (res) {
        var sqrDist;
        var atoms = res.atoms();
        var numAtoms = atoms.length;
        for (var i = 0; i < numAtoms; i += 1) {
          var atomI = atoms[i];
          var posI = atomI.pos();
          var covalentI = covalentRadius(atomI.element());
          for (var j = 0; j < i; j += 1) {
            var atomJ = atoms[j];
            var covalentJ = covalentRadius(atomJ.element());
            sqrDist = vec3.sqrDist(posI, atomJ.pos());
            var lower = covalentI + covalentJ - 0.3;
            var upper = covalentI + covalentJ + 0.3;
            if (sqrDist < upper * upper && sqrDist > lower * lower) {
              thisStructure.connect(atomI, atomJ);
            }
          }
        }
        res._deduceType();
        if (prevResidue !== null) {
          if (res.isAminoacid() && prevResidue.isAminoacid()) {
            connectPeptides(thisStructure, prevResidue, res);
          }
          if (res.isNucleotide() && prevResidue.isNucleotide()) {
            connectNucleotides(thisStructure, prevResidue, res);
          }
        }
        prevResidue = res;
      });
      console.timeEnd('Mol.deriveConnectivity');
    }
  });
  function MolView(mol) {
    MolBase.call(this);
    this._mol = mol;
    this._chains = [];
  }
  utils.derive(MolView, MolBase, {
    full: function () {
      return this._mol;
    },
    assemblies: function () {
      return this._mol.assemblies();
    },
    addChain: function (chain, recurse) {
      var chainView = new ChainView(this, chain.full());
      this._chains.push(chainView);
      if (recurse) {
        var residues = chain.residues();
        for (var i = 0; i < residues.length; ++i) {
          chainView.addResidue(residues[i], true);
        }
      }
      return chainView;
    },
    addAtom: function (atom) {
      var chain = this.chain(atom.residue().chain().name());
      if (chain === null) {
        chain = this.addChain(atom.residue().chain());
      }
      return chain.addAtom(atom);
    },
    removeAtom: function (atom, removeEmptyResiduesAndChains) {
      if (atom === null) {
        return false;
      }
      var chain = this.chain(atom.residue().chain().name());
      if (chain === null) {
        return false;
      }
      var removed = chain.removeAtom(atom, removeEmptyResiduesAndChains);
      if (removed && chain.residues().length === 0) {
        this._chains = this._chains.filter(function (c) {
          return c !== chain;
        });
      }
      return removed;
    },
    containsResidue: function (residue) {
      if (!residue) {
        return false;
      }
      var chain = this.chain(residue.chain().name());
      if (!chain) {
        return false;
      }
      return chain.containsResidue(residue);
    },
    addResidues: function (residues, recurse) {
      var that = this;
      var chainsViews = {};
      residues.forEach(function (residue) {
        var chainName = residue.chain().name();
        if (typeof chainsViews[chainName] === 'undefined') {
          chainsViews[chainName] = that.addChain(residue.chain(), false);
        }
        chainsViews[chainName].addResidue(residue, recurse);
      });
      return chainsViews;
    },
    chains: function () {
      return this._chains;
    },
    chain: function (name) {
      for (var i = 0; i < this._chains.length; ++i) {
        if (this._chains[i].name() === name) {
          return this._chains[i];
        }
      }
      return null;
    }
  });
  return {
    MolView: MolView,
    Mol: Mol
  };
}(molChain, molBond, molSelect);
svd = function () {
  function svd(A) {
    var temp;
    var prec = Math.pow(2, -52);
    var tolerance = 1e-64 / prec;
    var itmax = 50;
    var c = 0;
    var i = 0;
    var j = 0;
    var k = 0;
    var l = 0;
    var u = A;
    var m = u.length;
    var n = u[0].length;
    if (m < n)
      throw 'Need more rows than columns';
    var e = new Array(n);
    var q = new Array(n);
    for (i = 0; i < n; i++)
      e[i] = q[i] = 0;
    var v = [];
    for (var i = 0; i < n; ++i) {
      var xxx = [];
      v.push([]);
      for (var j = 0; j < n; ++j) {
        xxx.push(0);
      }
      v.push(xxx);
    }
    function pythag(a, b) {
      a = Math.abs(a);
      b = Math.abs(b);
      if (a > b)
        return a * Math.sqrt(1 + b * b / a / a);
      else if (b == 0)
        return a;
      return b * Math.sqrt(1 + a * a / b / b);
    }
    var f = 0;
    var g = 0;
    var h = 0;
    var x = 0;
    var y = 0;
    var z = 0;
    var s = 0;
    for (i = 0; i < n; i++) {
      e[i] = g;
      s = 0;
      l = i + 1;
      for (j = i; j < m; j++)
        s += u[j][i] * u[j][i];
      if (s <= tolerance)
        g = 0;
      else {
        f = u[i][i];
        g = Math.sqrt(s);
        if (f >= 0)
          g = -g;
        h = f * g - s;
        u[i][i] = f - g;
        for (j = l; j < n; j++) {
          s = 0;
          for (k = i; k < m; k++)
            s += u[k][i] * u[k][j];
          f = s / h;
          for (k = i; k < m; k++)
            u[k][j] += f * u[k][i];
        }
      }
      q[i] = g;
      s = 0;
      for (j = l; j < n; j++)
        s = s + u[i][j] * u[i][j];
      if (s <= tolerance)
        g = 0;
      else {
        f = u[i][i + 1];
        g = Math.sqrt(s);
        if (f >= 0)
          g = -g;
        h = f * g - s;
        u[i][i + 1] = f - g;
        for (j = l; j < n; j++)
          e[j] = u[i][j] / h;
        for (j = l; j < m; j++) {
          s = 0;
          for (k = l; k < n; k++)
            s += u[j][k] * u[i][k];
          for (k = l; k < n; k++)
            u[j][k] += s * e[k];
        }
      }
      y = Math.abs(q[i]) + Math.abs(e[i]);
      if (y > x)
        x = y;
    }
    for (i = n - 1; i != -1; i += -1) {
      if (g != 0) {
        h = g * u[i][i + 1];
        for (j = l; j < n; j++)
          v[j][i] = u[i][j] / h;
        for (j = l; j < n; j++) {
          s = 0;
          for (k = l; k < n; k++)
            s += u[i][k] * v[k][j];
          for (k = l; k < n; k++)
            v[k][j] += s * v[k][i];
        }
      }
      for (j = l; j < n; j++) {
        v[i][j] = 0;
        v[j][i] = 0;
      }
      v[i][i] = 1;
      g = e[i];
      l = i;
    }
    for (i = n - 1; i != -1; i += -1) {
      l = i + 1;
      g = q[i];
      for (j = l; j < n; j++)
        u[i][j] = 0;
      if (g != 0) {
        h = u[i][i] * g;
        for (j = l; j < n; j++) {
          s = 0;
          for (k = l; k < m; k++)
            s += u[k][i] * u[k][j];
          f = s / h;
          for (k = i; k < m; k++)
            u[k][j] += f * u[k][i];
        }
        for (j = i; j < m; j++)
          u[j][i] = u[j][i] / g;
      } else
        for (j = i; j < m; j++)
          u[j][i] = 0;
      u[i][i] += 1;
    }
    prec = prec * x;
    for (k = n - 1; k != -1; k += -1) {
      for (var iteration = 0; iteration < itmax; iteration++) {
        var test_convergence = false;
        for (l = k; l != -1; l += -1) {
          if (Math.abs(e[l]) <= prec) {
            test_convergence = true;
            break;
          }
          if (Math.abs(q[l - 1]) <= prec)
            break;
        }
        if (!test_convergence) {
          c = 0;
          s = 1;
          var l1 = l - 1;
          for (i = l; i < k + 1; i++) {
            f = s * e[i];
            e[i] = c * e[i];
            if (Math.abs(f) <= prec)
              break;
            g = q[i];
            h = pythag(f, g);
            q[i] = h;
            c = g / h;
            s = -f / h;
            for (j = 0; j < m; j++) {
              y = u[j][l1];
              z = u[j][i];
              u[j][l1] = y * c + z * s;
              u[j][i] = -y * s + z * c;
            }
          }
        }
        z = q[k];
        if (l == k) {
          if (z < 0) {
            q[k] = -z;
            for (j = 0; j < n; j++)
              v[j][k] = -v[j][k];
          }
          break;
        }
        if (iteration >= itmax - 1)
          throw 'Error: no convergence.';
        x = q[l];
        y = q[k - 1];
        g = e[k - 1];
        h = e[k];
        f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
        g = pythag(f, 1);
        if (f < 0)
          f = ((x - z) * (x + z) + h * (y / (f - g) - h)) / x;
        else
          f = ((x - z) * (x + z) + h * (y / (f + g) - h)) / x;
        c = 1;
        s = 1;
        for (i = l + 1; i < k + 1; i++) {
          g = e[i];
          y = q[i];
          h = s * g;
          g = c * g;
          z = pythag(f, h);
          e[i - 1] = z;
          c = f / z;
          s = h / z;
          f = x * c + g * s;
          g = -x * s + g * c;
          h = y * s;
          y = y * c;
          for (j = 0; j < n; j++) {
            x = v[j][i - 1];
            z = v[j][i];
            v[j][i - 1] = x * c + z * s;
            v[j][i] = -x * s + z * c;
          }
          z = pythag(f, h);
          q[i - 1] = z;
          c = f / z;
          s = h / z;
          f = c * g + s * y;
          x = -s * g + c * y;
          for (j = 0; j < m; j++) {
            y = u[j][i - 1];
            z = u[j][i];
            u[j][i - 1] = y * c + z * s;
            u[j][i] = -y * s + z * c;
          }
        }
        e[l] = 0;
        e[k] = f;
        q[k] = x;
      }
    }
    for (i = 0; i < q.length; i++)
      if (q[i] < prec)
        q[i] = 0;
    for (i = 0; i < n; i++) {
      for (j = i - 1; j >= 0; j--) {
        if (q[j] < q[i]) {
          c = q[j];
          q[j] = q[i];
          q[i] = c;
          for (k = 0; k < u.length; k++) {
            temp = u[k][i];
            u[k][i] = u[k][j];
            u[k][j] = temp;
          }
          for (k = 0; k < v.length; k++) {
            temp = v[k][i];
            v[k][i] = v[k][j];
            v[k][j] = temp;
          }
          i = j;
        }
      }
    }
    return {
      U: u,
      S: q,
      V: v
    };
  }
  return svd;
}();
molSuperpose = function () {
  var vec3 = glMatrix.vec3;
  var mat3 = glMatrix.mat3;
  var quat = glMatrix.quat;
  var calculateCenter = function (atoms, center) {
    vec3.set(center, 0, 0, 0);
    if (atoms.length === 0) {
      return;
    }
    for (var i = 0; i < atoms.length; ++i) {
      var atom = atoms[i];
      vec3.add(center, center, atom.pos());
    }
    vec3.scale(center, center, 1 / atoms.length);
  };
  var calculateCov = function () {
    var shiftedSubject = vec3.create();
    var shiftedReference = vec3.create();
    return function (subjectAtoms, referenceAtoms, subjectCenter, referenceCenter, covariance) {
      covariance[0] = 0;
      covariance[1] = 0;
      covariance[2] = 0;
      covariance[3] = 0;
      covariance[4] = 0;
      covariance[5] = 0;
      covariance[6] = 0;
      covariance[7] = 0;
      covariance[8] = 0;
      for (var i = 0; i < referenceAtoms.length; ++i) {
        vec3.sub(shiftedSubject, subjectAtoms[i].pos(), subjectCenter);
        vec3.sub(shiftedReference, referenceAtoms[i].pos(), referenceCenter);
        var ss = shiftedSubject;
        var sr = shiftedReference;
        covariance[0] += ss[0] * sr[0];
        covariance[1] += ss[0] * sr[1];
        covariance[2] += ss[0] * sr[2];
        covariance[3] += ss[1] * sr[0];
        covariance[4] += ss[1] * sr[1];
        covariance[5] += ss[1] * sr[2];
        covariance[6] += ss[2] * sr[0];
        covariance[7] += ss[2] * sr[1];
        covariance[8] += ss[2] * sr[2];
      }
    };
  }();
  var superpose = function () {
    var referenceCenter = vec3.create();
    var subjectCenter = vec3.create();
    var shiftedPos = vec3.create();
    var rotation = mat3.create();
    var cov = mat3.create();
    var tmp = mat3.create();
    var uMat = mat3.create();
    var vMat = mat3.create();
    return function (structure, reference) {
      var subjectAtoms = structure.atoms();
      var referenceAtoms = reference.atoms();
      calculateCenter(referenceAtoms, referenceCenter);
      calculateCenter(subjectAtoms, subjectCenter);
      if (subjectAtoms.length !== referenceAtoms.length) {
        console.error('atom counts do not match (' + subjectAtoms.length + 'in structure vs ' + referenceAtoms.length + ' in reference)');
        return false;
      }
      if (subjectAtoms.length < 3) {
        console.error('at least 3 atoms are required for superposition');
        return false;
      }
      calculateCov(subjectAtoms, referenceAtoms, subjectCenter, referenceCenter, cov);
      var input = [
        [
          cov[0],
          cov[1],
          cov[2]
        ],
        [
          cov[3],
          cov[4],
          cov[5]
        ],
        [
          cov[6],
          cov[7],
          cov[8]
        ]
      ];
      var u = [
        [],
        [],
        []
      ];
      var v = [
        [],
        [],
        []
      ];
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
      if (detU * detV < 0) {
        console.log('determinants smaller than zero!');
        tmp[8] = -1;
        mat3.mul(uMat, uMat, tmp);
      }
      console.log(mat3.str(uMat));
      mat3.mul(rotation, mat3.transpose(vMat, vMat), uMat);
      var allAtoms = structure.full().atoms();
      for (var i = 0; i < allAtoms.length; ++i) {
        var atom = allAtoms[i];
        vec3.sub(shiftedPos, atom.pos(), subjectCenter);
        vec3.transformMat3(shiftedPos, shiftedPos, rotation);
        vec3.add(shiftedPos, referenceCenter, shiftedPos);
        atom.setPos(shiftedPos);
      }
      return true;
    };
  }();
  function parseAtomNames(atoms) {
    if (atoms === undefined || atoms === null || atoms === 'all') {
      return null;
    }
    if (atoms === 'backbone') {
      return {
        'CA': true,
        'C': true,
        'O': true,
        'N': true
      };
    }
    if (atoms.substr !== undefined) {
      var results = {};
      var atomNames = atoms.split(',');
      for (var i = 0; i < atomNames.length; ++i) {
        results[atomNames[i].trim()] = true;
      }
      return results;
    } else {
      var results = {};
      for (var i = 0; i < atoms.length; ++i) {
        results[atoms[i]] = true;
      }
      return results;
    }
  }
  function addAtomsPresentInBoth(inA, inB, outA, outB, atomSet) {
    var atomsA = inA.atoms();
    var atomsB = inB.atoms();
    for (var i = 0; i < atomsA.length; ++i) {
      var atomA = atomsA[i];
      if (atomSet !== null && atomSet[atomA.name()] !== true) {
        continue;
      }
      for (var j = 0; j < atomsB.length; ++j) {
        var atomB = atomsB[j];
        if (atomB.name() === atomA.name()) {
          outA.push(atomA);
          outB.push(atomB);
          break;
        }
      }
    }
  }
  function matchResidues(inA, inB, atoms, matchFn) {
    var outA = inA.full().createEmptyView();
    var outB = inB.full().createEmptyView();
    var numChains = Math.min(inA.chains().length, inB.chains().length);
    var atomSet = parseAtomNames(atoms);
    for (var i = 0; i < numChains; ++i) {
      var chainA = inA.chains()[i];
      var chainB = inB.chains()[i];
      var matchedResidues = matchFn(chainA, chainB);
      var residuesA = matchedResidues[0];
      var residuesB = matchedResidues[1];
      if (residuesA.length !== residuesB.length) {
        console.error('chains', chainA.name(), ' and', chainB.name(), ' do not contain the same number of residues.');
        return null;
      }
      var outChainA = outA.addChain(chainA);
      var outChainB = outB.addChain(chainB);
      for (var j = 0; j < residuesA.length; ++j) {
        var residueA = residuesA[j];
        var residueB = residuesB[j];
        var outAtomsA = [], outAtomsB = [];
        addAtomsPresentInBoth(residueA, residueB, outAtomsA, outAtomsB, atomSet);
        if (outAtomsA.length === 0) {
          continue;
        }
        var outResidueA = outChainA.addResidue(residueA);
        var outResidueB = outChainB.addResidue(residueB);
        for (var k = 0; k < outAtomsA.length; ++k) {
          outResidueA.addAtom(outAtomsA[k]);
          outResidueB.addAtom(outAtomsB[k]);
        }
      }
    }
    return [
      outA,
      outB
    ];
  }
  function matchResiduesByIndex(inA, inB, atoms) {
    return matchResidues(inA, inB, atoms, function (chainA, chainB) {
      return [
        chainA.residues(),
        chainB.residues()
      ];
    });
  }
  function matchResiduesByNum(inA, inB, atoms) {
    return matchResidues(inA, inB, atoms, function (chainA, chainB) {
      var outA = [], outB = [];
      var inA = chainA.residues();
      for (var i = 0; i < inA.length; ++i) {
        var resB = chainB.residueByRnum(inA[i].num());
        if (resB !== null) {
          outA.push(inA[i]);
          outB.push(resB);
        }
      }
      return [
        outA,
        outB
      ];
    });
  }
  return {
    superpose: superpose,
    matchResiduesByNum: matchResiduesByNum,
    matchResiduesByIndex: matchResiduesByIndex,
    parseAtomNames: parseAtomNames,
    addAtomsPresentInBoth: addAtomsPresentInBoth
  };
}();
molAll = mol = function (sp) {
  var vec3 = glMatrix.vec3;
  var zhangSkolnickSS = function () {
    var posOne = vec3.create();
    var posTwo = vec3.create();
    return function (trace, i, distances, delta) {
      for (var j = Math.max(0, i - 2); j <= i; ++j) {
        for (var k = 2; k < 5; ++k) {
          if (j + k >= trace.length()) {
            continue;
          }
          var d = vec3.dist(trace.posAt(posOne, j), trace.posAt(posTwo, j + k));
          if (Math.abs(d - distances[k - 2]) > delta) {
            return false;
          }
        }
      }
      return true;
    };
  }();
  var isHelical = function (trace, i) {
    var helixDistances = [
      5.45,
      5.18,
      6.37
    ];
    var helixDelta = 2.1;
    return zhangSkolnickSS(trace, i, helixDistances, helixDelta);
  };
  var isSheet = function (trace, i) {
    var sheetDistances = [
      6.1,
      10.4,
      13
    ];
    var sheetDelta = 1.42;
    return zhangSkolnickSS(trace, i, sheetDistances, sheetDelta);
  };
  function traceAssignHelixSheet(trace) {
    for (var i = 0; i < trace.length(); ++i) {
      if (isHelical(trace, i)) {
        trace.residueAt(i).setSS('H');
        continue;
      }
      if (isSheet(trace, i)) {
        trace.residueAt(i).setSS('E');
        continue;
      }
      trace.residueAt(i).setSS('C');
    }
  }
  function assignHelixSheet(structure) {
    console.time('mol.assignHelixSheet');
    var chains = structure.chains();
    for (var ci = 0; ci < chains.length; ++ci) {
      var chain = chains[ci];
      chain.eachBackboneTrace(traceAssignHelixSheet);
    }
    console.timeEnd('mol.assignHelixSheet');
  }
  return {
    Mol: mol.Mol,
    MolView: mol.MolView,
    assignHelixSheet: assignHelixSheet,
    superpose: sp.superpose,
    matchResiduesByIndex: sp.matchResiduesByIndex,
    matchResiduesByNum: sp.matchResiduesByNum
  };
}(molSuperpose);
io = function (symmetry) {
  var vec3 = glMatrix.vec3;
  var mat4 = glMatrix.mat4;
  function Remark350Reader() {
    this._assemblies = {};
    this._current = null;
  }
  Remark350Reader.prototype = {
    assemblies: function () {
      var assemblies = [];
      for (var c in this._assemblies) {
        if (this._assemblies.hasOwnProperty(c)) {
          assemblies.push(this._assemblies[c]);
        }
      }
      return assemblies;
    },
    assembly: function (id) {
      return this._assemblies[id];
    },
    nextLine: function (line) {
      line = line.substr(11);
      if (line[0] === 'B' && line.substr(0, 12) === 'BIOMOLECULE:') {
        var name = line.substr(13).trim();
        this._currentAssembly = new symmetry.Assembly(name);
        this._assemblies[name] = this._currentAssembly;
        return;
      }
      if (line.substr(0, 30) === 'APPLY THE FOLLOWING TO CHAINS:' || line.substr(0, 30) === '                   AND CHAINS:') {
        var chains = line.substr(30).split(',');
        if (line[0] === 'A') {
          this._currentSymGen = new symmetry.SymGenerator();
          this._currentAssembly.addGenerator(this._currentSymGen);
        }
        this._currentMatrix = mat4.create();
        for (var i = 0; i < chains.length; ++i) {
          var trimmedChainName = chains[i].trim();
          if (trimmedChainName.length) {
            this._currentSymGen.addChain(trimmedChainName);
          }
        }
        return;
      }
      if (line.substr(0, 7) === '  BIOMT') {
        var col = parseInt(line[7], 10) - 1;
        var offset = 0;
        while (line[12 + offset] !== ' ') {
          offset += 1;
        }
        var x = parseFloat(line.substr(13 + offset, 9));
        var y = parseFloat(line.substr(23 + offset, 9));
        var z = parseFloat(line.substr(33 + offset, 9));
        var w = parseFloat(line.substr(43 + offset, 14));
        this._currentMatrix[4 * 0 + col] = x;
        this._currentMatrix[4 * 1 + col] = y;
        this._currentMatrix[4 * 2 + col] = z;
        this._currentMatrix[4 * 3 + col] = w;
        if (col === 2) {
          this._currentSymGen.addMatrix(this._currentMatrix);
          this._currentMatrix = mat4.create();
        }
        return;
      }
    }
  };
  function guessAtomElementFromName(fourLetterName) {
    if (fourLetterName[0] !== ' ') {
      var trimmed = fourLetterName.trim();
      if (trimmed.length === 4) {
        var i = 0;
        var charCode = trimmed.charCodeAt(i);
        while (i < 4 && (charCode < 65 || charCode > 122 || charCode > 90 && charCode < 97)) {
          ++i;
          charCode = trimmed.charCodeAt(i);
        }
        return trimmed[i];
      }
      var firstCharCode = trimmed.charCodeAt(0);
      if (firstCharCode >= 48 && firstCharCode <= 57) {
        return trimmed[1];
      }
      return trimmed.substr(0, 2);
    }
    return fourLetterName[1];
  }
  function PDBReader(options) {
    this._helices = [];
    this._sheets = [];
    this._conect = [];
    this._serialToAtomMap = {};
    this._rosettaMode = false;
    this._structure = new mol.Mol();
    this._remark350Reader = new Remark350Reader();
    this._currChain = null;
    this._currRes = null;
    this._currAtom = null;
    this._options = {};
    this._options.conectRecords = !!options.conectRecords;
  }
  PDBReader.prototype = {
    CONTINUE: 1,
    MODEL_COMPLETE: 2,
    FILE_END: 3,
    ERROR: 4,
    parseHelixRecord: function (line) {
      var frstNum = parseInt(line.substr(21, 4), 10);
      var frstInsCode = line[25] === ' ' ? '\0' : line[25];
      var lastNum = parseInt(line.substr(33, 4), 10);
      var lastInsCode = line[37] === ' ' ? '\0' : line[37];
      var chainName = line[19];
      this._helices.push({
        first: [
          frstNum,
          frstInsCode
        ],
        last: [
          lastNum,
          lastInsCode
        ],
        chainName: chainName
      });
      return true;
    },
    parseRosettaAnnotation: function (line) {
      if (line.length < 5) {
        return this.CONTINUE;
      }
      var ss = line[5];
      var resNum = parseInt(line.substr(0, 5).trim(), 10);
      if (isNaN(resNum)) {
        console.error('could not parse residue number');
        return this.ERROR;
      }
      var secStructure = 'C';
      if (ss === 'H' || ss === 'E') {
        secStructure = ss;
      }
      if (this._structure.chains().length !== 1) {
        console.warn('multiple chains are present. arbitrarily', 'assigning secondary structure to the last chain.');
      }
      var res = this._currChain.residueByRnum(resNum);
      if (res === null) {
        console.warn('could not find residue', resNum, 'in last chain.', 'Skipping ROSETTA secondary structure annotation');
        return this.CONTINUE;
      }
      res.setSS(secStructure);
      return this.CONTINUE;
    },
    parseSheetRecord: function (line) {
      var frstNum = parseInt(line.substr(22, 4), 10);
      var frstInsCode = line[26] === ' ' ? '\0' : line[26];
      var lastNum = parseInt(line.substr(33, 4), 10);
      var lastInsCode = line[37] === ' ' ? '\0' : line[37];
      var chainName = line[21];
      this._sheets.push({
        first: [
          frstNum,
          frstInsCode
        ],
        last: [
          lastNum,
          lastInsCode
        ],
        chainName: chainName
      });
      return true;
    },
    parseAndAddAtom: function (line) {
      var alt_loc = line[16];
      if (alt_loc !== ' ' && alt_loc !== 'A') {
        return true;
      }
      var isHetatm = line[0] === 'H';
      var chainName = line[21];
      var resName = line.substr(17, 3).trim();
      var fullAtomName = line.substr(12, 4);
      var atomName = fullAtomName.trim();
      var rnumNum = parseInt(line.substr(22, 4), 10);
      if (rnumNum !== rnumNum) {
        rnumNum = 1;
      }
      var insCode = line[26] === ' ' ? '\0' : line[26];
      var updateResidue = false;
      var updateChain = false;
      if (!this._currChain || this._currChain.name() !== chainName) {
        updateChain = true;
        updateResidue = true;
      }
      if (!this._currRes || this._currRes.num() !== rnumNum || this._currRes.insCode() !== insCode) {
        updateResidue = true;
      }
      if (updateChain) {
        this._currChain = this._structure.chain(chainName) || this._structure.addChain(chainName);
      }
      if (updateResidue) {
        this._currRes = this._currChain.addResidue(resName, rnumNum, insCode);
      }
      var pos = vec3.create();
      for (var i = 0; i < 3; ++i) {
        pos[i] = parseFloat(line.substr(30 + i * 8, 8));
      }
      var element = line.substr(76, 2).trim();
      if (element === '') {
        element = guessAtomElementFromName(fullAtomName);
      }
      var occupancy = parseFloat(line.substr(54, 6).trim());
      var tempFactor = parseFloat(line.substr(60, 6).trim());
      var serial = parseInt(line.substr(6, 5).trim(), 10);
      var atom = this._currRes.addAtom(atomName, pos, element, isHetatm, isNaN(occupancy) ? null : occupancy, isNaN(tempFactor) ? null : tempFactor, serial);
      if (this._options.conectRecords) {
        this._serialToAtomMap[serial] = atom;
      }
      return true;
    },
    parseConectRecord: function (line) {
      var atomSerial = parseInt(line.substr(6, 5).trim(), 10);
      var bondPartnerIds = [];
      for (var i = 0; i < 4; ++i) {
        var partnerId = parseInt(line.substr(11 + i * 5, 6).trim(), 10);
        if (isNaN(partnerId)) {
          continue;
        }
        if (partnerId > atomSerial) {
          continue;
        }
        bondPartnerIds.push(partnerId);
      }
      this._conect.push({
        from: atomSerial,
        to: bondPartnerIds
      });
      return true;
    },
    processLine: function (line) {
      var recordName = line.substr(0, 6);
      if (recordName === 'ATOM  ' || recordName === 'HETATM') {
        return this.parseAndAddAtom(line) ? this.CONTINUE : this.ERROR;
      }
      if (recordName === 'REMARK') {
        var remarkNumber = line.substr(7, 3);
        if (remarkNumber === '350') {
          this._remark350Reader.nextLine(line);
        }
        return this.CONTINUE;
      }
      if (recordName === 'HELIX ') {
        return this.parseHelixRecord(line) ? this.CONTINUE : this.ERROR;
      }
      if (recordName === 'SHEET ') {
        return this.parseSheetRecord(line) ? this.CONTINUE : this.ERROR;
      }
      if (this._options.conectRecords && recordName === 'CONECT') {
        return this.parseConectRecord(line) ? this.CONTINUE : this.ERROR;
      }
      if (recordName === 'END   ') {
        return this.FILE_END;
      }
      if (recordName === 'ENDMDL') {
        return this.MODEL_COMPLETE;
      }
      if (line.substr(0, 9) === 'complete:') {
        this._rosettaMode = true;
        return this.CONTINUE;
      }
      if (this._rosettaMode) {
        if (line.trim().length === 0) {
          this._rosettaMode = false;
          return this.CONTINUE;
        }
        return this.parseRosettaAnnotation(line);
      }
      return this.CONTINUE;
    },
    finish: function () {
      if (this._currChain === null) {
        return null;
      }
      var chain = null;
      var i;
      for (i = 0; i < this._sheets.length; ++i) {
        var sheet = this._sheets[i];
        chain = this._structure.chain(sheet.chainName);
        if (chain) {
          chain.assignSS(sheet.first, sheet.last, 'E');
        }
      }
      for (i = 0; i < this._helices.length; ++i) {
        var helix = this._helices[i];
        chain = this._structure.chain(helix.chainName);
        if (chain) {
          chain.assignSS(helix.first, helix.last, 'H');
        }
      }
      this._structure.setAssemblies(this._remark350Reader.assemblies());
      if (this._options.conectRecords) {
        this._assignBondsFromConectRecords(this._structure);
      }
      this._structure.deriveConnectivity();
      console.log('imported', this._structure.chains().length, 'chain(s),', this._structure.residueCount(), 'residue(s)');
      var result = this._structure;
      this._structure = new mol.Mol();
      this._currChain = null;
      this._currRes = null;
      this._currAtom = null;
      this._rosettaMode = false;
      return result;
    },
    _assignBondsFromConectRecords: function (structure) {
      for (var i = 0; i < this._conect.length; ++i) {
        var record = this._conect[i];
        var fromAtom = this._serialToAtomMap[record.from];
        for (var j = 0; j < record.to.length; ++j) {
          var toAtom = this._serialToAtomMap[record.to[j]];
          structure.connect(fromAtom, toAtom);
        }
      }
    }
  };
  function getLines(data) {
    return data.split(/\r\n|\r|\n/g);
  }
  function pdb(text, options) {
    console.time('pdb');
    var opts = options || {};
    var lines = getLines(text);
    var reader = new PDBReader(opts);
    var structures = [];
    for (var i = 0; i < lines.length; i++) {
      var result = reader.processLine(lines[i]);
      if (result === reader.ERROR) {
        console.timeEnd('pdb');
        return null;
      }
      if (result === reader.CONTINUE) {
        continue;
      }
      var struct = reader.finish();
      if (struct !== null) {
        structures.push(struct);
      }
      if (result === reader.MODEL_COMPLETE && opts.loadAllModels) {
        continue;
      }
      break;
    }
    var structure = reader.finish();
    if (structure !== null) {
      structures.push(structure);
    }
    console.timeEnd('pdb');
    if (opts.loadAllModels) {
      return structures;
    }
    return structures[0];
  }
  function SDFReader() {
    this._structure = new mol.Mol();
    this._reset();
    this._sawEnd = false;
  }
  SDFReader.prototype = {
    processLine: function (line) {
      var state = this._state;
      if (state < 3) {
        if (state === 0) {
          var trimmed = line.trim();
          if (trimmed.length === 0) {
            return false;
          }
          this._title = trimmed;
        }
        this._sawEnd = false;
        this._state++;
        return true;
      }
      if (state === 3) {
        this._expectedAtomCount = parseInt(line.substr(0, 3).trim(), 10);
        this._expectedBondCount = parseInt(line.substr(3, 3).trim(), 10);
        if (isNaN(this._expectedAtomCount) || isNaN(this._expectedBondCount)) {
          console.error('invalid bond definition');
          return false;
        }
        this._state++;
        var chainName = '' + (this._structure.chains().length + 1);
        this._currentChain = this._structure.addChain(chainName);
        this._currentResidue = this._currentChain.addResidue(this._title, 1);
      }
      if (state === 4) {
        var pos = [
          0,
          0,
          0
        ];
        for (var i = 0; i < 3; ++i) {
          pos[i] = parseFloat(line.substr(i * 10, 10).trim());
          if (isNaN(pos[i])) {
            console.error('invalid atom position');
            return false;
          }
        }
        var element = line.substr(31, 3).trim();
        this._currentResidue.addAtom(element, pos, element, false);
        this._atomCount++;
        if (this._atomCount === this._expectedAtomCount) {
          this._state++;
        }
      }
      if (state === 5) {
        var firstAtomIndex = parseInt(line.substr(0, 3).trim(), 10) - 1;
        var secondAtomIndex = parseInt(line.substr(3, 3).trim(), 10) - 1;
        if (isNaN(firstAtomIndex) || isNaN(secondAtomIndex)) {
          console.error('invalid bond definition');
          return false;
        }
        var atoms = this._currentResidue.atoms();
        this._structure.connect(atoms[firstAtomIndex], atoms[secondAtomIndex]);
        this._bondCount++;
        if (this._bondCount === this._expectedBondCount) {
          this._state++;
        }
      }
      if (line.substr(0, 6) === 'M  END') {
        this._sawEnd = true;
        this._state++;
      }
      if (line.substr(0, 4) === '$$$$') {
        this._reset();
      }
      return true;
    },
    _reset: function () {
      this._state = 0;
      this._currentResidue = null;
      this._currentChain = null;
      this._expectedAtomCount = null;
      this._expectedBondount = null;
      this._atomCount = 0;
      this._bondCount = 0;
      this._title = '';
    },
    finish: function () {
      if (!this._sawEnd) {
        console.error('truncated SDF file');
        return null;
      }
      return this._structure;
    }
  };
  function CRDReader() {
    this._structure = new mol.Mol();
    this._reset();
    this._sawEnd = false;
  }
  CRDReader.prototype = {
    processLine: function (line) {
      if (line.length === 0 || line[0] === '*') {
        return true;
      }
      if (line.length < 52) {
        return true;
      }
      var aName = line.substr(16, 5);
      var rNum = parseInt(line.substr(6, 4).trim(), 10);
      var rName = line.substr(11, 3).trim();
      var pos = vec3.create();
      for (var i = 0; i < 3; ++i) {
        pos[i] = parseFloat(line.substr(20 + i * 10, 10).trim());
      }
      var cName = line[51];
      if (this._currentChain === null || this._currentChain.name() !== cName) {
        this._currentResidue = null;
        this._currentChain = this._structure.chain(cName);
        if (this._currentChain === null) {
          this._currentChain = this._structure.addChain(cName);
        }
      }
      if (this._currentResidue === null || this._currentResidue.num() !== rNum) {
        this._currentResidue = this._currentChain.addResidue(rName, rNum);
      }
      this._currentResidue.addAtom(aName.trim(), pos, aName[0], false, 1, 0);
      return true;
    },
    _reset: function () {
      this._currentResidue = null;
      this._currentChain = null;
    },
    finish: function () {
      this._structure.deriveConnectivity();
      return this._structure;
    }
  };
  function sdf(text) {
    console.time('sdf');
    var reader = new SDFReader();
    var lines = getLines(text);
    for (var i = 0; i < lines.length; i++) {
      if (!reader.processLine(lines[i])) {
        break;
      }
    }
    var structure = reader.finish();
    console.timeEnd('sdf');
    return structure;
  }
  function crd(text) {
    console.time('crd');
    var reader = new CRDReader();
    var lines = getLines(text);
    for (var i = 0; i < lines.length; i++) {
      if (!reader.processLine(lines[i])) {
        break;
      }
    }
    var structure = reader.finish();
    console.timeEnd('crd');
    return structure;
  }
  function fetch(url, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.onload = function () {
      if (oReq.response) {
        callback(oReq.response);
      }
    };
    oReq.send(null);
  }
  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }
  function loadCompressed(url) {
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send();
    if (req.status !== 200) {
      return '';
    }
    var rawfile = req.responseText;
    var bytes = [];
    for (var i = 0; i < rawfile.length; i++) {
      var abyte = rawfile.charCodeAt(i) & 255;
      bytes.push(abyte);
    }
    return bytes;
  }
  function fetchPdb(url, callback, options) {
    fetch(url, function (data) {
      if (endsWith(url, 'gz')) {
        data = loadCompressed(url);
        var gunzip = new Zlib.Gunzip(data);
        data = gunzip.decompress();
        var asciistring = '';
        for (var i = 0; i < data.length; ++i) {
          asciistring += String.fromCharCode(data[i]);
        }
        data = asciistring;
      }
      var structure = pdb(data, options);
      callback(structure);
    });
  }
  function fetchSdf(url, callback) {
    fetch(url, function (data) {
      var structure = sdf(data);
      callback(structure);
    });
  }
  function fetchCrd(url, callback) {
    fetch(url, function (data) {
      var structure = crd(data);
      callback(structure);
    });
  }
  return {
    pdb: pdb,
    sdf: sdf,
    crd: crd,
    Remark350Reader: Remark350Reader,
    fetchPdb: fetchPdb,
    fetchSdf: fetchSdf,
    fetchCrd: fetchCrd,
    guessAtomElementFromName: guessAtomElementFromName
  };
}(molSymmetry);
viewpoint = function () {
  var vec3 = glMatrix.vec3;
  var mat3 = glMatrix.mat3;
  var calculateCovariance = function () {
    var center = vec3.create();
    var shiftedPos = vec3.create();
    return function (go, covariance) {
      vec3.set(center, 0, 0, 0);
      var atomCount = 0;
      go.eachCentralAtom(function (atom, transformedPos) {
        vec3.add(center, center, transformedPos);
        atomCount += 1;
      });
      if (atomCount === 0) {
        return;
      }
      vec3.scale(center, center, 1 / atomCount);
      covariance[0] = 0;
      covariance[1] = 0;
      covariance[2] = 0;
      covariance[3] = 0;
      covariance[4] = 0;
      covariance[5] = 0;
      covariance[6] = 0;
      covariance[7] = 0;
      covariance[8] = 0;
      go.eachCentralAtom(function (atom, transformedPos) {
        vec3.sub(shiftedPos, transformedPos, center);
        var x = shiftedPos[0], y = shiftedPos[1], z = shiftedPos[2];
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
  }();
  var principalAxes = function () {
    var covariance = mat3.create();
    var diag = mat3.create();
    var min = vec3.create();
    var max = vec3.create();
    var projected = vec3.create();
    var range = vec3.create();
    var x = vec3.create();
    var y = vec3.create();
    var z = vec3.create();
    return function (go) {
      calculateCovariance(go, covariance);
      var q = geom.diagonalizer(covariance);
      mat3.fromQuat(diag, q);
      var first = true;
      go.eachCentralAtom(function (atom, transformedPos) {
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
      var axes = [
        [
          range[0],
          0
        ],
        [
          range[1],
          1
        ],
        [
          range[2],
          2
        ]
      ];
      axes.sort(function (a, b) {
        return b[0] - a[0];
      });
      var xIndex = axes[0][1];
      var yIndex = axes[1][1];
      vec3.set(x, diag[xIndex + 0], diag[xIndex + 3], diag[xIndex + 6]);
      vec3.set(y, diag[yIndex + 0], diag[yIndex + 3], diag[yIndex + 6]);
      vec3.cross(z, x, y);
      var rotation = mat3.create();
      rotation[0] = x[0];
      rotation[1] = y[0];
      rotation[2] = z[0];
      rotation[3] = x[1];
      rotation[4] = y[1];
      rotation[5] = z[1];
      rotation[6] = x[2];
      rotation[7] = y[2];
      rotation[8] = z[2];
      return rotation;
    };
  }();
  return { principalAxes: principalAxes };
}();
traj = function () {
  var vec3 = glMatrix.vec3;
  function CoordGroup(structure) {
    this._structure = structure;
    this._frames = [];
  }
  CoordGroup.prototype = {
    addFrame: function (frame) {
      this._frames.push(frame);
    },
    useFrame: function (frameIndex) {
      var frame = this._frames[frameIndex];
      this._structure.eachAtom(function (atom, index) {
        var offset = index * 3;
        vec3.set(atom.pos(), frame[offset + 0], frame[offset + 1], frame[offset + 2]);
      });
    }
  };
  function dcd(structure, data) {
    var cg = new CoordGroup(structure);
    var endianness = String.fromCharCode(data.getUint8(4)) + String.fromCharCode(data.getUint8(5)) + String.fromCharCode(data.getUint8(6)) + String.fromCharCode(data.getUint8(7));
    var swapBytes = endianness === 'DROC';
    var current = 92;
    var titleLength = data.getUint32(current, swapBytes);
    current += 4;
    var title = '';
    var i;
    for (i = 0; i < titleLength; ++i) {
      title += String.fromCharCode(data.getUint8(current));
      current += 1;
    }
    var numFrames = data.getUint32(4 * 2, swapBytes);
    var format = data.getUint32(4 * 21, swapBytes);
    var perFrameHeader = false;
    if (format !== 0) {
      perFrameHeader = data.getUint32(4 * 12, swapBytes) !== 0;
    }
    current += 8;
    var tAtomCount = data.getUint32(current, swapBytes);
    current += 8;
    for (i = 0; i < numFrames; ++i) {
      var frame = new Float32Array(3 * tAtomCount);
      if (perFrameHeader) {
        current += 56;
      }
      for (var k = 0; k < 3; ++k) {
        current += 4;
        for (var j = 0; j < tAtomCount; ++j) {
          var value = data.getFloat32(current, swapBytes);
          frame[j * 3 + k] = value;
          current += 4;
        }
        current += 4;
      }
      cg.addFrame(frame);
    }
    return cg;
  }
  function fetch(url, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.responseType = 'arraybuffer';
    oReq.onload = function () {
      if (oReq.response) {
        callback(new DataView(oReq.response));
      }
    };
    oReq.send(null);
  }
  function fetchDcd(url, structure, callback) {
    fetch(url, function (data) {
      var coordGroup = dcd(structure, data);
      callback(coordGroup);
    });
  }
  return {
    CoordGroup: CoordGroup,
    fetchDcd: fetchDcd
  };
}();
pv = function () {
  return {
    Viewer: viewer.Viewer,
    isWebGLSupported: viewer.isWebGLSupported,
    io: io,
    traj: traj,
    color: color,
    mol: mol,
    rgb: {
      setColorPalette: color.setColorPalette,
      hex2rgb: color.hex2rgb
    },
    vec3: glMatrix.vec3,
    vec4: glMatrix.vec4,
    mat3: glMatrix.mat3,
    mat4: glMatrix.mat4,
    quat: glMatrix.quat,
    viewpoint: viewpoint
  };
}();return pv; }));