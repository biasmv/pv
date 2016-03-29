// Copyright (c) 2013-2015 Marco Biasini
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

define(
  [
    '../geom', 
    './billboard-geom', 
    './line-geom', 
    './mesh-geom', 
    './geom-builders', 
    './vert-assoc', 
    '../color',
    '../gl-matrix'
  ], 
  function(
    geom, 
    BillboardGeom,
    LineGeom, 
    MeshGeom, 
    gfxGeomBuilders, 
    gfxVertAssoc, 
    color, 
    glMatrix) {
"use strict";

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
var COIL_POINTS = [ -R, -R, 0, R, -R, 0, R, R, 0, -R, R, 0 ];

var HELIX_POINTS = [
  -6.0 * R, -0.9 * R2, 0,
  -5.8 * R, -1.0 * R2, 0,

   5.8 * R, -1.0 * R2, 0,
   6.0 * R, -0.9 * R2, 0,

   6.0 * R,  0.9 * R2, 0,
   5.8 * R,  1.0 * R2, 0,

  -5.8 * R,  1.0 * R2, 0,
  -6.0 * R,  0.9 * R2, 0
];


var ARROW_POINTS = [
 -10.0 * R, -0.9 * R2, 0,
  -9.8 * R, -1.0 * R2, 0,

   9.8 * R, -1.0 * R2, 0,
  10.0 * R, -0.9 * R2, 0,

  10.0 * R,  0.9 * R2, 0,
   9.8 * R,  1.0 * R2, 0,

  -9.8 * R,  1.0 * R2, 0,
 -10.0 * R,  0.9 * R2, 0
];

/* van der Waals radius by atom._element
 * from Royal Society of Chemistry
 * http://www.rsc.org/periodic-table/trends
*/
var VDW_RADIUS = {
  H: 1.1,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  F: 1.47,
  CL: 1.75,
  BR: 1.85,
  I : 1.98,
  HE : 1.4,
  NE : 1.54,
  AR : 1.88,
  XE : 2.16,
  KR : 2.02,
  P: 1.8,
  S: 1.8,
  B : 1.92,
  LI : 1.82,
  NA : 2.27,
  K : 2.75,
  RB : 3.03,
  CS : 3.43,
  FR : 3.48,
  BE : 1.53,
  MG : 1.73,
  SR : 2.49,
  BA : 2.68,
  RA : 2.83,
  TI : 2.11,
  FE : 2.04,
  CU: 1.96,
};

// performs an in-place smoothing over 3 consecutive positions.
var smoothStrandInplace = (function() {
  var bf = vec3.create(), af = vec3.create(), cf = vec3.create();
  return function(p, from, to, length) {
    from = Math.max(from, 1);
    to = Math.min(length - 1, to);
    var startIndex = 3 * (from - 1);
    vec3.set(bf, p[startIndex], p[startIndex + 1], p[startIndex + 2]);
    vec3.set(cf, p[3 * from], p[3 * from + 1], p[3 * from + 2]);
    for (var i = from; i < to; ++i) {
      startIndex = 3 * (i + 1);
      vec3.set(af, p[startIndex], p[startIndex + 1], p[startIndex + 2]);
      p[3 * i + 0] = af[0] * 0.25 + cf[0] * 0.50 + bf[0] * 0.25;
      p[3 * i + 1] = af[1] * 0.25 + cf[1] * 0.50 + bf[1] * 0.25;
      p[3 * i + 2] = af[2] * 0.25 + cf[2] * 0.50 + bf[2] * 0.25;
      vec3.copy(bf, cf);
      vec3.copy(cf, af);
    }
  };
})();


var spheresForChain = (function() {
  var color = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

  return function(meshGeom, vertAssoc, opts, chain) {
    var atomCount = chain.atomCount();
    var idRange = opts.idPool.getContinuousRange(atomCount);
    meshGeom.addIdRange(idRange);
    var vertsPerSphere = opts.protoSphere.numVerts();
    var indicesPerSphere = opts.protoSphere.numIndices();
    var radius = 1.5 * opts.radiusMultiplier;
    meshGeom.addChainVertArray(chain, vertsPerSphere*atomCount, 
                              indicesPerSphere*atomCount);
    chain.eachAtom(function(atom) {
      var va = meshGeom.vertArrayWithSpaceFor(vertsPerSphere);
      opts.color.colorFor(atom, color, 0);
      var vertStart = va.numVerts();
      var objId = idRange.nextId({ geom: meshGeom, atom : atom });
      opts.protoSphere.addTransformed(va, atom.pos(), radius, color, objId);
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });
  };
})();

exports.spheres = function(structure, gl, opts) {
  console.time('spheres');
  var protoSphere = new ProtoSphere(opts.sphereDetail, opts.sphereDetail);
  opts.protoSphere = protoSphere;
  var geom = new MeshGeom(gl, opts.float32Allocator, opts.uint16Allocator);
  var vertAssoc = new AtomVertexAssoc(structure, true);
  geom.addVertAssoc(vertAssoc);
  geom.setShowRelated(opts.showRelated);
  opts.color.begin(structure);
  structure.eachChain(function(chain) {
    spheresForChain(geom, vertAssoc, opts, chain);
  });
  opts.color.end(structure);
  console.timeEnd('spheres');
  return geom;
};

var billboardedSpheresForChain = (function() {
  var color = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

  return function(meshGeom, vertAssoc, opts, chain) {
    var atomCount = chain.atomCount();
    var idRange = opts.idPool.getContinuousRange(atomCount);
    meshGeom.addIdRange(idRange);
    var vertsPerSphere = 4; // one quad per sphere
    var indicesPerSphere = 6; // two triangles per quad
    var radius = 1.5 * opts.radiusMultiplier;
    meshGeom.addChainVertArray(chain, vertsPerSphere*atomCount, 
                              indicesPerSphere*atomCount);
    chain.eachAtom(function(atom) {
      var va = meshGeom.vertArrayWithSpaceFor(vertsPerSphere);
      opts.color.colorFor(atom, color, 0);
      var objId = idRange.nextId({ geom: meshGeom, atom : atom });
      var vertStart = va.numVerts();
      var p = atom.pos();
      va.addVertex(p, [-1.0, -1.0, radius], color, objId);
      va.addVertex(p, [+1.0, +1.0, radius], color, objId);
      va.addVertex(p, [+1.0, -1.0, radius], color, objId);
      va.addVertex(p, [-1.0, +1.0, radius], color, objId);
      va.addTriangle(vertStart + 0, vertStart + 1, vertStart + 2);
      va.addTriangle(vertStart + 0, vertStart + 3, vertStart + 1);
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });
  };
})();

exports.billboardedSpheres = function(structure, gl, opts) {
  console.time('billboardedSpheres');
  var geom = new BillboardGeom(gl, opts.float32Allocator, 
                               opts.uint16Allocator);
  var vertAssoc = new AtomVertexAssoc(structure, true);
  geom.addVertAssoc(vertAssoc);
  geom.setShowRelated(opts.showRelated);
  opts.color.begin(structure);
  structure.eachChain(function(chain) {
    billboardedSpheresForChain(geom, vertAssoc, opts, chain);
  });
  opts.color.end(structure);
  console.timeEnd('billboardedSpheres');
  return geom;
};




var ballsAndSticksForChain = (function() {
  var midPoint = vec3.create(), dir = vec3.create();
  var color = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  var left = vec3.create(), up = vec3.create();
  var rotation = mat3.create();
  return function(meshGeom, vertAssoc, opts, chain) {
    // determine required number of vertices and indices for this chain
    var atomCount = chain.atomCount();
    var bondCount = 0;
    chain.eachAtom(function(a) { bondCount += a.bonds().length; });
    var numVerts = atomCount * opts.protoSphere.numVerts() + 
                   bondCount * opts.protoCyl.numVerts();
    var numIndices = atomCount * opts.protoSphere.numIndices() + 
                     bondCount * opts.protoCyl.numIndices();
    meshGeom.addChainVertArray(chain, numVerts, numIndices);
    var idRange = opts.idPool.getContinuousRange(atomCount);
    meshGeom.addIdRange(idRange);
    // generate geometry for each atom
    chain.eachAtom(function(atom) {
      var atomScale = opts.scaleByAtomRadius ?
        VDW_RADIUS[atom.element()] || 1 :
        1;
      var atomRadius = opts.sphereRadius * atomScale;
      var atomVerts = opts.protoSphere.numVerts() + 
                      atom.bondCount() * opts.protoCyl.numVerts();
      var va = meshGeom.vertArrayWithSpaceFor(atomVerts);
      var vertStart = va.numVerts();
      var objId = idRange.nextId({ geom: meshGeom, atom : atom });

      opts.color.colorFor(atom, color, 0);
      opts.protoSphere.addTransformed(va, atom.pos(), atomRadius, color,
                                         objId);
      atom.eachBond(function(bond) {
        bond.mid_point(midPoint);
        vec3.sub(dir, atom.pos(), midPoint);
        var length = vec3.length(dir);

        vec3.scale(dir, dir, 1.0/length);

        geom.buildRotation(rotation, dir, left, up, false);

        vec3.add(midPoint, midPoint, atom.pos());
        vec3.scale(midPoint, midPoint, 0.5);
        opts.protoCyl.addTransformed(va, midPoint, length, opts.cylRadius, 
                                        rotation, color, color, objId, objId);
      });
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });
  };
})();

exports.ballsAndSticks = function(structure, gl, opts) {
  console.time('ballsAndSticks');
  var vertAssoc = new AtomVertexAssoc(structure, true);
  var protoSphere = new ProtoSphere(opts.sphereDetail, opts.sphereDetail);
  var protoCyl = new ProtoCylinder(opts.arcDetail);
  opts.protoSphere = protoSphere;
  opts.protoCyl = protoCyl;
  var meshGeom = new MeshGeom(gl, opts.float32Allocator, 
                              opts.uint16Allocator);
  meshGeom.addVertAssoc(vertAssoc);
  meshGeom.setShowRelated(opts.showRelated);
  opts.color.begin(structure);
  structure.eachChain(function(chain) {
    ballsAndSticksForChain(meshGeom, vertAssoc, opts, chain);
  });
  opts.color.end(structure);
  console.timeEnd('ballsAndSticks');
  return meshGeom;
};

var pointsForChain = (function () {
  var clr = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  return function(lineGeom, vertAssoc, chain, opts) {
    var atomCount = chain.atomCount();
    var idRange = opts.idPool.getContinuousRange(atomCount);
    lineGeom.addIdRange(idRange);
    var va = lineGeom.addChainVertArray(chain, atomCount);
    va.setDrawAsPoints(true);
    chain.eachAtom(function(atom) {
      var vertStart = va.numVerts();
      opts.color.colorFor(atom, clr, 0);
      var objId = idRange.nextId({ geom : lineGeom, atom: atom });
      va.addPoint(atom.pos(), clr, objId);
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });
  };
})();


exports.points = function(structure, gl, opts) {
  console.time('points');
  var vertAssoc = new AtomVertexAssoc(structure, true);
  opts.color.begin(structure);
  var lineGeom = new LineGeom(gl, opts.float32Allocator);
  lineGeom.setPointSize(opts.pointSize);
  lineGeom.addVertAssoc(vertAssoc);
  lineGeom.setShowRelated(opts.showRelated);
  structure.eachChain(function(chain) {
    pointsForChain(lineGeom, vertAssoc, chain, opts);
  });
  opts.color.end(structure);
  console.timeEnd('points');
  return lineGeom;
};

var linesForChain = (function () {
  var mp = vec3.create();
  var clr = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  return function(lineGeom, vertAssoc, chain, opts) {
    var lineCount = 0;
    var atomCount = chain.atomCount();
    var idRange = opts.idPool.getContinuousRange(atomCount);
    lineGeom.addIdRange(idRange);
    // determine number of required lines to draw the full structure
    chain.eachAtom(function(atom) {
      var numBonds = atom.bonds().length;
      if (numBonds) {
        lineCount += numBonds;
      } else {
        lineCount += 3;
      }
    });
    var va = lineGeom.addChainVertArray(chain, lineCount * 2);
    chain.eachAtom(function(atom) {
      // for atoms without bonds, we draw a small cross, otherwise these atoms
      // would be invisible on the screen.
      var vertStart = va.numVerts();
      var objId = idRange.nextId({ geom : lineGeom, atom: atom });
      if (atom.bonds().length) {
        atom.eachBond(function(bond) {
          bond.mid_point(mp);
          opts.color.colorFor(atom, clr, 0);
          va.addLine(atom.pos(), clr, mp, clr, objId, objId);
        });
      } else {
        var cs = 0.2;
        var pos = atom.pos();
        opts.color.colorFor(atom, clr, 0);
        va.addLine([ pos[0] - cs, pos[1], pos[2] ], clr,
                   [ pos[0] + cs, pos[1], pos[2] ], clr, objId, objId);
        va.addLine([ pos[0], pos[1] - cs, pos[2] ], clr,
                   [ pos[0], pos[1] + cs, pos[2] ], clr, objId, objId);
        va.addLine([ pos[0], pos[1], pos[2] - cs ], clr,
                   [ pos[0], pos[1], pos[2] + cs ], clr, objId, objId);
      }
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });

  };
})();


exports.lines = function(structure, gl, opts) {
  console.time('lines');
  var vertAssoc = new AtomVertexAssoc(structure, true);
  opts.color.begin(structure);
  var lineGeom = new LineGeom(gl, opts.float32Allocator);
  lineGeom.setLineWidth(opts.lineWidth);
  lineGeom.addVertAssoc(vertAssoc);
  lineGeom.setShowRelated(opts.showRelated);
  structure.eachChain(function(chain) {
    linesForChain(lineGeom, vertAssoc, chain, opts);
  });
  opts.color.end(structure);
  console.timeEnd('lines');
  return lineGeom;
};

var _lineTraceNumVerts = function(traces) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += 2 * (traces[i].length() - 1);
  }
  return numVerts;
};

var makeLineTrace = (function() {
  var colorOne = vec4.fromValues(0.0, 0.0, 0.0, 1.0), 
      colorTwo = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  var posOne = vec3.create(), posTwo = vec3.create();

  return function makeLineTrace(lineGeom, vertAssoc, va, traceIndex, 
                                trace, opts) {
    vertAssoc.addAssoc(traceIndex, va, 0, va.numVerts(),
                        va.numVerts() + 1);

    var colors = opts.float32Allocator.request(trace.length() * 4);
    var idRange = opts.idPool.getContinuousRange(trace.length());
    lineGeom.addIdRange(idRange);
    var idOne = idRange.nextId({ geom: lineGeom, 
                                 atom : trace.centralAtomAt(0),
                                 isTrace : true });
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
        geom: lineGeom, atom : trace.centralAtomAt(i), isTrace : true});
      va.addLine(posOne, colorOne, posTwo, colorTwo, idOne, idTwo);
      idOne = idTwo;
      idTwo = null;
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(traceIndex, va, i, vertEnd - 1,
                          vertEnd + ((i === trace.length() - 1) ? 0 : 1));
    }
    colors[trace.length() * 4 - 4] = colorTwo[0];
    colors[trace.length() * 4 - 3] = colorTwo[1];
    colors[trace.length() * 4 - 2] = colorTwo[2];
    colors[trace.length() * 4 - 1] = colorTwo[3];
    vertAssoc.setPerResidueColors(traceIndex, colors);
    return traceIndex + 1;
  };
})();

var lineTraceForChain = function(lineGeom, vertAssoc, opts, traceIndex, 
                                 chain) {
  var backboneTraces =  chain.backboneTraces();
  var numVerts = _lineTraceNumVerts(backboneTraces);
  var va = lineGeom.addChainVertArray(chain, numVerts);
  for (var i = 0; i < backboneTraces.length; ++i) {
    traceIndex = makeLineTrace(lineGeom, vertAssoc, va, traceIndex, 
                               backboneTraces[i], opts);
  }
  return traceIndex;


};
//--------------------------------------------------------------------------
// Some thoughts on trace-based render styles
//
//  * Backbone traces must be determined from the complete structure (Chain
//    as opposed to ChainView).
//
//  * For subsets, the trace must start midway between the residue before
//    the visible part, and end midway after the last visible residue.
//
//  * Curvature of trace subsets must be based on the full backbone trace.
//--------------------------------------------------------------------------
exports.lineTrace = function(structure, gl, opts) {


  console.time('lineTrace');
  var vertAssoc = new TraceVertexAssoc(structure, 1, true);
  opts.color.begin(structure);
  var lineGeom = new LineGeom(gl, opts.float32Allocator);
  lineGeom.setLineWidth(opts.lineWidth);
  var traceIndex = 0;
  structure.eachChain(function(chain) { 
    traceIndex = lineTraceForChain(lineGeom, vertAssoc, opts, 
                                   traceIndex, chain);
  });
  lineGeom.addVertAssoc(vertAssoc);
  lineGeom.setShowRelated(opts.showRelated);
  opts.color.end(structure);
  console.timeEnd('lineTrace');
  return lineGeom;
};

var _slineNumVerts = function(traces, splineDetail) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += 2 * (splineDetail * (traces[i].length() - 1) + 1);
  }
  return numVerts;
};

var slineMakeTrace = (function() {
  var posOne = vec3.create(), posTwo = vec3.create();
  var colorOne = vec4.fromValues(0.0, 0.0, 0.0, 1.0), 
      colorTwo = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  return function(lineGeom, vertAssoc, va, opts, traceIndex, trace) {
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
      objIds.push(idRange.nextId({ geom : lineGeom, atom : atom, 
                                   isTrace : true }));
    }
    var idStart = objIds[0], idEnd = 0;
    var sdiv = geom.catmullRomSpline(positions, trace.length(),
                                     opts.splineDetail, opts.strength,
                                     false, opts.float32Allocator);
    var interpColors = interpolateColor(colors, opts.splineDetail);
    var vertStart = va.numVerts();
    vertAssoc.addAssoc(traceIndex, va, firstSlice, vertStart, vertStart + 1);
    var halfSplineDetail = Math.floor(opts.splineDetail / 2);
    var steps = geom.catmullRomSplineNumPoints(trace.length(),
                                               opts.splineDetail, false);
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
      vertAssoc.addAssoc(traceIndex, va, firstSlice + i, vertEnd - 1,
                         vertEnd + ((i === trace.length - 1) ? 0 : 1));
    }
    vertAssoc.setPerResidueColors(traceIndex, colors);
    opts.float32Allocator.release(positions);
    opts.float32Allocator.release(sdiv);
    return traceIndex + 1;
  };
})();

var slineForChain = function(lineGeom, vertAssoc, opts, chain, traceIndex) {
  var backboneTraces = chain.backboneTraces();
  var numVerts = _slineNumVerts(backboneTraces, opts.splineDetail);
  var va = lineGeom.addChainVertArray(chain, numVerts);
  for (var i = 0; i < backboneTraces.length; ++i) {
    traceIndex = slineMakeTrace(lineGeom, vertAssoc, va, opts, 
                                traceIndex, backboneTraces[i]);
  }
  return traceIndex;
};

exports.sline = function(structure, gl, opts) {
  console.time('sline');
  opts.color.begin(structure);
  var vertAssoc =
      new TraceVertexAssoc(structure, opts.splineDetail, 1, true);
  var lineGeom = new LineGeom(gl, opts.float32Allocator);
  lineGeom.addVertAssoc(vertAssoc);
  lineGeom.setLineWidth(opts.lineWidth);
  lineGeom.setShowRelated(opts.showRelated);
  var traceIndex = 0;
  structure.eachChain(function(chain) {
    traceIndex = slineForChain(lineGeom, vertAssoc, opts, chain, traceIndex);
  });
  opts.color.end(structure);
  console.timeEnd('sline');
  return lineGeom;
};

var _traceNumVerts = function(traces, sphereNumVerts, cylNumVerts) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += traces[i].length() * sphereNumVerts;
    numVerts += (traces[i].length() - 1) * cylNumVerts;
  }
  return numVerts;
};

var _traceNumIndices = function(traces, sphereNumIndices, cylNumIndices) {
  var numIndices = 0;
  for (var i = 0; i < traces.length; ++i) {
    numIndices += traces[i].length() * sphereNumIndices;
    numIndices += (traces[i].length() - 1) * cylNumIndices;
  }
  return numIndices;
};

var traceForChain = function(meshGeom, vertAssoc, opts, traceIndex, chain) {
  // determine number of verts required to render the traces
  var traces = chain.backboneTraces();
  var numVerts = _traceNumVerts(traces, opts.protoSphere.numVerts(),
                                opts.protoCyl.numVerts());
  var numIndices = _traceNumIndices(traces, opts.protoSphere.numIndices(),
                                    opts.protoCyl.numIndices());
  meshGeom.addChainVertArray(chain, numVerts, numIndices);
  for (var ti = 0; ti < traces.length; ++ti) {
    _renderSingleTrace(meshGeom, vertAssoc, traces[ti], traceIndex, opts);
    traceIndex++;
  }
  return traceIndex;
};

exports.trace = function(structure, gl, opts) {
  console.time('trace');

  opts.protoCyl = new ProtoCylinder(opts.arcDetail);
  opts.protoSphere =
      new ProtoSphere(opts.sphereDetail, opts.sphereDetail);

  var meshGeom = new MeshGeom(gl, opts.float32Allocator, 
                              opts.uint16Allocator);
  var vertAssoc = new TraceVertexAssoc(structure, 1, true);
  meshGeom.addVertAssoc(vertAssoc);
  meshGeom.setShowRelated(opts.showRelated);

  opts.color.begin(structure);
  var traceIndex = 0;
  structure.eachChain(function(chain) {
    traceIndex = traceForChain(meshGeom, vertAssoc, opts, traceIndex, chain);
  });
  opts.color.end(structure);

  console.timeEnd('trace');
  return meshGeom;
};

// calculates the number of vertices required for the cartoon and
// tube render styles
var _cartoonNumVerts = function(traces, vertsPerSlice, splineDetail) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    var traceVerts = 
      ((traces[i].length() - 1) * splineDetail + 1) * vertsPerSlice;
    // in case there are more than 2^16 vertices for a single trace, we
    // need to manually split the trace in two and duplicate one of the
    // trace slices. Let's make room for some additional space...
    var splits = Math.ceil((traceVerts + 2)/65536);
    numVerts += traceVerts + (splits - 1) * vertsPerSlice;
    // triangles for capping the tube
    numVerts += 2;
  }
  return numVerts;
};

var _cartoonNumIndices = function(traces, vertsPerSlice, splineDetail) {
  var numIndices = 0;
  for (var i = 0; i < traces.length; ++i) {
    numIndices += (traces[i].length() * splineDetail - 1) * vertsPerSlice * 6;
    // triangles for capping the tube
    numIndices += 2 * 3 * vertsPerSlice;
  }
  return numIndices;
};

// creates the capped cylinders for DNA/RNA pointing towards the end of the 
// bases.
var _addNucleotideSticks = (function() {
  var rotation = mat3.create();
  var up = vec3.create(), left = vec3.create(), dir = vec3.create();
  var center = vec3.create();
  var color = vec4.create();
  return function(meshGeom, vertAssoc, traces, opts) {
    var radius = opts.radius * 1.8;
    var vertsPerNucleotideStick = opts.protoCyl.numVerts() +
       2 * opts.protoSphere.numVerts();
    for (var i = 0; i < traces.length; ++i) {
      var trace = traces[i];
      var idRange = opts.idPool.getContinuousRange(trace.length());
      meshGeom.addIdRange(idRange);
      for (var j = 0; j <  trace.length(); ++j) {
        var va = meshGeom.vertArrayWithSpaceFor(vertsPerNucleotideStick);
        var vertStart = va.numVerts();
        var residue = trace.residueAt(j);
        var resName = residue.name();
        var startAtom = residue.atom('C3\'');
        var endAtom = null;
        if (resName === 'A' || resName === 'G' || 
            resName === 'DA' || resName === 'DG') {
          endAtom = residue.atom('N1');
        } else {
          endAtom = residue.atom('N3');
        }
        if (endAtom === null || startAtom === null) {
          continue;
        }
        var objId = idRange.nextId({ geom: meshGeom, atom : 
                                     endAtom, isTrace : true });
        vec3.add(center, startAtom.pos(), endAtom.pos());
        vec3.scale(center, center, 0.5);

        opts.color.colorFor(endAtom, color, 0);
        vec3.sub(dir, endAtom.pos(), startAtom.pos());
        var length = vec3.length(dir);
        vec3.scale(dir, dir, 1.0/length);
        geom.buildRotation(rotation, dir, left, up, false);

        opts.protoCyl.addTransformed(va, center, length, radius, 
                                     rotation, color, color, objId, objId);
        opts.protoSphere.addTransformed(va, endAtom.pos(), radius, 
                                        color, objId);
        opts.protoSphere.addTransformed(va, startAtom.pos(), radius, 
                                        color, objId);
        var vertEnd = va.numVerts();
        console.assert(vertEnd <= 65536, 'too many vertices');
        vertAssoc.addAssoc(endAtom, va, vertStart, vertEnd);
      }
    }
  };
})();

// generates the mesh geometry for displaying a single chain as either cartoon
// or tube (opts.forceTube === true).
var cartoonForChain = function(meshGeom, vertAssoc, nucleotideAssoc, opts, 
                               traceIndex, chain) {
  var traces = chain.backboneTraces();
  var numVerts = _cartoonNumVerts(traces, opts.arcDetail * 4,
                                  opts.splineDetail);
  var numIndices = _cartoonNumIndices(traces, opts.arcDetail * 4,
                                      opts.splineDetail);
  // figure out which of the traces consist of nucleic acids. They require 
  // additional space for rendering the sticks.
  var nucleicAcidTraces = [];
  var vertForBaseSticks = opts.protoCyl.numVerts() + 
    2 * opts.protoSphere.numVerts();
  var indicesForBaseSticks = opts.protoCyl.numIndices() + 
    2 * opts.protoSphere.numIndices();
  for (var i = 0; i < traces.length; ++i) {
    var trace = traces[i];
    if (trace.residueAt(0).isNucleotide()) {
      nucleicAcidTraces.push(trace);
      // each DNA/RNA base gets a double-capped cylinder
      numVerts += trace.length() * vertForBaseSticks;
      numIndices += trace.length() * indicesForBaseSticks;
    }
  }
  meshGeom.addChainVertArray(chain, numVerts, numIndices);
  for (var ti = 0; ti < traces.length; ++ti) {
    traceIndex = _cartoonForSingleTrace(meshGeom, vertAssoc, traces[ti], 
                                        traceIndex, opts);
  }
  _addNucleotideSticks(meshGeom, nucleotideAssoc, nucleicAcidTraces, opts);
  return traceIndex;
};

exports.cartoon = function(structure, gl, opts) {
  console.time('cartoon');
  opts.arrowSkip = Math.floor(opts.splineDetail * 3 / 4);
  opts.coilProfile = new TubeProfile(COIL_POINTS, opts.arcDetail, 1.0);
  opts.arrowProfile = new TubeProfile(ARROW_POINTS, opts.arcDetail/2, 0.1);
  opts.helixProfile = new TubeProfile(HELIX_POINTS, opts.arcDetail/2, 0.1);
  opts.strandProfile = new TubeProfile(HELIX_POINTS, opts.arcDetail/2, 0.1);
  opts.protoCyl = new ProtoCylinder(opts.arcDetail * 4);
  opts.protoSphere = new ProtoSphere(opts.arcDetail * 4, 
                                        opts.arcDetail * 4);

  var meshGeom = new MeshGeom(gl, opts.float32Allocator, 
                              opts.uint16Allocator);
  var vertAssoc = new TraceVertexAssoc(structure, opts.splineDetail, true);
  meshGeom.addVertAssoc(vertAssoc);
  meshGeom.setShowRelated(opts.showRelated);

  opts.color.begin(structure);

  var traceIndex = 0;
  // the following vert-assoc is for rendering of DNA/RNA. Create vertex assoc 
  // from N1/N3 atoms only, this will speed up recoloring later on, which when 
  // performed on the complete structure, is slower than recalculating the 
  // whole geometry.
  var selection = structure.select({anames: ['N1', 'N3']});
  var nucleotideAssoc = new AtomVertexAssoc(selection, true);
  meshGeom.addVertAssoc(nucleotideAssoc);
  structure.eachChain(function(chain) {
    traceIndex = cartoonForChain(meshGeom, vertAssoc, nucleotideAssoc, opts, 
                                 traceIndex, chain);
  });

  opts.color.end(structure);
  console.timeEnd('cartoon');
  return meshGeom;
};

exports.surface = (function() {
  var pos = vec3.create(), normal = vec3.create(), 
      color = vec4.fromValues(0.8, 0.8, 0.8, 1.0);
  return function(data, gl, opts) {
    var offset = 0;
    /*var version = */data.getUint32(0);
    offset += 4;
    var numVerts = data.getUint32(offset);
    offset += 4;
    var vertexStride = 4 * 6;
    var facesDataStart = vertexStride * numVerts + offset;
    var numFaces = data.getUint32(facesDataStart);
    var meshGeom = new MeshGeom(gl, opts.float32Allocator,
                                opts.uint16Allocator);
    meshGeom.setShowRelated('asym');
    var va = meshGeom.addVertArray(numVerts, numFaces * 3);
    var i;
    for (i = 0 ; i < numVerts; ++i) {
      vec3.set(pos, data.getFloat32(offset + 0), data.getFloat32(offset + 4),
               data.getFloat32(offset + 8));
      offset += 12;
      vec3.set(normal, data.getFloat32(offset + 0), data.getFloat32(offset + 4),
               data.getFloat32(offset + 8));
      offset += 12;
      va.addVertex(pos, normal, color, 0);
    }
    offset = facesDataStart + 4;
    for (i = 0 ; i < numFaces; ++i) {
      var idx0 = data.getUint32(offset + 0),
          idx1 = data.getUint32(offset + 4),
          idx2 = data.getUint32(offset + 8);
      offset += 12;
      va.addTriangle(idx0 - 1, idx2 -1, idx1 - 1);
    }
    return meshGeom;
  };
})();

var _cartoonAddTube = (function() {
  var rotation = mat3.create();
  var up = vec3.create();

  return function(vertArray, pos, left, ss, tangent, color, radius, first, 
                  opts, offset, objId) {
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
    prof.addTransformed(vertArray, pos, radius, rotation, color, first,
                        offset, objId);
  };
})();

// INTERNAL: fills positions, normals and colors from the information found in
// trace. The 3 arrays must already have the correct size (3*trace.length).
var _colorPosNormalsFromTrace = (function() {
  var pos = vec3.create();
  var normal = vec3.create(), lastNormal = vec3.create();

  return function(meshGeom, trace, colors, positions, normals, objIds, pool, 
                  opts) {
    var strandStart = null, strandEnd = null;
    var trace_length = trace.length();
    vec3.set(lastNormal, 0.0, 0.0, 0.0);
    for (var i = 0; i < trace_length; ++i) {
      objIds.push(pool.nextId({ geom : meshGeom, 
                                atom : trace.centralAtomAt(i),
                                isTrace : true }));
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
      if (trace.residueAt(i).ss() === 'E' && 
          !opts.forceTube && opts.smoothStrands) {
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
})();


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


// constructs a cartoon representation for a single consecutive backbone
// trace.
var _cartoonForSingleTrace = (function() {

  var tangent = vec3.create(), pos = vec3.create(), 
      color = vec4.fromValues(0.0, 0.0, 0.0, 1.0), 
      normal = vec3.create(), normal2 = vec3.create();
  return function(meshGeom, vertAssoc, trace, traceIndex, opts) {
    var numVerts =
        _cartoonNumVerts([trace], opts.arcDetail * 4, opts.splineDetail);
    var positions = opts.float32Allocator.request(trace.length() * 3);
    var colors = opts.float32Allocator.request(trace.length() * 4);
    var normals = opts.float32Allocator.request(trace.length() * 3);

    var objIds = [];
    var idRange = opts.idPool.getContinuousRange(trace.length());
    meshGeom.addIdRange(idRange);
    _colorPosNormalsFromTrace(meshGeom, trace, colors, positions, normals, 
                              objIds, idRange, opts);
    var vertArray = meshGeom.vertArrayWithSpaceFor(numVerts);
    var sdiv = geom.catmullRomSpline(positions, trace.length(),
                                      opts.splineDetail, opts.strength,
                                      false, opts.float32Allocator);
    var normalSdiv = geom.catmullRomSpline(
        normals, trace.length(), opts.splineDetail, opts.strength, false,
        opts.float32Allocator);
    vertAssoc.setPerResidueColors(traceIndex, colors);
    var radius = 
      opts.radius * (trace.residueAt(0).isAminoacid() ? 1.0 : 1.8);
    var interpColors = interpolateColor(colors, opts.splineDetail);
    // handle start of trace. this could be moved inside the for-loop, but
    // at the expense of a conditional inside the loop. unrolling is
    // slightly faster.
    //
    // we repeat the following steps for the start, central section and end
    // of the profile: (a) assign position, normal, tangent and color, (b)
    // add tube (or rectangular profile for helices and strands).
    vec3.set(tangent, sdiv[3] - sdiv[0], sdiv[4] - sdiv[1], sdiv[5] - sdiv[2]);
    vec3.set(pos, sdiv[0], sdiv[1], sdiv[2]);
    vec3.set(normal, normalSdiv[0] - sdiv[0], normalSdiv[1] - sdiv[1],
              normalSdiv[2] - sdiv[2]);
    vec3.normalize(tangent, tangent);
    vec3.normalize(normal, normal);
    vec4.set(color, interpColors[0], interpColors[1], interpColors[2], 
             interpColors[3] );

    var vertStart = vertArray.numVerts();
    vertArray.addVertex(pos, [-tangent[0], -tangent[1], -tangent[2]], 
                        color, objIds[0]);
    
    var currentSS = trace.residueAt(0).ss();
    _cartoonAddTube(vertArray, pos, normal, currentSS, tangent,
                    color, radius, true, opts, 0, objIds[0]);
    capTubeStart(vertArray, vertStart, opts.arcDetail * 4);
    var vertEnd = vertArray.numVerts();
    var slice = 0;
    vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
    slice += 1;
    var halfSplineDetail = Math.floor(opts.splineDetail / 2);

    // handle the bulk of the trace
    var steps = geom.catmullRomSplineNumPoints(trace.length(),
                                                opts.splineDetail, false);

    var vertsPerSlice = opts.arcDetail * 4;
    for (var i = 1, e = steps; i < e; ++i) {
      // compute 3*i, 3*(i-1), 3*(i+1) once and reuse
      var ix3 = 3 * i, ix4 = 4 * i,  ipox3 = 3 * (i + 1), imox3 = 3 * (i - 1);

      vec3.set(pos, sdiv[ix3], sdiv[ix3 + 1], sdiv[ix3 + 2]);

      if (i === e -1) {
        vec3.set(tangent, sdiv[ix3] - sdiv[imox3],
                 sdiv[ix3 + 1] - sdiv[imox3 + 1],
                 sdiv[ix3 + 2] - sdiv[imox3 + 2]);
      } else {
        vec3.set(tangent, sdiv[ipox3] - sdiv[imox3],
                 sdiv[ipox3 + 1] - sdiv[imox3 + 1],
                 sdiv[ipox3 + 2] - sdiv[imox3 + 2]);
      }
      vec3.normalize(tangent, tangent);
      vec4.set(color, interpColors[ix4], interpColors[ix4 + 1],
               interpColors[ix4 + 2], interpColors[ix4 + 3]);

      var offset = 0; // <- set special handling of coil to helix,strand
                      //    transitions.
      var iCentered = i + opts.splineDetail / 2;
      var residueIndex = Math.floor(iCentered / opts.splineDetail);
      var prevResidueIndex = Math.floor((iCentered - 1) / opts.splineDetail);

      // used to determine whether we have to add an arrow profile. when the 
      // current residue is the last strand residue, the arrow tip has to land 
      // exactly on the first slice of the next residue. Because we would like 
      // to have larger arrows we use multiple slices for the arrow (set to 
      // 3/4 of splineDetail).
      var arrowEndIndex = 
        Math.floor((iCentered + opts.arrowSkip) / opts.splineDetail);
      var drawArrow = false;
      var thisSS = trace.residueAt(residueIndex).ss();
      if (!opts.forceTube) {
        if (residueIndex !== prevResidueIndex) {
          // for helix and strand regions, we can't base the left vector
          // of the current residue on the previous one, since it determines
          // the orientation of the strand and helix profiles.
          //
          // frequently, the transition regions from coil to strand and helix
          // contain strong twists which severely hamper visual quality. there
          // is not problem however when transitioning from helix or strand
          // to coil or inside a helix or strand.
          //
          // to avoid these visual artifacts, we calculate the best fit between
          // the current normal and the normal "after" which gives us an offset
          // for stitching the two parts together.
          var prevSS = trace.residueAt(prevResidueIndex).ss();
          if (prevSS === 'C' && (thisSS === 'H' || thisSS === 'E')) {
            // we don't want to generate holes, so we have to make sure
            // the vertices of the rotated profile align with the previous
            // profile.
            vec3.set(normal2, normalSdiv[imox3] - sdiv[imox3],
                     normalSdiv[imox3 + 1] - sdiv[imox3 + 1],
                     normalSdiv[imox3 + 2] - sdiv[imox3 + 2]);
            vec3.normalize(normal2, normal2);
            var argAngle = 2 * Math.PI / (opts.arcDetail * 4);
            var signedAngle = geom.signedAngle(normal, normal2, tangent);
            offset = Math.round(signedAngle / argAngle);
            offset = (offset + opts.arcDetail * 4) % (opts.arcDetail * 4);
          }
        }
        // figure out if we have to draw an arrow head
        if (arrowEndIndex !== residueIndex && arrowEndIndex < trace.length()) {
          var nextSS = trace.residueAt(arrowEndIndex).ss();
          if (nextSS === 'C' && thisSS === 'E') {
            drawArrow = true;
          }
        }
      }
      // only set normal *after* handling the coil -> helix,strand
      // transition, since we depend on the normal of the previous step.
      vec3.set(normal, normalSdiv[3 * i] - sdiv[ix3],
               normalSdiv[ix3 + 1] - sdiv[ix3 + 1],
               normalSdiv[ix3 + 2] - sdiv[ix3 + 2]);
      vec3.normalize(normal, normal);
      vertStart = vertArray.numVerts();
      var objIndex = Math.floor((i + halfSplineDetail) / opts.splineDetail);
      var objId = objIds[Math.min(objIds.length - 1, objIndex)];
      _cartoonAddTube(vertArray, pos, normal, thisSS,
                      tangent, color, radius, false, opts, offset, objId);
      // in case we are running out of indices, start new vertex array and 
      // duplicate last slice. If we are on the last slice, we only need one 
      // additional vertex for the capping, otherwise we need a full slice 
      // worth of vertices.
      var additionalVerts = (i === e - 1) ? 1 : vertsPerSlice;
      if (vertArray.numVerts() + additionalVerts > vertArray.maxVerts()) {
        vertEnd = vertArray.numVerts();
        vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
        vertArray = meshGeom.vertArrayWithSpaceFor(additionalVerts);
        vertStart = 0;
        _cartoonAddTube(vertArray, pos, normal, thisSS,
                        tangent, color, radius, true, opts, 0, objId);
      }
      if (drawArrow) {
        vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
        // FIXME: arrow has completely wrong normals. Profile normals are 
        // generate perpendicular to the direction of the tube. The arrow 
        // normals are anti-parallel to the direction of the tube.
        _cartoonAddTube(vertArray, pos, normal, 'A', 
                        tangent, color, radius, false, opts, 0, objId);
        // We skip a few profiles to get a larger arrow.
        i += opts.arrowSkip;
      }
      vertEnd = vertArray.numVerts();
      if (i === e -1) {
        vertEnd += 1;
      }
      vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
      slice += 1;
      if (drawArrow) {
        slice += opts.arrowSkip;
      }
    }
    vertArray.addVertex(pos, tangent, color, objIds[objIds.length -1]);
    capTubeEnd(vertArray, vertStart, opts.arcDetail * 4);
    opts.float32Allocator.release(normals);
    opts.float32Allocator.release(positions);
    return traceIndex + 1;
  };
})();


var _renderSingleTrace = (function() {
  var rotation = mat3.create();
  var dir = vec3.create(), left = vec3.create(), up = vec3.create(),
      midPoint = vec3.create(), caPrevPos = vec3.create(),
      caThisPos = vec3.create();
  var colorOne = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  var colorTwo = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

  return function(meshGeom, vertAssoc, trace, traceIndex, opts) {
    if (trace.length() === 0) {
      return;
    }
    var idRange = opts.idPool.getContinuousRange(trace.length());
    meshGeom.addIdRange(idRange);
    opts.color.colorFor(trace.centralAtomAt(0), colorOne, 0);
    var numVerts = _traceNumVerts([trace], opts.protoSphere.numVerts(), 
                                  opts.protoCyl.numVerts());
    var remainingVerts = numVerts;
    var va = meshGeom.vertArrayWithSpaceFor(numVerts);
    var maxVerts = va.maxVerts();
    var vertStart = va.numVerts();
    trace.posAt(caPrevPos, 0);
    var idStart = idRange.nextId({ geom : meshGeom, 
                                   atom : trace.centralAtomAt(0),
                                   isTrace : true }), 
        idEnd = 0;
    opts.protoSphere.addTransformed(va, caPrevPos, opts.radius,
                                   colorOne, idStart);
    var vertEnd = null;
    vertAssoc.addAssoc(traceIndex, va, 0, vertStart, vertEnd);
    var colors = opts.float32Allocator.request(trace.length() * 4);
    colors[0] = colorOne[0];
    colors[1] = colorOne[1];
    colors[2] = colorOne[2];
    colors[3] = colorOne[3];
    var vertsPerIteration = opts.protoCyl.numVerts() + 
                            opts.protoSphere.numVerts();
    for (var i = 1; i < trace.length(); ++i) {
      idEnd = idRange.nextId({ geom : meshGeom, atom : trace.centralAtomAt(i),
                               isTrace : true });
      trace.posAt(caPrevPos, i - 1);
      trace.posAt(caThisPos, i);
      opts.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
      colors[i * 4 + 0] = colorTwo[0];
      colors[i * 4 + 1] = colorTwo[1];
      colors[i * 4 + 2] = colorTwo[2];
      colors[i * 4 + 3] = colorTwo[3];

      vec3.sub(dir, caThisPos, caPrevPos);
      var length = vec3.length(dir);

      vec3.scale(dir, dir, 1.0 / length);

      geom.buildRotation(rotation, dir, left, up, false);

      vec3.copy(midPoint, caPrevPos);
      vec3.add(midPoint, midPoint, caThisPos);
      vec3.scale(midPoint, midPoint, 0.5);
      // make sure there is enough space in the vertex array, if not request a 
      // new one.
      if (vertsPerIteration > (maxVerts - va.numVerts())) {
        va = meshGeom.vertArrayWithSpaceFor(remainingVerts);
      }
      remainingVerts -= vertsPerIteration;
      var endSphere = va.numVerts();
      opts.protoCyl.addTransformed(va, midPoint, length,
                                   opts.radius, rotation, colorOne,
                                   colorTwo, idStart, idEnd);
      vertEnd = va.numVerts();
      vertEnd = vertEnd - (vertEnd - endSphere) / 2;

      opts.protoSphere.addTransformed(va, caThisPos, opts.radius, 
                                      colorTwo, idEnd);
      idStart = idEnd;
      vertAssoc.addAssoc(traceIndex, va, i, vertStart, vertEnd);
      vertStart = vertEnd;
      vec3.copy(colorOne, colorTwo);
    }
    vertAssoc.setPerResidueColors(traceIndex, colors);
    vertAssoc.addAssoc(traceIndex, va, trace.length() - 1, vertStart,
                        va.numVerts());
  };
})();


return exports;
});
