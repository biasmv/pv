// Copyright (c) 2013 Marco Biasini
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
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
var COIL_POINTS = [
  -R, -R, 0,
   R, -R, 0,
   R, R, 0,
  -R,  R, 0
];


var HELIX_POINTS = [
  -6*R, -1.0*R, 0,
   6*R, -1.0*R, 0,
   6*R, 1.0*R, 0,
  -6*R,  1.0*R, 0
];

// performs an in-place smoothing over 3 consecutive positions.
var inplaceSmooth = (function() {
  var bf = vec3.create(), af = vec3.create(), cf = vec3.create();
  return function(positions, from, to) {
    vec3.set(bf, positions[3*(from-1)], positions[3*(from-1)+1], 
             positions[3*(from-1)+2]);
    vec3.set(cf, positions[3*from], positions[3*from+1], positions[3*from+2]);
    for (var i = from+1; i < to; ++i) {
      vec3.set(af, positions[3*i], positions[3*i+1], positions[3*i+2]);
      positions[3*(i-1)]   = af[0]*0.25 + cf[0]*0.50 + bf[0]*0.25;
      positions[3*(i-1)+1] = af[1]*0.25 + cf[1]*0.50 + bf[1]*0.25;
      positions[3*(i-1)+2] = af[2]*0.25 + cf[2]*0.50 + bf[2]*0.25;
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
    if (use_left_hint) {
      vec3.cross(up, tangent, left);
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
  };
})();

exports.spheres = function(structure, gl, options) {
  console.time('spheres');
  var clr = vec3.create();
  var protoSphere = new ProtoSphere(options.sphereDetail, options.sphereDetail);
  var atomCount = structure.atomCount();
  var geom = new MeshGeom(gl, atomCount*protoSphere.numVerts());
  protoSphere.numVerts();
  var vertAssoc = new AtomVertexAssoc(structure, true);
  options.color.begin(structure);
  var idRange = options.idPool.getContinuousRange(atomCount);
  geom.addIdRange(idRange);
  structure.eachAtom(function(atom) {
    options.color.colorFor(atom, clr, 0);
    var vertStart = geom.numVerts();
    var objId = idRange.nextId(atom);
    protoSphere.addTransformed(geom, atom.pos(), 1.5, clr, objId);
    var vertEnd = geom.numVerts();
    vertAssoc.addAssoc(atom, vertStart, vertEnd);
  });
  geom.setVertAssoc(vertAssoc);
  console.timeEnd('spheres');
  options.color.end(structure);
  return geom;
};

exports.ballsAndSticks = (function() {
  var mp = vec3.create(), dir = vec3.create();
  var clr = vec3.create();
  var left = vec3.create(), up = vec3.create();
  var rotation = mat3.create();

  return function(structure, gl, options) {
    console.time('ballsAndSticks');
    var vertAssoc = new AtomVertexAssoc(structure, true);
    var protoSphere = new ProtoSphere(options.sphereDetail, options.sphereDetail);
    var protoCyl = new ProtoCylinder(options.arcDetail);
    var atomCount = structure.atomCount();
    var bondCount = 0; 
    structure.eachAtom(function(a) { bondCount+= a.bonds().length; });
    console.log(bondCount);
    var numVerts = atomCount*protoSphere.numVerts()+
                   bondCount*protoCyl.numVerts();
    var meshGeom = new MeshGeom(gl, numVerts);
    var idRange = options.idPool.getContinuousRange(atomCount);
    meshGeom.addIdRange(idRange);
    options.color.begin(structure);
    structure.eachAtom(function(atom) {
      var objId = idRange.nextId(atom);
      var vertStart = meshGeom.numVerts();
      options.color.colorFor(atom, clr, 0);
      protoSphere.addTransformed(meshGeom, atom.pos(), options.radius, clr,
                                 objId);
      atom.eachBond(function(bond) {
        bond.mid_point(mp); 
        vec3.sub(dir, atom.pos(), mp);
        var length = vec3.length(dir);

        vec3.scale(dir, dir, 1.0/length);

        buildRotation(rotation, dir, left, up, false);

        vec3.add(mp, mp, atom.pos());
        vec3.scale(mp, mp, 0.5);
        protoCyl.addTransformed(meshGeom, mp, length, options.radius, rotation, 
                                clr, clr, objId);
      });
      var vertEnd = meshGeom.numVerts();
      vertAssoc.addAssoc(atom, vertStart, vertEnd);
    });
    meshGeom.setVertAssoc(vertAssoc);
    options.color.end(structure);
    console.timeEnd('ballsAndSticks');
    return meshGeom;
  };
})();

exports.lines = function(structure, gl, options) {
  console.time('lines');
  var mp = vec3.create();
  var clr = vec3.create();
  var vertAssoc = new AtomVertexAssoc(structure, true);
  options.color.begin(structure);
  var atomCount = structure.atomCount();
  var lineCount = 0;
  structure.eachAtom(function(atom) { 
    var numBonds = atom.bonds().length;
    if (numBonds) {
      lineCount += numBonds;
    } else {
      lineCount += 3;
    }
  });
  var lineGeom = new LineGeom(gl, lineCount*2);
  lineGeom.setLineWidth(options.lineWidth);
  var idRange = options.idPool.getContinuousRange(atomCount);
  lineGeom.addIdRange(idRange);
  structure.eachAtom(function(atom) {
    // for atoms without bonds, we draw a small cross, otherwise these atoms 
    // would be invisible on the screen.
    var vertStart = lineGeom.numVerts();
    var objId = idRange.nextId(atom);
    if (atom.bonds().length) {
      atom.eachBond(function(bond) {
        bond.mid_point(mp); 
        options.color.colorFor(atom, clr, 0);
        lineGeom.addLine(atom.pos(), clr, mp, clr, objId, objId);
      });
    } else {
      var cs = 0.2;
      var pos = atom.pos();
      options.color.colorFor(atom, clr, 0);
      lineGeom.addLine([pos[0]-cs, pos[1], pos[2]], clr, 
                        [pos[0]+cs, pos[1], pos[2]], clr, objId, objId);
      lineGeom.addLine([pos[0], pos[1]-cs, pos[2]], clr, 
                        [pos[0], pos[1]+cs, pos[2]], clr, objId, objId);
      lineGeom.addLine([pos[0], pos[1], pos[2]-cs], clr, 
                        [pos[0], pos[1], pos[2]+cs], clr, objId, objId);
    }
    var vertEnd = lineGeom.numVerts();
    vertAssoc.addAssoc(atom, vertStart, vertEnd);
  });
  lineGeom.setVertAssoc(vertAssoc);
  options.color.end(structure);
  console.timeEnd('lines');
  return lineGeom;
};

var _lineTraceNumVerts = function(traces) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += 2* (traces[i].length()-1);
  }
  return numVerts;
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
exports.lineTrace = (function() {
  
  var colorOne = vec3.create(), colorTwo = vec3.create();
  var posOne = vec3.create(), posTwo = vec3.create();
  
  return function(structure, gl, options) {
    console.time('lineTrace');
    var vertAssoc = new TraceVertexAssoc(structure, 1, true);
    options.color.begin(structure);
    var chains = structure.chains();
    var traceIndex = 0;
    var numVerts = 0; 
    for (var ci = 0; ci < chains.length; ++ci) {
      numVerts += _lineTraceNumVerts(chains[ci].backboneTraces());
    }
    var lineGeom = new LineGeom(gl, numVerts);
    lineGeom.setLineWidth(options.lineWidth);
    function makeLineTrace(trace) {
      vertAssoc.addAssoc(traceIndex, 0, lineGeom.numVerts(), 
                        lineGeom.numVerts()+1);
      var colors = new Float32Array(trace.length()*3);
      var idRange = options.idPool.getContinuousRange(trace.length());
      var idOne = idRange.nextId(trace.residueAt(0)), idTwo;
      lineGeom.addIdRange(idRange);
      for (var i = 1; i < trace.length(); ++i) {
        options.color.colorFor(trace.centralAtomAt(i-1), colorOne, 0);
        colors[(i-1)*3] = colorOne[0]; colors[(i-1)*3+1] = colorOne[1];
        colors[(i-1)*3+2] = colorOne[2];
        options.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
        trace.posAt(posOne, i-1);
        trace.posAt(posTwo, i);
        idTwo = idRange.nextId(trace.residueAt(i));

        lineGeom.addLine(posOne, colorOne, posTwo, colorTwo, 
                         idOne, idTwo);
        idOne = idTwo;
        idTwo = null;
        var vertEnd = lineGeom.numVerts();
        vertAssoc.addAssoc(traceIndex, i, vertEnd-1, 
                          vertEnd+((i === trace.length()-1) ? 0 : 1));
      }
      colors[trace.length()*3-3] = colorTwo[0];
      colors[trace.length()*3-2] = colorTwo[1];
      colors[trace.length()*3-1] = colorTwo[2];
      vertAssoc.setPerResidueColors(traceIndex, colors);
      traceIndex += 1;
    }
    for (ci = 0; ci < chains.length; ++ci) {
      var chain = chains[ci];
      chain.eachBackboneTrace(makeLineTrace);
    }
    lineGeom.setVertAssoc(vertAssoc);
    options.color.end(structure);
    console.timeEnd('lineTrace');
    return lineGeom;
  };

})();

var _slineNumVerts = function(traces, splineDetail) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += 2*(splineDetail*(traces[i].length()-1)+1);
  }
  return numVerts;
};

exports.sline = function(structure, gl, options) {
  console.time('sline');
  options.color.begin(structure);
  var vertAssoc = new TraceVertexAssoc(structure, options.splineDetail, 1, true);
  var posOne = vec3.create(), posTwo = vec3.create();
  var colorOne = vec3.create(), colorTwo = vec3.create();
  var chains = structure.chains();
  var i, e, traceIndex = 0;
  var numVerts = 0;
  for (var ci = 0; ci < chains.length; ++ci) {
    numVerts += _slineNumVerts(chains[ci].backboneTraces(), options.splineDetail);
  }
  var lineGeom = new LineGeom(gl, numVerts);
  lineGeom.setLineWidth(options.lineWidth);
  function makeTrace(trace) {
    var firstSlice = trace.fullTraceIndex(0);
    var positions = new Float32Array(trace.length()*3);
    var colors = new Float32Array(trace.length()*3);
    var objIds = [];
    var idRange = options.idPool.getContinuousRange(trace.length());
    lineGeom.addIdRange(idRange);

    for (i = 0; i < trace.length(); ++i) {
      var atom = trace.centralAtomAt(i);
      trace.smoothPosAt(posOne, i, options.strength);
      options.color.colorFor(atom, colors, 3*i);
      positions[i*3] = posOne[0];
      positions[i*3+1] = posOne[1];
      positions[i*3+2] = posOne[2];
      objIds.push(idRange.nextId(atom.residue()));
    }
    var idStart = objIds[0], idEnd = 0;
    vertAssoc.setPerResidueColors(traceIndex, colors);
    var sdiv = geom.catmullRomSpline(positions, options.splineDetail, 
                                      options.strength, false);
    var interpColors = interpolateColor(colors, options.splineDetail);
    var vertStart = lineGeom.numVerts();
    vertAssoc.addAssoc(traceIndex, firstSlice,
                       vertStart, vertStart+1);
    var halfSplineDetail = Math.floor(options.splineDetail/2);
    for (i = 1, e = sdiv.length/3; i < e; ++i) {
      posOne[0] = sdiv[3*(i-1)];
      posOne[1] = sdiv[3*(i-1)+1];
      posOne[2] = sdiv[3*(i-1)+2];
      posTwo[0] = sdiv[3*(i-0)];
      posTwo[1] = sdiv[3*(i-0)+1];
      posTwo[2] = sdiv[3*(i-0)+2];

      colorOne[0] = interpColors[3*(i-1)];
      colorOne[1] = interpColors[3*(i-1)+1];
      colorOne[2] = interpColors[3*(i-1)+2];
      colorTwo[0] = interpColors[3*(i-0)];
      colorTwo[1] = interpColors[3*(i-0)+1];
      colorTwo[2] = interpColors[3*(i-0)+2];
      var index = Math.floor((i+halfSplineDetail)/options.splineDetail);
      idEnd = objIds[Math.min(objIds.length-1, index)];
      lineGeom.addLine(posOne, colorOne, posTwo, colorTwo, idStart, idEnd);
      idStart = idEnd;
      var vertEnd = lineGeom.numVerts();
      vertAssoc.addAssoc(traceIndex, firstSlice+i, vertEnd-1, 
                         vertEnd+((i === trace.length-1) ? 0 : 1));
    }
    traceIndex += 1;
  }
  for (ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    chain.eachBackboneTrace(makeTrace);
  }
  lineGeom.setVertAssoc(vertAssoc);
  options.color.end(structure);
  console.timeEnd('sline');
  return lineGeom;
};

exports.trace = function(structure, gl, options) {
  console.time('trace');
  var compositeGeom = new CompositeGeom(structure);
  options.protoCyl = new ProtoCylinder(options.arcDetail);
  options.protoSphere = new ProtoSphere(options.sphereDetail, options.sphereDetail);
  options.color.begin(structure);
  var chains = structure.chains();
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    var meshGeom = _traceForChain(chain, gl, options);
    if (meshGeom) {
      compositeGeom.addGeom(meshGeom);
    }
  }
  options.color.end(structure);
  console.timeEnd('trace');
  return compositeGeom;
};

exports.cartoon = function(structure, gl, options) {
  console.time('cartoon');
  options.coilProfile = new TubeProfile(COIL_POINTS, options.arcDetail, 1.0);
  options.helixProfile = new TubeProfile(HELIX_POINTS, options.arcDetail, 0.1);
  options.strandProfile = new TubeProfile(HELIX_POINTS, options.arcDetail, 0.1);

  var compositeGeom = new CompositeGeom(structure);
  var chains = structure.chains();
  options.color.begin(structure);
  for (var i = 0, e = chains.length;  i < e; ++i) {
    var meshGeom = _cartoonForChain(chains[i], gl, options);
    if (meshGeom) {
      compositeGeom.addGeom(meshGeom);
    }
  }
  console.timeEnd('cartoon');
  options.color.end(structure);
  return compositeGeom;
};


var _cartoonAddTube = (function() {
  var rotation = mat3.create();
  var up = vec3.create();

  return function(mgeom, pos, left, res, tangent, color, first, options, 
                  offset, objId) {
    var ss = res.ss();
    var prof = options.coilProfile;
    if (ss === 'H' && !options.forceTube) {
      prof = options.helixProfile;
    } else if (ss === 'E' && !options.forceTube) {
      prof = options.strandProfile;
    } else {
      if (first) {
        geom.ortho(left, tangent);
      } else {
        vec3.cross(left, up, tangent);
      }
    }

    buildRotation(rotation, tangent, left, up, true);
    prof.addTransformed(mgeom, pos, options.radius, rotation, color, first, 
                         offset, objId);
  };
})();


// INTERNAL: fills positions, normals and colors from the information found in 
// trace. The 3 arrays must already have the correct size (3*trace.length).
var _colorPosNormalsFromTrace = (function() {
  var pos = vec3.create();
  var normal = vec3.create(), lastNormal = vec3.create();
                                 
  return function(trace, colors, positions, normals, objIds, pool, options) {
    var strand_start = null, strand_end = null;
    vec3.set(lastNormal, 0.0, 0.0, 0.0);
    for (var i = 0; i < trace.length(); ++i) {
      objIds.push(pool.nextId(trace.residueAt(i)));
      trace.smoothPosAt(pos, i, options.strength);
      positions[i*3] = pos[0]; 
      positions[i*3+1] = pos[1]; 
      positions[i*3+2] = pos[2];

      trace.smoothNormalAt(normal, i, options.strength);

      var atom = trace.centralAtomAt(i);
      options.color.colorFor(atom, colors, i*3);

      if (vec3.dot(normal, lastNormal) < 0) {
        vec3.scale(normal, normal, -1);
      }
      if (trace.residueAt(i).ss() === 'E' && !options.force_tube) {
        if (strand_start === null) {
          strand_start = i;
        }
        strand_end = i;
      }
      /*
      if (trace.residueAt(i).ss() === 'C' && strand_start !== null) {
        //inplaceSmooth(positions, strand_start, strand_end+1);
        //inplaceSmooth(normals, strand_start-1, strand_end+1);
        strand_start = null;
        strand_start = null;
      }
      */
      normals[i*3]   = positions[3*i]+normal[0]+lastNormal[0];
      normals[i*3+1] = positions[3*i+1]+normal[1]+lastNormal[1];
      normals[i*3+2] = positions[3*i+2]+normal[2]+lastNormal[2];
      vec3.copy(lastNormal, normal);
    }
  };
})();

// calculates the number of vertices required for the cartoon and
// tube render styles
var _cartoonNumVerts = function(traces, vertsPerSlice, splineDetail) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += ((traces[i].length()-1)*splineDetail+1)*vertsPerSlice;
  }
  return numVerts;
};

// constructs a cartoon representation for all consecutive backbone traces found
// in the given chain. 
var _cartoonForChain = (function() {

  var tangent = vec3.create(), pos = vec3.create(), left =vec3.create(),
      color = vec3.create(), normal = vec3.create(), normal2 = vec3.create(),
      rot = mat3.create();

  return function(chain, gl, options) {
    var traces = chain.backboneTraces();
    if (traces.length === 0) {
      return null;
    }
    var numVerts = _cartoonNumVerts(traces, options.arcDetail*4, 
                                    options.splineDetail);
    var meshGeom = new MeshGeom(gl, numVerts);
    var vertAssoc = new TraceVertexAssoc(chain.asView(), options.splineDetail,
                                         false);
    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];

      var positions = new Float32Array(trace.length()*3);
      var colors = new Float32Array(trace.length()*3);
      var normals = new Float32Array(trace.length()*3);

      var objIds = [];
      var idRange = options.idPool.getContinuousRange(trace.length());
      _colorPosNormalsFromTrace(trace, colors, positions, normals, objIds, 
                                idRange, options);
      meshGeom.addIdRange(idRange);
      var sdiv = geom.catmullRomSpline(positions, options.splineDetail, 
                                       options.strength, false);
      var normalSdiv = geom.catmullRomSpline(normals, options.splineDetail,
                                              options.strength, false);
      vertAssoc.setPerResidueColors(ti, colors);
      var interpColors = interpolateColor(colors, options.splineDetail);
      // handle start of trace. this could be moved inside the for-loop, but
      // at the expense of a conditional inside the loop. unrolling is 
      // slightly faster.
      //
      // we repeat the following steps for the start, central section and end 
      // of the profile: (a) assign position, normal, tangent and color, (b)
      // add tube (or rectangular profile for helices and strands).
      vec3.set(tangent, sdiv[3]-sdiv[0], sdiv[4]-sdiv[1], sdiv[5]-sdiv[2]);
      vec3.set(pos, sdiv[0], sdiv[1], sdiv[2]);
      vec3.set(normal, normalSdiv[0]-sdiv[0], 
               normalSdiv[1]-sdiv[0], normalSdiv[2]-sdiv[2]);
      vec3.normalize(tangent, tangent);
      vec3.normalize(normal, normal);
      vec3.set(color, interpColors[0], interpColors[1], interpColors[2]);

      var vertStart = meshGeom.numVerts();
      _cartoonAddTube(meshGeom, pos, normal, trace.residueAt(0), 
                      tangent, color, true, options, 0, objIds[0]);
      var vertEnd = meshGeom.numVerts();
      var slice = 0;
      vertAssoc.addAssoc(ti, slice, vertStart, vertEnd);
      slice +=1;
      var halfSplineDetail = Math.floor(options.splineDetail/2);

      // handle the bulk of the trace
      for (var i = 1, e = sdiv.length/3 ; i < e; ++i) {
        // compute 3*i, 3*(i-1), 3*(i+1) once and reuse
        var ix3 = 3*i, ipox3 = 3*(i+1), imox3  = 3*(i-1);

        vec3.set(pos, sdiv[ix3], sdiv[ix3+1], sdiv[ix3+2]);

        vec3.set(tangent, sdiv[ipox3]-sdiv[imox3],
                 sdiv[ipox3+1]-sdiv[imox3+1],
                 sdiv[ipox3+2]-sdiv[imox3+2]);
        vec3.normalize(tangent, tangent);
        vec3.set(color, interpColors[ix3], interpColors[ix3+1],
                interpColors[ix3+2]);

        var offset = 0; // <- set special handling of coil to helix,strand
                        //    transitions.
        var traceIndex = Math.floor(i/options.splineDetail);
        var prevTraceIndex = Math.floor((i-1)/options.splineDetail);
        if (traceIndex !== prevTraceIndex && !options.forceTube) {
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
          if (trace.residueAt(prevTraceIndex).ss() === 'C' &&
              (trace.residueAt(traceIndex).ss() === 'H' ||
               trace.residueAt(traceIndex).ss() === 'E')) {
            // we don't want to generate holes, so we have to make sure
            // the vertices of the rotated profile align with the previous
            // profile.
            vec3.set(normal2, normalSdiv[imox3]-sdiv[imox3], 
                     normalSdiv[imox3+1]-sdiv[imox3+1],
                     normalSdiv[imox3+2]-sdiv[imox3+2]);
            vec3.normalize(normal2, normal2);
            var  argAngle = 2*Math.PI/(options.arcDetail*4);
            var signedAngle = geom.signedAngle(normal, normal2, tangent);
            offset = Math.round(signedAngle/argAngle);
            offset = (offset + options.arcDetail*4) % (options.arcDetail*4);
          }
        }
        // only set normal *after* handling the coil -> helix,strand
        // transition, since we depend on the normal of the previous step.
        vec3.set(normal, normalSdiv[3*i]-sdiv[ix3], 
                 normalSdiv[ix3+1]-sdiv[ix3+1],
                 normalSdiv[ix3+2]-sdiv[ix3+2]);
        vec3.normalize(normal, normal);
        vertStart = meshGeom.numVerts();
        var objIndex = Math.floor((i+halfSplineDetail)/options.splineDetail);
        var objId = objIds[Math.min(objIds.length-1, objIndex)];
        _cartoonAddTube(meshGeom, pos, normal, trace.residueAt(traceIndex), 
                        tangent, color, false, options, offset, objId);
        vertEnd = meshGeom.numVerts();
        vertAssoc.addAssoc(ti, slice, vertStart, vertEnd);
        slice += 1;
      }
    }
    meshGeom.setVertAssoc(vertAssoc);
    return meshGeom;
  };
})();

var _traceNumVerts = function(traces, sphereNumVerts, cylNumVerts) {
  var numVerts = 0;
  for (var i = 0; i < traces.length; ++i) {
    numVerts += traces[i].length()*sphereNumVerts;
    numVerts += (traces[i].length()-1)*cylNumVerts;
  }
  return numVerts;
};

var _traceForChain = (function() {

  var rotation = mat3.create();

  var dir = vec3.create(), left = vec3.create(), up = vec3.create(),
      midPoint = vec3.create(), caPrevPos = vec3.create(), 
      caThisPos = vec3.create();
  var colorOne = vec3.create(), colorTwo = vec3.create();

  return function(chain, gl, options) {
    var traces = chain.backboneTraces();
    if (traces.length === 0) {
      return null;
    }
    var numVerts = _traceNumVerts(traces, options.protoSphere.numVerts(),
                                  options.protoCyl.numVerts());
    var meshGeom = new MeshGeom(gl, numVerts);
    var vertAssoc = new TraceVertexAssoc(chain.asView(), 1, false);
    var traceIndex = 0;
    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];
      var idRange = options.idPool.getContinuousRange(trace.length());
      meshGeom.addIdRange(idRange);
      options.color.colorFor(trace.centralAtomAt(0), colorOne, 0);
      var vertStart = meshGeom.numVerts();
      trace.posAt(caPrevPos, 0);
      var idStart = idRange.nextId(trace.residueAt(0)), idEnd = 0;
      options.protoSphere.addTransformed(meshGeom, caPrevPos, options.radius, 
                                         colorOne, idStart);
      var vertEnd = null;
      vertAssoc.addAssoc(traceIndex, 0, vertStart, vertEnd);
      var colors = new Float32Array(trace.length()*3);
      colors[0] = colorOne[0];
      colors[1] = colorOne[1];
      colors[2] = colorOne[2];
      for (var i = 1; i < trace.length(); ++i) {
        idEnd = idRange.nextId(trace.residueAt(i));
        trace.posAt(caPrevPos, i-1);
        trace.posAt(caThisPos, i);
        options.color.colorFor(trace.centralAtomAt(i), colorTwo, 0);
        colors[i*3] = colorTwo[0];
        colors[i*3+1] = colorTwo[1];
        colors[i*3+2] = colorTwo[2];

        vec3.sub(dir, caThisPos, caPrevPos);
        var length = vec3.length(dir);

        vec3.scale(dir, dir, 1.0/length);

        buildRotation(rotation, dir, left, up, false);

        vec3.copy(midPoint, caPrevPos);
        vec3.add(midPoint, midPoint, caThisPos);
        vec3.scale(midPoint, midPoint, 0.5);
        var endSphere = meshGeom.numVerts();
        options.protoCyl.addTransformed(meshGeom, midPoint, length, 
                                        options.radius, rotation, 
                                        colorOne, colorTwo, idStart, idEnd);
        vertEnd = meshGeom.numVerts();
        vertEnd = vertEnd - (vertEnd-endSphere)/2;

        options.protoSphere.addTransformed(meshGeom, caThisPos, options.radius, 
                                           colorTwo, idEnd);
        idStart = idEnd;
        vertAssoc.addAssoc(traceIndex, i, vertStart, vertEnd);
        vertStart = vertEnd;
        vec3.copy(colorOne, colorTwo);
      }
      vertAssoc.setPerResidueColors(traceIndex, colors);
      vertAssoc.addAssoc(traceIndex, trace.length()-1, vertStart, 
                         meshGeom.numVerts());
      traceIndex += 1;
    }
    meshGeom.setVertAssoc(vertAssoc);
    return meshGeom;
  };
})();


return exports;

})();

