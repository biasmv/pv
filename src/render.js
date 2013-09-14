
var render = (function() {
"use strict";

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

// linearly interpolates the array of colors and returns it as a Float32Array
// color must be an array containing a sequence of R,G,B triples.
function interpolateColor(colors, num) {
  var out = new Float32Array((colors.length-3)*num);
  var index = 0;
  var bf = vec3.create(), af = vec3.create();
  var delta = 1/num;
  for (var i = 0; i < colors.length/3-1; ++i) {
    vec3.set(bf, colors[3*i], colors[3*i+1], colors[3*i+2]);
    vec3.set(af, colors[3*i+3], colors[3*i+4], colors[3*i+5]);
    for (var j = 0; j < num; ++j) {
      var t = delta * j;
      out[index] = bf[0]*(1-t)+af[0]*t;
      out[index+1] = bf[1]*(1-t)+af[1]*t;
      out[index+2] = bf[2]*(1-t)+af[2]*t;
      index+=3;
    }
  }
  out[index] = af[0];
  out[index+1] = af[1];
  out[index+2] = af[2];
  return out;
}

// During recoloring of a render style, most of the vertex attributes, e.g.
// normals and positions do not change. Only the color information for each
// vertex needs to be adjusted. 
//
// To do that efficiently, we need store an association between ranges of
// vertices and atoms in the original structure. Worse, we also need to 
// support render styles for which colors need to be interpolated, e.g.
// the smooth line trace, tube and cartoon render modes. 
//
// The vertex association data for the atom-based render styles is managed
// by AtomVertexAssoc, whereas the trace-based render styles are managed 
// by the TraceVertexAssoc class. 
function AtomVertexAssoc(structure, callColoringBeginEnd) {
  this._structure = structure;
  this._assocs = [];
  this._callBeginEnd = callColoringBeginEnd;

}

AtomVertexAssoc.prototype.addAssoc = function(atom, vertStart, vertEnd)  {
  this._assocs.push({ atom: atom, vertStart : vertStart, vertEnd : vertEnd });
};

AtomVertexAssoc.prototype.recolor = function(colorOp, buffer, offset, stride) {
  var colorData = new Float32Array(this._structure.atomCount()*3); 
  if (this._callBeginEnd) {
    colorOp.begin(this._structure);
  }
  var atomMap = {};
  this._structure.eachAtom(function(atom, index) {
    atomMap[atom.index()] = index;
    colorOp.colorFor(atom, colorData, index*3);
  });
  if (this._callBeginEnd) {
    colorOp.begin(this._structure);
  }
  colorOp.end(this._structure);
  for (var i = 0; i < this._assocs.length; ++i) {
    var assoc = this._assocs[i];
    var ai = atomMap[assoc.atom.index()];
    var r = colorData[ai*3], g = colorData[ai*3+1], b = colorData[ai*3+2];
    for (var j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
       buffer[offset+j*stride+0] = r;  
       buffer[offset+j*stride+1] = g;  
       buffer[offset+j*stride+2] = b;  
    }
  }
};

function TraceVertexAssoc(structure, interpolation, callColoringBeginEnd) {
  this._structure = structure;
  this._assocs = [];
  this._callBeginEnd = callColoringBeginEnd;
  this._interpolation = interpolation || 1;
}

TraceVertexAssoc.prototype.addAssoc = function(traceIndex, slice, vertStart, vertEnd) {
  this._assocs.push({ traceIndex: traceIndex, slice : slice, vertStart : vertStart, 
                      vertEnd : vertEnd});
};


TraceVertexAssoc.prototype.recolor = function(colorOp, buffer, offset, 
                                              stride) {
  // FIXME: this function might create quite a few temporary buffers. Implement
  // a buffer pool to avoid hitting the GC and having to go through the slow
  // creation of typed arrays.
  if (this._callBeginEnd) {
    colorOp.begin(this._structure);
  }
  var colorData = [];
  var i, j;
  for (var ci = 0; ci < this._structure.chains().length; ++ci) {
    var chain = this._structure.chains()[ci];
    var traces = chain.backboneTraces();
    for (i = 0; i < traces.length; ++i) {
      var data = new Float32Array(traces[i].length*3); 
      var index = 0;
      for (j = 0; j < traces[i].length; ++j) {
        colorOp.colorFor(traces[i][j].atom('CA'), data, index);
        index+=3;
      }
      if (this._interpolation>1) {
        colorData.push(interpolateColor(data, this._interpolation));
      } else {
        colorData.push(data);
      }
    }
  }
  for (i = 0; i < this._assocs.length; ++i) {
    var assoc = this._assocs[i];
    var ai = assoc.slice;
    var d = colorData[assoc.traceIndex];
    var r = d[ai*3], g = d[ai*3+1], b = d[ai*3+2];
    for (j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
      buffer[offset+j*stride+0] = r;  
      buffer[offset+j*stride+1] = g;  
      buffer[offset+j*stride+2] = b;  
    }
  }
  if (this._callBeginEnd) {
    colorOp.end(this._structure);
  }
};

// Holds geometrical data for objects rendered as lines. For each vertex,
// the color and position is stored in an interleaved format.
function LineGeom(gl) {
  this._data = [];
  this._ready = false;
  this._interleavedBuffer = gl.createBuffer();
  this._gl = gl;
  this._numLines = 0;
  this._vertAssoc = null;
  this._lineWidth = 1.0;
  SceneNode.prototype.constructor(this);
}

LineGeom.prototype = new SceneNode();

LineGeom.prototype.setLineWidth = function(width) {
  this._lineWidth = width;
};

LineGeom.prototype.setVertAssoc = function(assoc) {
  this._vertAssoc = assoc;
};

LineGeom.prototype.numVerts = function() { return this._numLines*2; };

LineGeom.prototype.draw = function(shaderProgram) {
  if (!this._visible)
    return;
  this.bind();
  this._gl.lineWidth(this._lineWidth);
  var vertAttrib = this._gl.getAttribLocation(shaderProgram, 'attrPos');
  this._gl.enableVertexAttribArray(vertAttrib);
  this._gl.vertexAttribPointer(vertAttrib, 3, this._gl.FLOAT, false, 6*4, 0*4);
  var clrAttrib = this._gl.getAttribLocation(shaderProgram, 'attrColor');
  this._gl.vertexAttribPointer(clrAttrib, 3, this._gl.FLOAT, false, 6*4, 3*4);
  this._gl.enableVertexAttribArray(clrAttrib);
  this._gl.drawArrays(this._gl.LINES, 0, this._numLines*2);
  this._gl.disableVertexAttribArray(vertAttrib);
  this._gl.disableVertexAttribArray(clrAttrib);
};

LineGeom.prototype.requiresOutlinePass = function() {
  return false;
};

LineGeom.prototype.colorBy = function(colorFunc) {
  console.time('LineGeom.colorBy');
  this._ready = false;
  this._vertAssoc.recolor(colorFunc, this._data, 3, 6);
  console.timeEnd('LineGeom.colorBy');
};

LineGeom.prototype.bind = function() {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._interleavedBuffer);
  if (this._ready) {
    return;
  }
  var floatArray = new Float32Array(this._data);
  this._gl.bufferData(this._gl.ARRAY_BUFFER, floatArray, this._gl.STATIC_DRAW);
  this._ready = true;
};

LineGeom.prototype.addLine = function(startPos, startColor, endPos, endColor) {
  this._data.push(startPos[0], startPos[1], startPos[2],
                  startColor[0], startColor[1], startColor[2],
                  endPos[0], endPos[1], endPos[2],
                  endColor[0], endColor[1], endColor[2]);
  this._numLines += 1;
  this._ready = false;
};

// a SceneNode which aggregates one or more (unnamed) geometries into one
// named object. It forwards coloring and configuration calls to all
// geometries it contains. 
//
// FIXME: CompositeGeom could possibly be merged directly into the 
// SceneNode by introducing named and unnamed child nodes at the SceneNode
// level. It only exists to support unnamed child nodes and hide the fact
// that some render styles require multiple MeshGeoms to be constructed.
function CompositeGeom(structure) {
  this._geoms = [];
  this._structure = structure;
  SceneNode.prototype.constructor(this);
}

CompositeGeom.prototype = new SceneNode();


CompositeGeom.prototype.addGeom = function(geom) {
  this._geoms.push(geom);
};

SceneNode.prototype.requiresOutlinePass = function() { return true; };

CompositeGeom.prototype.forwardMethod = function(method, args) {
  for (var i = 0; i < this._geoms.length; ++i) {
    this._geoms[i][method].apply(this._geoms[i], args);
  }
};

CompositeGeom.prototype.colorBy = function() {
  var colorFunc = arguments[0];
  colorFunc.begin(this._structure);
  this.forwardMethod('colorBy', arguments);
  colorFunc.end(this._structure);
};

CompositeGeom.prototype.draw = function(shaderProgram, outlinePass) {
  if (!this._visible)
    return;
  for (var i = 0; i < this._geoms.length; ++i) {
    if (!outlinePass || this._geoms[i].requiresOutlinePass()) {
      this._geoms[i].draw(shaderProgram, outlinePass);
    }
  }
  SceneNode.prototype.draw(this, shaderProgram, outlinePass);
};


function ProtoSphere(stacks, arcs) {
  this._arcs = arcs;
  this._stacks = stacks;
  this._indices = new Uint16Array(3*arcs*stacks*2);
  this._verts = new Float32Array(3*arcs*stacks);
  var vert_angle = Math.PI/(stacks-1);
  var horz_angle = Math.PI*2.0/arcs;
  var i, j;
  for (i = 0; i < this._stacks; ++i) {
    var radius = Math.sin(i*vert_angle);
    var z = Math.cos(i*vert_angle);
    for (j = 0; j < this._arcs; ++j) {
      var nx = radius*Math.cos(j*horz_angle);
      var ny = radius*Math.sin(j*horz_angle);
      this._verts[3*(j+i*this._arcs)] = nx;
      this._verts[3*(j+i*this._arcs)+1] = ny;
      this._verts[3*(j+i*this._arcs)+2] = z;
    }
  }
  var index = 0;
  for (i = 0; i < this._stacks-1; ++i) {
    for (j = 0; j < this._arcs; ++j) {
      this._indices[index] = (i)*this._arcs+j;
      this._indices[index+1] = (i)*this._arcs+((j+1) % this._arcs);
      this._indices[index+2] = (i+1)*this._arcs+j;

      index += 3;
      
      this._indices[index] = (i)*this._arcs+((j+1) % this._arcs);
      this._indices[index+1] = (i+1)*this._arcs+((j+1) % this._arcs);
      this._indices[index+2] = (i+1)*this._arcs+j;
      index += 3;
    }
  }
}

ProtoSphere.prototype.addTransformed = (function() {
  
  var pos = vec3.create(), normal = vec3.create();

  return function(geom, center, radius, color) {
    var baseIndex = geom.numVerts();
    for (var i = 0; i < this._stacks*this._arcs; ++i) {
      vec3.set(normal, this._verts[3*i], this._verts[3*i+1], 
                this._verts[3*i+2]);
      vec3.copy(pos, normal);
      vec3.scale(pos, pos, radius);
      vec3.add(pos, pos, center);
      geom.addVertex(pos, normal, color);
    }
    for (i = 0; i < this._indices.length/3; ++i) {
      geom.addTriangle(baseIndex+this._indices[i*3], 
                      baseIndex+this._indices[i*3+1], 
                      baseIndex+this._indices[i*3+2]);
    }
  };
})();

ProtoSphere.prototype.num_indices = function() { 
  return this._indices.length; 
};

ProtoSphere.prototype.num_vertices = function() { 
  return this._verts.length; 
};

// A tube profile is a cross-section of a tube, e.g. a circle or a 'flat' square.
// They are used to control the style of helices, strands and coils for the 
// cartoon render mode. 
function TubeProfile(points, num, strength) {
  var interpolated = geom.catmullRomSpline(points, num, strength, true);

  this._indices = new Uint16Array(interpolated.length*2);
  this._verts = interpolated;
  this._normals = new Float32Array(interpolated.length);
  this._arcs = interpolated.length/3;

  var normal = vec3.create(), pos = vec3.create();

  for (var i = 0; i < this._arcs; ++i) {
    var i_prev = i === 0 ? this._arcs-1 : i-1;
    var i_next = i === this._arcs-1 ? 0 : i+1;
    normal[0] = this._verts[3*i_next+1] - this._verts[3*i_prev+1];
    normal[1] = this._verts[3*i_prev] - this._verts[3*i_next];
    vec3.normalize(normal, normal);
    this._normals[3*i] = normal[0];
    this._normals[3*i+1] = normal[1];
    this._normals[3*i+2] = normal[2];
  }

  for (i = 0; i < this._arcs; ++i) {
    this._indices[6*i] = i;
    this._indices[6*i+1] = i+this._arcs;
    this._indices[6*i+2] = ((i+1) % this._arcs) + this._arcs;
    this._indices[6*i+3] = i;
    this._indices[6*i+4] = ((i+1) % this._arcs) + this._arcs;
    this._indices[6*i+5] = (i+1) % this._arcs;
  }
}

TubeProfile.prototype.addTransformed = (function() {
  var pos = vec3.create(), normal = vec3.create();
  return function(geom, center, radius, rotation, color, first,
                              offset) {
    var baseIndex = geom.numVerts() - this._arcs;
    for (var i = 0; i < this._arcs; ++i) {
      vec3.set(pos, radius*this._verts[3*i], radius*this._verts[3*i+1], 0.0);
      vec3.transformMat3(pos, pos, rotation);
      vec3.add(pos, pos, center);
      vec3.set(normal, this._normals[3*i], this._normals[3*i+1], 0.0);
      vec3.transformMat3(normal, normal, rotation);
      geom.addVertex(pos, normal, color);
    }
    if (first) {
      return;
    }
    if (offset === 0) {
      // that's what happens most of the time, thus is has been optimized.
      for (i = 0; i < this._indices.length/3; ++i) {
        geom.addTriangle(baseIndex+this._indices[i*3], 
                          baseIndex+this._indices[i*3+1], 
                          baseIndex+this._indices[i*3+2]);
      }
      return;
    }
    for (i = 0; i < this._arcs; ++i) {
      geom.addTriangle(baseIndex+((i+offset) % this._arcs),
                        baseIndex+i+this._arcs,
                        baseIndex+((i+1) % this._arcs) + this._arcs);
      geom.addTriangle(baseIndex+(i+offset) % this._arcs,
                        baseIndex+((i+1) % this._arcs) + this._arcs,
                        baseIndex+((i+1+offset) % this._arcs));
    }

  };
})();

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

function ProtoCylinder(arcs) {
  this._arcs = arcs;
  this._indices = new Uint16Array(arcs*3*2);
  this._verts = new Float32Array(3*arcs*2);
  this._normals = new Float32Array(3*arcs*2);
  var angle = Math.PI*2/this._arcs;
  for (var i = 0; i < this._arcs; ++i) {
    var cos_angle = Math.cos(angle*i);
    var sin_angle = Math.sin(angle*i);
    this._verts[3*i] = cos_angle;
    this._verts[3*i+1] = sin_angle;
    this._verts[3*i+2] = -0.5;
    this._verts[3*arcs+3*i] = cos_angle;
    this._verts[3*arcs+3*i+1] = sin_angle;
    this._verts[3*arcs+3*i+2] = 0.5;
    this._normals[3*i] = cos_angle;
    this._normals[3*i+1] = sin_angle;
    this._normals[3*arcs+3*i] = cos_angle;
    this._normals[3*arcs+3*i+1] = sin_angle;
  }
  for (i = 0; i < this._arcs; ++i) {
    this._indices[6*i] = (i) % this._arcs;
    this._indices[6*i+1] = arcs+((i+1) % this._arcs);
    this._indices[6*i+2] = (i+1) % this._arcs;

    this._indices[6*i+3] = (i) % this._arcs;
    this._indices[6*i+4] = arcs+((i) % this._arcs);
    this._indices[6*i+5] = arcs+((i+1) % this._arcs);
  }
}

ProtoCylinder.prototype.addTransformed = (function() {
  var pos = vec3.create(), normal = vec3.create();
  return function(geom, center, length, radius, rotation, colorOne, 
                              colorTwo) {
    var baseIndex = geom.numVerts();
    for (var i = 0; i < 2*this._arcs; ++i) {
      vec3.set(pos, radius*this._verts[3*i], radius*this._verts[3*i+1], 
                length*this._verts[3*i+2]);
      vec3.transformMat3(pos, pos, rotation);
      vec3.add(pos, pos, center);
      vec3.set(normal, this._normals[3*i], this._normals[3*i+1], this._normals[3*i+2]);
      vec3.transformMat3(normal, normal, rotation);
      geom.addVertex(pos, normal, i < this._arcs ? colorOne : colorTwo);
    }
    for (i = 0; i < this._indices.length/3; ++i) {
      geom.addTriangle(baseIndex+this._indices[i*3], 
                        baseIndex+this._indices[i*3+1], 
                        baseIndex+this._indices[i*3+2]);
    }
  };
})();

// an (indexed) mesh geometry container.
//
// stores the vertex data in interleaved format. not doing so has severe 
// performance penalties in WebGL, and severe means orders of magnitude 
// slower than using an interleaved array.
//
// the vertex data is stored in the following format;
//
// Px Py Pz Nx Ny Nz Cr Cg Cb
//
// , where P is the position, N the normal and C the color information
// of the vertex.
function MeshGeom(gl) {
  this._interleavedBuffer = gl.createBuffer();
  this._indexBuffer = gl.createBuffer();
  this._vertData = [];
  this._indexData = [];
  this._numVerts = 0;
  this._numTriangles = 0;
  this._ready = false;
  this._gl = gl;
  this._vertAssoc = null;
}

MeshGeom.prototype = new SceneNode();

MeshGeom.prototype.setVertAssoc = function(assoc) {
  this._vertAssoc = assoc;
};

MeshGeom.prototype.numVerts = function() { return this._numVerts; };

MeshGeom.prototype.requiresOutlinePass = function() { return true; };

MeshGeom.prototype.colorBy = function(colorFunc) {
  console.time('MeshGeom.colorBy');
  this._ready = false;
  this._vertAssoc.recolor(colorFunc, this._vertData, 6, 9);
  console.timeEnd('MeshGeom.colorBy');
};

MeshGeom.prototype.draw = function(shaderProgram) {
  if (!this._visible)
    return;
  this.bind();
  var posAttrib = this._gl.getAttribLocation(shaderProgram, 'attrPos');
  this._gl.enableVertexAttribArray(posAttrib);
  this._gl.vertexAttribPointer(posAttrib, 3, this._gl.FLOAT, false, 9*4, 0*4);

  var normalAttrib = this._gl.getAttribLocation(shaderProgram, 'attrNormal');
  if (normalAttrib !== -1) {
    this._gl.enableVertexAttribArray(normalAttrib);
    this._gl.vertexAttribPointer(normalAttrib, 3, this._gl.FLOAT, false, 
                                 9*4, 3*4);
  }

  var clrAttrib = this._gl.getAttribLocation(shaderProgram, 'attrColor');
  if (clrAttrib !== -1) {
    this._gl.vertexAttribPointer(clrAttrib, 3, this._gl.FLOAT, false, 9*4, 6*4);
    this._gl.enableVertexAttribArray(clrAttrib);
  }
  this._gl.drawElements(this._gl.TRIANGLES, this._numTriangles*3, 
                        this._gl.UNSIGNED_SHORT, 0);
  this._gl.disableVertexAttribArray(posAttrib);
  if (clrAttrib !==-1)
    this._gl.disableVertexAttribArray(clrAttrib);
  if (normalAttrib !== -1)
    this._gl.disableVertexAttribArray(normalAttrib);
};

MeshGeom.prototype.addVertex = function(pos, normal, color) {
  // pushing all values at once seems to be more efficient than pushing
  // separately. resizing the vertData prior and setting the elements
  // is substantially slower.
  this._vertData.push(pos[0], pos[1], pos[2], normal[0], normal[1], normal[2],
                      color[0], color[1], color[2]);
  this._numVerts += 1;
};

MeshGeom.prototype.addTriangle = function(idx1, idx2, idx3) {
  this._indexData.push(idx1, idx2, idx3);
  this._numTriangles += 1;
};

MeshGeom.prototype.bind = function() {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._interleavedBuffer);
  this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
  if (this._ready) {
    return;
  }
  var floatArray = new Float32Array(this._vertData);
  this._gl.bufferData(this._gl.ARRAY_BUFFER, floatArray, 
                      this._gl.STATIC_DRAW);
  var indexArray = new Uint16Array(this._indexData);
  this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, indexArray, 
                      this._gl.STATIC_DRAW);
  this._ready = true;
};

// A scene node holds a set of child nodes to be rendered on screen. Later on, 
// the SceneNode might grow additional functionality commonly found in a scene 
// graph, e.g. coordinate transformations.
function SceneNode(name) {
  this._children = [];
  this._visible = true;
  this._name = name || '';
}

SceneNode.prototype.add = function(node) {
  this._children.push(node);
};

SceneNode.prototype.draw = function(shaderProgram, outline_pass) {
  for (var i = 0; i < this._children.length; ++i) {
    if (!outline_pass || this._children[i].requiresOutlinePass())
      this._children[i].draw(shaderProgram, outline_pass);
  }
};

SceneNode.prototype.requiresOutlinePass = function() { return true; };
SceneNode.prototype.show = function() {
  this._visible = true;
};

SceneNode.prototype.hide = function() {
  this._visible = false;
};

SceneNode.prototype.name = function(name) { 
  if (name !== undefined) {
    this._name = name;
  }
  return this._name; 
};

var exports = {};

exports.SceneNode = SceneNode;

exports.lineTrace = function(structure, gl, options) {
  console.time('lineTrace');
  var colorOne = vec3.create(), colorTwo = vec3.create();
  var lineGeom = new LineGeom(gl);
  var vertAssoc = new TraceVertexAssoc(structure, 1, true);
  lineGeom.setLineWidth(options.lineWidth);
  options.color.begin(structure);
  var chains = structure.chains();
  var traceIndex = 0;
  function makeLineTrace(trace) {
    vertAssoc.addAssoc(traceIndex, 0, lineGeom.numVerts(), 
                       lineGeom.numVerts()+1);
    for (var i = 1; i < trace.length; ++i) {
      options.color.colorFor(trace[i-1].atom('CA'), colorOne, 0);
      options.color.colorFor(trace[i].atom('CA'), colorTwo, 0);
      lineGeom.addLine(trace[i-1].atom('CA').pos(), colorOne, 
                        trace[i-0].atom('CA').pos(), colorTwo);

      var vertEnd = lineGeom.numVerts();
      vertAssoc.addAssoc(traceIndex, i, vertEnd-1, 
                         vertEnd+((i === trace.length-1) ? 0 : 1));
    }
    traceIndex += 1;
  }
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    chain.eachBackboneTrace(makeLineTrace);
  }
  lineGeom.setVertAssoc(vertAssoc);
  options.color.end(structure);
  console.timeEnd('lineTrace');
  return lineGeom;
};

exports.spheres = function(structure, gl, options) {
  console.time('spheres');
  var clr = vec3.create();
  var geom = new MeshGeom(gl);
  var protoSphere = new ProtoSphere(options.sphereDetail, options.sphereDetail);
  var vertAssoc = new AtomVertexAssoc(structure, true);
  options.color.begin(structure);
  structure.eachAtom(function(atom) {
    options.color.colorFor(atom, clr, 0);
    var vertStart = geom.numVerts();
    protoSphere.addTransformed(geom, atom.pos(), 1.5, clr);
    var vertEnd = geom.numVerts();
    vertAssoc.addAssoc(atom, vertStart, vertEnd);
  });
  geom.setVertAssoc(vertAssoc);
  console.timeEnd('spheres');
  options.color.end(structure);
  return geom;
};


exports.sline = function(structure, gl, options) {
  console.time('sline');
  var lineGeom =new  LineGeom(gl);
  options.color.begin(structure);
  var vertAssoc = new TraceVertexAssoc(structure, options.splineDetail, 1, true);
  lineGeom.setLineWidth(options.lineWidth);
  var posOne = vec3.create(), posTwo = vec3.create();
  var colorOne = vec3.create(), colorTwo = vec3.create();
  var chains = structure.chains();
  var i, e, traceIndex = 0;
  function makeTrace(trace) {
    var positions = new Float32Array(trace.length*3);
    var colors = new Float32Array(trace.length*3);
    for (i = 0; i < trace.length; ++i) {
      var atom = trace[i].atom('CA');
      options.color.colorFor(atom, colors, 3*i);
      var p = atom.pos();
      positions[i*3] = p[0];
      positions[i*3+1] = p[1];
      positions[i*3+2] = p[2];
    }
    var sdiv = geom.catmullRomSpline(positions, options.splineDetail, 
                                      options.strength, false);
    var interpColors = interpolateColor(colors, options.splineDetail);
    var vertStart = lineGeom.numVerts();
    vertAssoc.addAssoc(traceIndex, i, vertStart, vertStart+1);
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
      lineGeom.addLine(posOne, colorOne, posTwo, colorTwo);
      var vertEnd = lineGeom.numVerts();
      vertAssoc.addAssoc(traceIndex, i, vertEnd-1, 
                         vertEnd+((i === trace.length-1) ? 0 : 1));
      traceIndex += 1;
    }
  }
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    chain.eachBackboneTrace(makeTrace);
  }
  lineGeom.setVertAssoc(vertAssoc);
  options.color.end(structure);
  console.timeEnd('sline');
  return lineGeom;
};


var _cartoonAddTube = (function() {
  var rotation = mat3.create();
  var up = vec3.create();

  return function(mgeom, pos, left, res, tangent, color, first, options, 
                  offset) {
    var ss = res.ss();
    var prof = options.coilProfile;
    if (ss == 'H' && !options.forceTube) {
      prof = options.helixProfile;
    } else if (ss == 'E' && !options.forceTube) {
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
                         offset);
  };
})();


// INTERNAL: fills positions, normals and colors from the information found in 
// trace. The 3 arrays must already have the correct size (3*trace.length).
var _colorPosNormalsFromTrace = function(trace, colors, positions, normals, 
                                         options) {
  var last_x = 0, last_y = 0, last_z = 0;
  var strand_start = null, strand_end = null;
  for (var i = 0; i < trace.length; ++i) {
    var p = trace[i].atom('CA').pos();
    var c = trace[i].atom('C').pos();
    var o = trace[i].atom('O').pos();
    positions[i*3] = p[0]; positions[i*3+1] = p[1]; positions[i*3+2] = p[2];

    var dx = o[0] - c[0], dy = o[1] - c[1], dz = o[2] - c[2];

    var div = 1.0/Math.sqrt(dx*dx+dy*dy+dz*dz);

    dx *= div;
    dy *= div;
    dz *= div;

    if (i > 0) {
      var dot = last_x*dx+last_y*dy+last_z*dz; 
      if (dot < 0) {
        dx *= -1;
        dy *= -1;
        dz *= -1;
      }
    }
    if (trace[i].ss() === 'E' && !options.force_tube) {
      if (strand_start === null) {
        strand_start = i;
      }
      strand_end = i;
    }
    if (trace[i].ss() =='C' && strand_start !== null) {
      //inplaceSmooth(positions, strand_start, strand_end+1);
      //inplaceSmooth(normals, strand_start-1, strand_end+1);
      strand_start = null;
      strand_start = null;
    }
    normals[i*3]   = positions[3*i]+dx+last_x; 
    normals[i*3+1] = positions[3*i+1]+dy+last_y; 
    normals[i*3+2] = positions[3*i+2]+dz+last_z;
    last_x = dx;
    last_y = dy;
    last_z = dz;
    options.color.colorFor(trace[i].atom('CA'), colors, i*3);
  }
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
    var chainView = chain.asView();
    var mgeom = new MeshGeom(gl);
    var vertAssoc = new TraceVertexAssoc(chain.asView(), options.splineDetail,
                                         false);

    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];

      var positions = new Float32Array(trace.length*3);
      var colors = new Float32Array(trace.length*3);
      var normals = new Float32Array(trace.length*3);

      _colorPosNormalsFromTrace(trace, colors, positions, normals, options);
      var sdiv = geom.catmullRomSpline(positions, options.splineDetail, 
                                       options.strength, false);
      var normalSdiv = geom.catmullRomSpline(normals, options.splineDetail,
                                              options.strength, false);
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

      var vertStart = mgeom.numVerts();
      _cartoonAddTube(mgeom, pos, normal, trace[0], tangent, color, true, 
                      options, 0);
      var vertEnd = mgeom.numVerts();
      var slice = 0;
      vertAssoc.addAssoc(ti, slice, vertStart, vertEnd);
      slice +=1;

      // handle the bulk of the trace
      for (var i = 1, e = sdiv.length/3 - 1; i < e; ++i) {
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
        if (traceIndex != prevTraceIndex) {
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
          if (trace[prevTraceIndex].ss() === 'C' &&
              (trace[traceIndex].ss() === 'H' ||
               trace[traceIndex].ss() === 'E')) {
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
        vertStart = mgeom.numVerts();
        _cartoonAddTube(mgeom, pos, normal, trace[traceIndex], tangent, color, 
                        false, options, offset);
        vertEnd = mgeom.numVerts();
        vertAssoc.addAssoc(ti, slice, vertStart, vertEnd);
        slice += 1;
      }
      i = sdiv.length;
      // finish trace off, again unrolled for efficiency.
      vec3.set(tangent, sdiv[3*i-3]-sdiv[3*i-6], 
                sdiv[3*i-2]-sdiv[3*i-5],
                sdiv[3*i-1]-sdiv[3*i-4]);

      vec3.set(pos, sdiv[3*i-3], sdiv[3*i-2], 
                sdiv[3*i-1]);
      vec3.set(normal, normalSdiv[3*i]-sdiv[3*i], 
                normalSdiv[3*i-3]-sdiv[3*i-3],
                normalSdiv[3*i-2]-sdiv[3*i-2]);
      vec3.normalize(normal, normal);
      vec3.normalize(tangent, tangent);
      vec3.set(color, interpColors[interpColors.length-3],
                interpColors[interpColors.length-2],
                interpColors[interpColors.length-1]);
                
      vertStart = mgeom.numVerts();
      _cartoonAddTube(mgeom, pos, normal, trace[trace.length-1], tangent, color, 
                      false, options, 0);
      vertEnd = mgeom.numVerts();
      vertAssoc.addAssoc(ti, slice, vertStart, vertEnd);
    }
    mgeom.setVertAssoc(vertAssoc);
    return mgeom;
  };
})();

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


exports.lines = function(structure, gl, options) {
  console.time('lines');
  var mp = vec3.create();
  var lineGeom = new LineGeom(gl);
  lineGeom.setLineWidth(options.lineWidth);
  var clr = vec3.create();
  var vertAssoc = new AtomVertexAssoc(structure, true);
  options.color.begin(structure);
  structure.eachAtom(function(atom) {
    // for atoms without bonds, we draw a small cross, otherwise these atoms 
    // would be invisible on the screen.
    var vertStart = lineGeom.numVerts();
    if (atom.bonds().length) {
      atom.eachBond(function(bond) {
        bond.mid_point(mp); 
        options.color.colorFor(atom, clr, 0);
        lineGeom.addLine(atom.pos(), clr, mp, clr);
      });
    } else {
      var cs = 0.2;
      var pos = atom.pos();
      options.color.colorFor(atom, clr, 0);
      lineGeom.addLine([pos[0]-cs, pos[1], pos[2]], clr, 
                        [pos[0]+cs, pos[1], pos[2]], clr);
      lineGeom.addLine([pos[0], pos[1]-cs, pos[2]], clr, 
                        [pos[0], pos[1]+cs, pos[2]], clr);
      lineGeom.addLine([pos[0], pos[1], pos[2]-cs], clr, 
                        [pos[0], pos[1], pos[2]+cs], clr);
    }
    var vertEnd = lineGeom.numVerts();
    vertAssoc.addAssoc(atom, vertStart, vertEnd);
  });
  lineGeom.setVertAssoc(vertAssoc);
  options.color.end(structure);
  console.timeEnd('lines');
  return lineGeom;
};

var _traceForChain = (function() {

  var rotation = mat3.create();

  var dir = vec3.create(), left = vec3.create(), up = vec3.create(),
      midPoint = vec3.create();
  var colorOne = vec3.create(), colorTwo = vec3.create();

  return function(chain, gl, options) {
    var traces = chain.backboneTraces();
    if (traces.length === 0) {
      return null;
    }
    var meshGeom = new MeshGeom(gl);
    var vertAssoc = new TraceVertexAssoc(chain.asView(), 1, false);
    var traceIndex = 0;
    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];

      options.color.colorFor(trace[0].atom('CA'), colorOne, 0);
      var vertStart = meshGeom.numVerts();
      options.protoSphere.addTransformed(meshGeom, trace[0].atom('CA').pos(), 
                                         options.radius, colorOne);
      var vertEnd = null;
      vertAssoc.addAssoc(traceIndex, 0, vertStart, vertEnd);
      for (var i = 1; i < trace.length; ++i) {
        var caPrevPos = trace[i-1].atom('CA').pos();
        var caThisPos = trace[i].atom('CA').pos();
        options.color.colorFor(trace[i].atom('CA'), colorTwo, 0);

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
                                        colorOne, colorTwo);
        vertEnd = meshGeom.numVerts();
        vertEnd = vertEnd - (vertEnd-endSphere)/2;

        options.protoSphere.addTransformed(meshGeom, caThisPos, options.radius, 
                                           colorTwo);
        vertAssoc.addAssoc(traceIndex, i, vertStart, vertEnd);
        vertStart = vertEnd;
        vec3.copy(colorOne, colorTwo);
      }
      vertAssoc.addAssoc(traceIndex, trace.length-1, vertStart, 
                         meshGeom.numVerts());
      traceIndex += 1;
    }
    meshGeom.setVertAssoc(vertAssoc);
    return meshGeom;
  };
})();

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

return exports;

})();

