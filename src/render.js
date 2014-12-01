// Copyright (c) 2013-2014 Marco Biasini
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

var render = (function() {
  "use strict";

  var exports = {};

  var R = 0.7071;
  var COIL_POINTS = [ -R, -R, 0, R, -R, 0, R, R, 0, -R, R, 0 ];

  var HELIX_POINTS = [
    -6 * R,
    -1.0 * R,
    0,
    6 * R,
    -1.0 * R,
    0,
    6 * R,
    1.0 * R,
    0,
    -6 * R,
    1.0 * R,
    0
  ];
  var ARROW_POINTS = [
    -10 * R,
    -1.0 * R,
    0,
    10 * R,
    -1.0 * R,
    0,
    10 * R,
    1.0 * R,
    0,
    -10 * R,
    1.0 * R,
    0
  ];

// performs an in-place smoothing over 3 consecutive positions.
var inplaceStrandSmoothing = (function() {
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
  geom.ortho(up, tangent);
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

var spheresForChain = (function() {
  var color = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

  return function(meshGeom, vertAssoc, options, chain) {
    var atomCount = chain.atomCount();
    var idRange = options.idPool.getContinuousRange(atomCount);
    var vertsPerSphere = options.protoSphere.numVerts();
    var indicesPerSphere = options.protoSphere.numIndices();
    var radius = 1.5 * options.radiusMultiplier;
    meshGeom.addIdRange(idRange);
    meshGeom.addChainVertArray(chain, vertsPerSphere*atomCount, 
                              indicesPerSphere*atomCount);
    chain.eachAtom(function(atom) {
      var va = meshGeom.vertArrayWithSpaceFor(vertsPerSphere);
      options.color.colorFor(atom, color, 0);
      var vertStart = va.numVerts();
      var objId = idRange.nextId({ geom: meshGeom, atom : atom });
      options.protoSphere.addTransformed(va, atom.pos(), radius, color, objId);
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });
  };
})();

exports.spheres = function(structure, gl, options) {
  console.time('spheres');
  var protoSphere = new ProtoSphere(options.sphereDetail, options.sphereDetail);
  options.protoSphere = protoSphere;
  var geom = new MeshGeom(gl, options.float32Allocator, options.uint16Allocator);
  var vertAssoc = new AtomVertexAssoc(structure, true);
  geom.addVertAssoc(vertAssoc);
  geom.setShowRelated(options.showRelated);
  options.color.begin(structure);
  structure.eachChain(function(chain) {
    spheresForChain(geom, vertAssoc, options, chain);
  });
  options.color.end(structure);
  console.timeEnd('spheres');
  return geom;
};


var ballsAndSticksForChain = (function() {
  var midPoint = vec3.create(), dir = vec3.create();
  var color = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  var left = vec3.create(), up = vec3.create();
  var rotation = mat3.create();
  return function(meshGeom, vertAssoc, options, chain) {
    // determine required number of vertices and indices for this chain
    var atomCount = chain.atomCount();
    var bondCount = 0;
    chain.eachAtom(function(a) { bondCount += a.bonds().length; });
    var numVerts = atomCount * options.protoSphere.numVerts() + 
                   bondCount * options.protoCyl.numVerts();
    var numIndices = atomCount * options.protoSphere.numIndices() + 
                     bondCount * options.protoCyl.numIndices();
    meshGeom.addChainVertArray(chain, numVerts, numIndices);
    var idRange = options.idPool.getContinuousRange(atomCount);
    meshGeom.addIdRange(idRange);
    // generate geometry for each atom
    chain.eachAtom(function(atom) {
      var atomVerts = options.protoSphere.numVerts() + 
                      atom.bondCount() * options.protoCyl.numVerts();
      var va = meshGeom.vertArrayWithSpaceFor(atomVerts);
      var vertStart = va.numVerts();
      var objId = idRange.nextId({ geom: meshGeom, atom : atom });

      options.color.colorFor(atom, color, 0);
      options.protoSphere.addTransformed(va, atom.pos(), options.radius, color,
                                         objId);
      atom.eachBond(function(bond) {
        bond.mid_point(midPoint);
        vec3.sub(dir, atom.pos(), midPoint);
        var length = vec3.length(dir);

        vec3.scale(dir, dir, 1.0/length);

        buildRotation(rotation, dir, left, up, false);

        vec3.add(midPoint, midPoint, atom.pos());
        vec3.scale(midPoint, midPoint, 0.5);
        options.protoCyl.addTransformed(va, midPoint, length, options.radius, 
                                        rotation, color, color, objId, objId);
      });
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(atom, va, vertStart, vertEnd);
    });
  };
})();

exports.ballsAndSticks = function(structure, gl, options) {
  console.time('ballsAndSticks');
  var vertAssoc = new AtomVertexAssoc(structure, true);
  var protoSphere = new ProtoSphere(options.sphereDetail, options.sphereDetail);
  var protoCyl = new ProtoCylinder(options.arcDetail);
  options.protoSphere = protoSphere;
  options.protoCyl = protoCyl;
  var meshGeom = new MeshGeom(gl, options.float32Allocator, 
                              options.uint16Allocator);
  meshGeom.addVertAssoc(vertAssoc);
  meshGeom.setShowRelated(options.showRelated);
  options.color.begin(structure);
  structure.eachChain(function(chain) {
    ballsAndSticksForChain(meshGeom, vertAssoc, options, chain);
  });
  options.color.end(structure);
  console.timeEnd('ballsAndSticks');
  return meshGeom;
};

var linesForChain = (function () {
  var mp = vec3.create();
  var clr = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  return function(lineGeom, vertAssoc, chain, options) {
    var lineCount = 0;
    var atomCount = chain.atomCount();
    var idRange = options.idPool.getContinuousRange(atomCount);
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
          options.color.colorFor(atom, clr, 0);
          va.addLine(atom.pos(), clr, mp, clr, objId, objId);
        });
      } else {
        var cs = 0.2;
        var pos = atom.pos();
        options.color.colorFor(atom, clr, 0);
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


exports.lines = function(structure, gl, options) {
  console.time('lines');
  var vertAssoc = new AtomVertexAssoc(structure, true);
  options.color.begin(structure);
  var lineCount = 0;
  var lineGeom = new LineGeom(gl, options.float32Allocator);
  lineGeom.setLineWidth(options.lineWidth);
  var va = lineGeom.vertArray();
  lineGeom.addVertAssoc(vertAssoc);
  lineGeom.setShowRelated(options.showRelated);
  structure.eachChain(function(chain) {
    linesForChain(lineGeom, vertAssoc, chain, options);
  });
  options.color.end(structure);
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
                                trace, options) {
    vertAssoc.addAssoc(traceIndex, va, 0, va.numVerts(),
                        va.numVerts() + 1);

    var colors = options.float32Allocator.request(trace.length() * 4);
    var idRange = options.idPool.getContinuousRange(trace.length());
    var idOne = idRange.nextId({ geom: lineGeom, 
                                 atom : trace.centralAtomAt(0) });
    var idTwo;
    lineGeom.addIdRange(idRange);
    for (var i = 1; i < trace.length(); ++i) {

      options.color.colorFor(trace.centralAtomAt(i - 1), colorOne, 0);
      colors[(i - 1) * 4 + 0] = colorOne[0];
      colors[(i - 1) * 4 + 1] = colorOne[1];
      colors[(i - 1) * 4 + 2] = colorOne[2];
      colors[(i - 1) * 4 + 3] = colorOne[3];
      options.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
      trace.posAt(posOne, i - 1);
      trace.posAt(posTwo, i);
      idTwo = idRange.nextId({ 
        geom: lineGeom, atom : trace.centralAtomAt(i)});
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

var lineTraceForChain = function(lineGeom, vertAssoc, options, traceIndex, 
                                 chain) {
  var backboneTraces =  chain.backboneTraces();
  var numVerts = _lineTraceNumVerts(backboneTraces);
  var va = lineGeom.addChainVertArray(chain, numVerts);
  for (var i = 0; i < backboneTraces.length; ++i) {
    traceIndex = makeLineTrace(lineGeom, vertAssoc, va, traceIndex, 
                               backboneTraces[i], options);
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
exports.lineTrace = function(structure, gl, options) {


  console.time('lineTrace');
  var vertAssoc = new TraceVertexAssoc(structure, 1, true);
  options.color.begin(structure);
  var chains = structure.chains();
  var lineGeom = new LineGeom(gl, options.float32Allocator);
  lineGeom.setLineWidth(options.lineWidth);
  var traceIndex = 0;
  structure.eachChain(function(chain) { 
    traceIndex = lineTraceForChain(lineGeom, vertAssoc, options, 
                                   traceIndex, chain);
  });
  lineGeom.addVertAssoc(vertAssoc);
  lineGeom.setShowRelated(options.showRelated);
  options.color.end(structure);
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

var slineMakeTrace = (function(trace) {
  var posOne = vec3.create(), posTwo = vec3.create();
  var colorOne = vec4.fromValues(0.0, 0.0, 0.0, 1.0), colorTwo = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  return function(lineGeom, vertAssoc, va, options, traceIndex, trace) {
    var firstSlice = trace.fullTraceIndex(0);
    var positions = options.float32Allocator.request(trace.length() * 3);
    var colors = options.float32Allocator.request(trace.length() * 4);
    var objIds = [];
    var i, e;
    var idRange = options.idPool.getContinuousRange(trace.length());
    lineGeom.addIdRange(idRange);
    for (i = 0; i < trace.length(); ++i) {
      var atom = trace.centralAtomAt(i);
      trace.smoothPosAt(posOne, i, options.strength);
      options.color.colorFor(atom, colors, 4 * i);
      positions[i * 3] = posOne[0];
      positions[i * 3 + 1] = posOne[1];
      positions[i * 3 + 2] = posOne[2];
      objIds.push(idRange.nextId({ geom : lineGeom, atom : atom }));
    }
    var idStart = objIds[0], idEnd = 0;
    var sdiv = geom.catmullRomSpline(positions, trace.length(),
                                     options.splineDetail, options.strength,
                                     false, options.float32Allocator);
    var interpColors = interpolateColor(colors, options.splineDetail);
    var vertStart = va.numVerts();
    vertAssoc.addAssoc(traceIndex, va, firstSlice, vertStart, vertStart + 1);
    var halfSplineDetail = Math.floor(options.splineDetail / 2);
    var steps = geom.catmullRomSplineNumPoints(trace.length(),
                                               options.splineDetail, false);
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
      var index = Math.floor((i + halfSplineDetail) / options.splineDetail);
      idEnd = objIds[Math.min(objIds.length - 1, index)];
      va.addLine(posOne, colorOne, posTwo, colorTwo, idStart, idEnd);
      idStart = idEnd;
      var vertEnd = va.numVerts();
      vertAssoc.addAssoc(traceIndex, va, firstSlice + i, vertEnd - 1,
                         vertEnd + ((i === trace.length - 1) ? 0 : 1));
    }
    vertAssoc.setPerResidueColors(traceIndex, colors);
    options.float32Allocator.release(positions);
    options.float32Allocator.release(sdiv);
    return traceIndex + 1;
  };
})();

var slineForChain = function(lineGeom, vertAssoc, options, chain, traceIndex) {
  var backboneTraces = chain.backboneTraces();
  var numVerts = _slineNumVerts(backboneTraces, options.splineDetail);
  var va = lineGeom.addChainVertArray(chain, numVerts);
  for (var i = 0; i < backboneTraces.length; ++i) {
    traceIndex = slineMakeTrace(lineGeom, vertAssoc, va, options, 
                                traceIndex, backboneTraces[i]);
  }
  return traceIndex;
};

exports.sline = function(structure, gl, options) {
  console.time('sline');
  options.color.begin(structure);
  var vertAssoc =
      new TraceVertexAssoc(structure, options.splineDetail, 1, true);
  var lineGeom = new LineGeom(gl, options.float32Allocator);
  lineGeom.setLineWidth(options.lineWidth);
  lineGeom.setShowRelated(options.showRelated);
  var traceIndex = 0;
  structure.eachChain(function(chain) {
    traceIndex = slineForChain(lineGeom, vertAssoc, options, chain, traceIndex);
  });
  lineGeom.addVertAssoc(vertAssoc);
  options.color.end(structure);
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

var traceForChain = function(meshGeom, vertAssoc, options, traceIndex, chain) {
  // determine number of verts required to render the traces
  var traces = chain.backboneTraces();
  var numVerts = _traceNumVerts(traces, options.protoSphere.numVerts(),
                                options.protoCyl.numVerts());
  var numIndices = _traceNumIndices(traces, options.protoSphere.numIndices(),
                                    options.protoCyl.numIndices());
  meshGeom.addChainVertArray(chain, numVerts, numIndices);
  for (var ti = 0; ti < traces.length; ++ti) {
    _renderSingleTrace(meshGeom, vertAssoc, traces[ti], traceIndex, options);
    traceIndex++;
  }
  return traceIndex;
};

exports.trace = function(structure, gl, options) {
  console.time('trace');

  options.protoCyl = new ProtoCylinder(options.arcDetail);
  options.protoSphere =
      new ProtoSphere(options.sphereDetail, options.sphereDetail);

  var meshGeom = new MeshGeom(gl, options.float32Allocator, 
                              options.uint16Allocator);
  var vertAssoc = new TraceVertexAssoc(structure, 1, true);
  meshGeom.addVertAssoc(vertAssoc);
  meshGeom.setShowRelated(options.showRelated);

  options.color.begin(structure);
  var traceIndex = 0;
  structure.eachChain(function(chain) {
    traceIndex = traceForChain(meshGeom, vertAssoc, options, traceIndex, chain);
  });
  options.color.end(structure);

  console.timeEnd('trace');
  return meshGeom;
};

// calculates the number of vertices required for the cartoon and
// tube render styles
var _cartoonNumVerts = function(traces, vertsPerSlice, splineDetail) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += ((traces[i].length() - 1) * splineDetail + 1) * vertsPerSlice;
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

// creates the capped cylinders for DNA/RNA pointing towards the end of the bases.
var _addNucleotideSticks = (function() {
  var rotation = mat3.create();
  var up = vec3.create(), left = vec3.create(), dir = vec3.create();
  var center = vec3.create();
  var color = vec4.create();
  return function(meshGeom, vertAssoc, traces, options) {
    var radius = options.radius * 1.8;
    for (var i = 0; i < traces.length; ++i) {
      var trace = traces[i];
      var idRange = options.idPool.getContinuousRange(trace.length());
      for (var j = 0; j <  trace.length(); ++j) {
        var atomVerts = options.protoCyl.numVerts();
        var va = meshGeom.vertArrayWithSpaceFor(atomVerts);
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
        var objId = idRange.nextId({ geom: meshGeom, atom : endAtom });
        vec3.add(center, startAtom.pos(), endAtom.pos());
        vec3.scale(center, center, 0.5);

        options.color.colorFor(endAtom, color, 0);
        vec3.sub(dir, endAtom.pos(), startAtom.pos());
        var length = vec3.length(dir);
        vec3.scale(dir, dir, 1.0/length);
        buildRotation(rotation, dir, left, up, false);

        options.protoCyl.addTransformed(va, center, length, radius, 
                                        rotation, color, color, objId, objId);
        options.protoSphere.addTransformed(va, endAtom.pos(), radius, 
                                           color, objId);
        options.protoSphere.addTransformed(va, startAtom.pos(), radius, 
                                           color, objId);
        var vertEnd = va.numVerts();
        vertAssoc.addAssoc(endAtom, va, vertStart, vertEnd);
      }
    }
  };
})();

// generates the mesh geometry for displaying a single chain as either cartoon
// or tube (options.forceTube === true).
var cartoonForChain = function(meshGeom, vertAssoc, nucleotideAssoc, options, 
                               traceIndex, chain) {
  var traces = chain.backboneTraces();
  var numVerts = _cartoonNumVerts(traces, options.arcDetail * 4,
                                  options.splineDetail);
  var numIndices = _cartoonNumIndices(traces, options.arcDetail * 4,
                                      options.splineDetail);
  // figure out which of the traces consist of nucleic acids. They require additional 
  // space for rendering the sticks.
  var nucleicAcidTraces = [];
  var vertForBaseSticks = options.protoCyl.numVerts() + 
    2 * options.protoSphere.numVerts();
  var indicesForBaseSticks = options.protoCyl.numIndices() + 
    2 * options.protoSphere.numIndices();
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
    _cartoonForSingleTrace(meshGeom, vertAssoc, traces[ti], traceIndex, 
                           options);
    traceIndex++;
  }
  _addNucleotideSticks(meshGeom, nucleotideAssoc, nucleicAcidTraces, options);
  return traceIndex;
};

exports.cartoon = function(structure, gl, options) {
  console.time('cartoon');
  options.arrowSkip = Math.floor(options.splineDetail * 3 / 4);
  options.coilProfile = new TubeProfile(COIL_POINTS, options.arcDetail, 1.0);
  options.helixProfile = new TubeProfile(HELIX_POINTS, options.arcDetail, 0.1);
  options.strandProfile = new TubeProfile(HELIX_POINTS, options.arcDetail, 0.1);
  options.arrowProfile = new TubeProfile(ARROW_POINTS, options.arcDetail, 0.1);
  options.protoCyl = new ProtoCylinder(options.arcDetail * 4);
  options.protoSphere = new ProtoSphere(options.arcDetail * 4, options.arcDetail * 4);

  var meshGeom = new MeshGeom(gl, options.float32Allocator, 
                              options.uint16Allocator);
  var vertAssoc = new TraceVertexAssoc(structure, options.splineDetail, true);
  meshGeom.addVertAssoc(vertAssoc);
  meshGeom.setShowRelated(options.showRelated);

  options.color.begin(structure);

  var traceIndex = 0;
  // the following vert-assoc is for rendering of DNA/RNA. Create vertex assoc 
  // from N1/N3 atoms only, this will speed up recoloring later on, which when 
  // performed on the complete structure, is slower than recalculating the 
  // whole geometry.
  var selection = structure.select({anames: ['N1', 'N3']});
  var nucleotideAssoc = new AtomVertexAssoc(selection, true);
  meshGeom.addVertAssoc(nucleotideAssoc);
  structure.eachChain(function(chain) {
    traceIndex = cartoonForChain(meshGeom, vertAssoc, nucleotideAssoc, options, 
                                 traceIndex, chain);
  });

  options.color.end(structure);
  console.timeEnd('cartoon');
  return meshGeom;
};

exports.surface = (function() {
  var pos = vec3.create(), normal = vec3.create(), 
      color = vec4.fromValues(0.8, 0.8, 0.8, 1.0);
  return function(data, gl, options) {
    var offset = 0;
    var version = data.getUint32(0);
    offset += 4;
    var numVerts = data.getUint32(offset);
    offset += 4;
    var vertexStride = 4 * 6;
    var facesDataStart = vertexStride * numVerts + offset;
    var numFaces = data.getUint32(facesDataStart);
    var meshGeom = new MeshGeom(gl, options.float32Allocator,
                                options.uint16Allocator);
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

  return function(vertArray, pos, left, ss, tangent, color, radius, first, options, 
                  offset, objId) {
    var prof = options.coilProfile;
    if (ss !== 'C' && !options.forceTube) {
      if (ss === 'H') {
        prof = options.helixProfile;
      } else if (ss === 'E') {
        prof = options.strandProfile;
      } else if (ss === 'A') {
        prof = options.arrowProfile;
      } 
    } else {
      if (first) {
        geom.ortho(left, tangent);
      } else {
        vec3.cross(left, up, tangent);
      }
    }

    buildRotation(rotation, tangent, left, up, true);
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
                  options) {
    var strand_start = null, strand_end = null;
    var trace_length = trace.length();
    vec3.set(lastNormal, 0.0, 0.0, 0.0);
    for (var i = 0; i < trace_length; ++i) {
      objIds.push(pool.nextId({ geom : meshGeom, 
                                atom : trace.centralAtomAt(i)}));
      trace.smoothPosAt(pos, i, options.strength);
      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];

      trace.smoothNormalAt(normal, i, options.strength);

      var atom = trace.centralAtomAt(i);
      options.color.colorFor(atom, colors, i * 4);

      if (vec3.dot(normal, lastNormal) < 0) {
        vec3.scale(normal, normal, -1);
      }
      if (trace.residueAt(i).ss() === 'E' && !options.forceTube) {
        if (strand_start === null) {
          strand_start = i;
        }
        strand_end = i;
      }
      if (trace.residueAt(i).ss() === 'C' && strand_start !== null) {
        inplaceStrandSmoothing(positions, strand_start, strand_end, trace_length);
        inplaceStrandSmoothing(normals, strand_start, strand_end, trace_length);
        strand_start = null;
        strand_end = null;
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

  var tangent = vec3.create(), pos = vec3.create(), left = vec3.create(),
      color = vec4.fromValues(0.0, 0.0, 0.0, 1.0), normal = vec3.create(), normal2 = vec3.create(),
      rot = mat3.create();

  return function(meshGeom, vertAssoc, trace, traceIndex, options) {
    var numVerts =
        _cartoonNumVerts([trace], options.arcDetail * 4, options.splineDetail);

    var positions = options.float32Allocator.request(trace.length() * 3);
    var colors = options.float32Allocator.request(trace.length() * 4);
    var normals = options.float32Allocator.request(trace.length() * 3);

    var objIds = [];
    var idRange = options.idPool.getContinuousRange(trace.length());
    _colorPosNormalsFromTrace(meshGeom, trace, colors, positions, normals, 
                              objIds, idRange, options);
    meshGeom.addIdRange(idRange);
    var vertArray = meshGeom.vertArrayWithSpaceFor(numVerts);
    var sdiv = geom.catmullRomSpline(positions, trace.length(),
                                      options.splineDetail, options.strength,
                                      false, options.float32Allocator);
    var normalSdiv = geom.catmullRomSpline(
        normals, trace.length(), options.splineDetail, options.strength, false,
        options.float32Allocator);
    vertAssoc.setPerResidueColors(traceIndex, colors);
    var radius = options.radius * (trace.residueAt(0).isAminoacid() ? 1.0 : 1.8);
    var interpColors = interpolateColor(colors, options.splineDetail);
    // handle start of trace. this could be moved inside the for-loop, but
    // at the expense of a conditional inside the loop. unrolling is
    // slightly faster.
    //
    // we repeat the following steps for the start, central section and end
    // of the profile: (a) assign position, normal, tangent and color, (b)
    // add tube (or rectangular profile for helices and strands).
    vec3.set(tangent, sdiv[3] - sdiv[0], sdiv[4] - sdiv[1], sdiv[5] - sdiv[2]);
    vec3.set(pos, sdiv[0], sdiv[1], sdiv[2]);
    vec3.set(normal, normalSdiv[0] - sdiv[0], normalSdiv[1] - sdiv[0],
              normalSdiv[2] - sdiv[2]);
    vec3.normalize(tangent, tangent);
    vec3.normalize(normal, normal);
    vec4.set(color, interpColors[0], interpColors[1], interpColors[2], 
             interpColors[3] );

    var vertStart = vertArray.numVerts();
    vertArray.addVertex(pos, [-tangent[0], -tangent[1], -tangent[2]], 
                        color, objIds[0]);
    _cartoonAddTube(vertArray, pos, normal, trace.residueAt(0), tangent,
                    color, radius, true, options, 0, objIds[0]);
    capTubeStart(vertArray, vertStart, options.arcDetail * 4);
    var vertEnd = vertArray.numVerts();
    var slice = 0;
    vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
    slice += 1;
    var halfSplineDetail = Math.floor(options.splineDetail / 2);

    // handle the bulk of the trace
    var steps = geom.catmullRomSplineNumPoints(trace.length(),
                                                options.splineDetail, false);

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
      var residueIndex = Math.floor(i / options.splineDetail);
      var prevResidueIndex = Math.floor((i - 1) / options.splineDetail);

      // used to determine whether we have to add an arrow profile. when the 
      // current residue is the last strand residue, the arrow tip has to land 
      // exactly on the first slice of the next residue. Because we would like 
      // to have larger arrows we use multiple slices for the arrow (set to 
      // 3/4 of splineDetail).
      var arrowEndIndex = Math.floor((i + options.arrowSkip) / options.splineDetail);
      var drawArrow = false;
      var thisSS = trace.residueAt(residueIndex).ss();
      if (!options.forceTube) {
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
            var argAngle = 2 * Math.PI / (options.arcDetail * 4);
            var signedAngle = geom.signedAngle(normal, normal2, tangent);
            offset = Math.round(signedAngle / argAngle);
            offset = (offset + options.arcDetail * 4) % (options.arcDetail * 4);
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
      var objIndex = Math.floor((i + halfSplineDetail) / options.splineDetail);
      var objId = objIds[Math.min(objIds.length - 1, objIndex)];
      _cartoonAddTube(vertArray, pos, normal, thisSS,
                      tangent, color, radius, false, options, offset, objId);
      if (drawArrow) {
        vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
        // FIXME: arrow has completely wrong normals. Profile normals are 
        // generate perpendicular to the direction of the tube. The arrow 
        // normals are anti-parallel to the direction of the tube.
        _cartoonAddTube(vertArray, pos, normal, 'A', 
                        tangent, color, radius, false, options, 0, objId);
        // We skip a few profiles to get a larger arrow.
        i += options.arrowSkip;
      }
      vertEnd = vertArray.numVerts();
      if (i === e -1) {
        vertEnd += 1;
      }
      vertAssoc.addAssoc(traceIndex, vertArray, slice, vertStart, vertEnd);
      slice += 1;
      if (drawArrow) {
        slice += options.arrowSkip;
      }
    }
    vertArray.addVertex(pos, tangent, color, objIds[objIds.length -1]);
    capTubeEnd(vertArray, vertStart, options.arcDetail * 4);
    options.float32Allocator.release(normals);
    options.float32Allocator.release(positions);
  };
})();


var _renderSingleTrace = (function() {
  var rotation = mat3.create();
  var dir = vec3.create(), left = vec3.create(), up = vec3.create(),
      midPoint = vec3.create(), caPrevPos = vec3.create(),
      caThisPos = vec3.create();
  var colorOne = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
  var colorTwo = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

  return function(meshGeom, vertAssoc, trace, traceIndex, options) {
    if (trace.length() === 0) {
      return;
    }
    var idRange = options.idPool.getContinuousRange(trace.length());
    meshGeom.addIdRange(idRange);
    options.color.colorFor(trace.centralAtomAt(0), colorOne, 0);
    var numVerts = _traceNumVerts([trace], options.protoSphere.numVerts(), 
                                  options.protoCyl.numVerts());
    var va = meshGeom.vertArrayWithSpaceFor(numVerts);
    var vertStart = va.numVerts();
    trace.posAt(caPrevPos, 0);
    var idStart = idRange.nextId({ geom : meshGeom, 
                                   atom : trace.centralAtomAt(0)}), 
        idEnd = 0;
    options.protoSphere.addTransformed(va, caPrevPos, options.radius,
                                       colorOne, idStart);
    var vertEnd = null;
    vertAssoc.addAssoc(traceIndex, va, 0, vertStart, vertEnd);
    var colors = options.float32Allocator.request(trace.length() * 4);
    colors[0] = colorOne[0];
    colors[1] = colorOne[1];
    colors[2] = colorOne[2];
    colors[3] = colorOne[3];
    for (var i = 1; i < trace.length(); ++i) {
      idEnd = idRange.nextId({ geom : meshGeom, atom : trace.centralAtomAt(i)});
      trace.posAt(caPrevPos, i - 1);
      trace.posAt(caThisPos, i);
      options.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
      colors[i * 4 + 0] = colorTwo[0];
      colors[i * 4 + 1] = colorTwo[1];
      colors[i * 4 + 2] = colorTwo[2];
      colors[i * 4 + 3] = colorTwo[3];

      vec3.sub(dir, caThisPos, caPrevPos);
      var length = vec3.length(dir);

      vec3.scale(dir, dir, 1.0 / length);

      buildRotation(rotation, dir, left, up, false);

      vec3.copy(midPoint, caPrevPos);
      vec3.add(midPoint, midPoint, caThisPos);
      vec3.scale(midPoint, midPoint, 0.5);
      var endSphere = va.numVerts();
      options.protoCyl.addTransformed(va, midPoint, length,
                                      options.radius, rotation, colorOne,
                                      colorTwo, idStart, idEnd);
      vertEnd = va.numVerts();
      vertEnd = vertEnd - (vertEnd - endSphere) / 2;

      options.protoSphere.addTransformed(va, caThisPos, options.radius,
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
})();

if(typeof(exports) !== 'undefined') {
  module.exports = render;
}
