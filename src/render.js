
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

var LineGeom = function(gl) {
  var self = {
    data : [],
    ready : false,
    interleavedBuffer : gl.createBuffer(),
    num_lines : 0
  };

  return {
    draw : function(shaderProgram) {
      this.bind();
      var vertAttrib = gl.getAttribLocation(shaderProgram, 'attrPos');
      gl.enableVertexAttribArray(vertAttrib);
      gl.vertexAttribPointer(vertAttrib, 3, gl.FLOAT, false, 6*4, 0*4);
      var clrAttrib = gl.getAttribLocation(shaderProgram, 'attrColor');
      gl.vertexAttribPointer(clrAttrib, 3, gl.FLOAT, false, 6*4, 3*4);
      gl.enableVertexAttribArray(clrAttrib);
      gl.drawArrays(gl.LINES, 0, self.num_lines*2);
      gl.disableVertexAttribArray(vertAttrib);
      gl.disableVertexAttribArray(clrAttrib);
    },

    requiresOutlinePass : function() { return false; },
    // prepare data for rendering. if the buffer data was modified, this 
    // synchronizes the corresponding GL array buffers.
    bind : function() {
      gl.bindBuffer(gl.ARRAY_BUFFER, self.interleavedBuffer);
      if (!self.ready) {
        var floatArray = new Float32Array(self.data);
        gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
        self.ready = true;
        // clear original data. it's not used anymore
        self.data = [];
      }
    },
    addLine : function(startPos, startColor, endPos, endColor) {
     self.data.push(startPos[0]); 
     self.data.push(startPos[1]); 
     self.data.push(startPos[2]); 
     self.data.push(startColor[0]);
     self.data.push(startColor[1]);
     self.data.push(startColor[2]);

     self.data.push(endPos[0]); 
     self.data.push(endPos[1]); 
     self.data.push(endPos[2]); 
     self.data.push(endColor[0]);
     self.data.push(endColor[1]);
     self.data.push(endColor[2]);
     self.num_lines += 1;
     self.ready = false;
    }
  };
};

var ProtoSphere  = function(stacks, arcs) {
  var self = {
    arcs : arcs,
    stacks : stacks,
    indices : new Uint16Array(3*arcs*stacks*2),
    verts : new Float32Array(3*arcs*stacks)
  };
  var vert_angle = Math.PI/(stacks-1);
  var horz_angle = Math.PI*2.0/arcs;
  var i, j;
  for (i = 0; i < self.stacks; ++i) {
    var radius = Math.sin(i*vert_angle);
    var z = Math.cos(i*vert_angle);
    for (j = 0; j < self.arcs; ++j) {
      var nx = radius*Math.cos(j*horz_angle);
      var ny = radius*Math.sin(j*horz_angle);
      self.verts[3*(j+i*self.arcs)] = nx;
      self.verts[3*(j+i*self.arcs)+1] = ny;
      self.verts[3*(j+i*self.arcs)+2] = z;
    }
  }
  var index = 0;
  for (i = 0; i < self.stacks-1; ++i) {
    for (j = 0; j < self.arcs; ++j) {
      self.indices[index] = (i)*self.arcs+j;
      self.indices[index+1] = (i)*self.arcs+((j+1) % self.arcs);
      self.indices[index+2] = (i+1)*self.arcs+j;

      index += 3;
      
      self.indices[index] = (i)*self.arcs+((j+1) % self.arcs);
      self.indices[index+1] = (i+1)*self.arcs+((j+1) % self.arcs);
      self.indices[index+2] = (i+1)*self.arcs+j;
      index += 3;
    }
  }
  var pos = vec3.create(), normal = vec3.create();
  return {
    addTransformed : function(geom, center, radius, color) {
      var baseIndex = geom.numVerts();
      for (var i = 0; i < self.stacks*self.arcs; ++i) {
        vec3.set(normal, self.verts[3*i], self.verts[3*i+1], 
                 self.verts[3*i+2]);
        vec3.copy(pos, normal);
        vec3.scale(pos, pos, radius);
        vec3.add(pos, pos, center);
        geom.addVertex(pos, normal, color);
      }
      for (i = 0; i < self.indices.length/3; ++i) {
        geom.addTriangle(baseIndex+self.indices[i*3], 
                          baseIndex+self.indices[i*3+1], 
                          baseIndex+self.indices[i*3+2]);
      }
    },
    num_indices : function() { return self.indices.length; },
    num_vertices : function() { return self.verts.length; }
  };
};

// A tube profile is a cross-section of a tube, e.g. a circle or a 'flat' square.
// They are used to control the style of helices, strands and coils for the 
// cartoon render mode. 
var TubeProfile = function(points, num, strength) {

  var interpolated = geom.catmullRomSpline(points, num, strength, true);

  var self = {
    indices : new Uint16Array(interpolated.length*2),
    verts : interpolated,
    normals : new Float32Array(interpolated.length),
    arcs : interpolated.length/3
  };

  var normal = vec3.create();
  for (var i = 0; i < self.arcs; ++i) {
    var i_prev = i === 0 ? self.arcs-1 : i-1;
    var i_next = i === self.arcs-1 ? 0 : i+1;
    normal[0] = self.verts[3*i_next+1] - self.verts[3*i_prev+1];
    normal[1] = self.verts[3*i_prev] - self.verts[3*i_next];
    vec3.normalize(normal, normal);
    self.normals[3*i] = normal[0];
    self.normals[3*i+1] = normal[1];
    self.normals[3*i+2] = normal[2];
  }

  for (i = 0; i < self.arcs; ++i) {
    self.indices[6*i] = i;
    self.indices[6*i+1] = i+self.arcs;
    self.indices[6*i+2] = ((i+1) % self.arcs) + self.arcs;
    self.indices[6*i+3] = i;
    self.indices[6*i+4] = ((i+1) % self.arcs) + self.arcs;
    self.indices[6*i+5] = (i+1) % self.arcs;
  }

  var pos = vec3.create();
  return {
    addTransformed : function(geom, center, radius, rotation, color, first,
                               offset) {
      var baseIndex = geom.numVerts() - self.arcs;
      for (var i = 0; i < self.arcs; ++i) {
        vec3.set(pos, radius*self.verts[3*i], radius*self.verts[3*i+1], 0.0);
        vec3.transformMat3(pos, pos, rotation);
        vec3.add(pos, pos, center);
        vec3.set(normal, self.normals[3*i], self.normals[3*i+1], 0.0);
        vec3.transformMat3(normal, normal, rotation);
        geom.addVertex(pos, normal, color);
      }
      if (first) {
        return;
      }
      if (offset === 0) {
        // that's what happens most of the time, thus is has been optimized.
        for (i = 0; i < self.indices.length/3; ++i) {
          geom.addTriangle(baseIndex+self.indices[i*3], 
                            baseIndex+self.indices[i*3+1], 
                            baseIndex+self.indices[i*3+2]);
        }
        return;
      }
      for (i = 0; i < self.arcs; ++i) {
        geom.addTriangle(baseIndex+((i+offset) % self.arcs),
                          baseIndex+i+self.arcs,
                          baseIndex+((i+1) % self.arcs) + self.arcs);
        geom.addTriangle(baseIndex+(i+offset) % self.arcs,
                          baseIndex+((i+1) % self.arcs) + self.arcs,
                          baseIndex+((i+1+offset) % self.arcs));
      }

    }
  };
};

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

var ProtoCylinder = function(arcs) {
  var self = {
    arcs : arcs,
    indices : new Uint16Array(arcs*3*2),
    verts : new Float32Array(3*arcs*2),
    normals : new Float32Array(3*arcs*2)
  };
  var angle = Math.PI*2/self.arcs;
  for (var i = 0; i < self.arcs; ++i) {
    var cos_angle = Math.cos(angle*i);
    var sin_angle = Math.sin(angle*i);
    self.verts[3*i] = cos_angle;
    self.verts[3*i+1] = sin_angle;
    self.verts[3*i+2] = -0.5;
    self.verts[3*arcs+3*i] = cos_angle;
    self.verts[3*arcs+3*i+1] = sin_angle;
    self.verts[3*arcs+3*i+2] = 0.5;
    self.normals[3*i] = cos_angle;
    self.normals[3*i+1] = sin_angle;
    self.normals[3*arcs+3*i] = cos_angle;
    self.normals[3*arcs+3*i+1] = sin_angle;
  }
  for (i = 0; i < self.arcs; ++i) {
    self.indices[6*i] = (i) % self.arcs;
    self.indices[6*i+1] = arcs+((i+1) % self.arcs);
    self.indices[6*i+2] = (i+1) % self.arcs;

    self.indices[6*i+3] = (i) % self.arcs;
    self.indices[6*i+4] = arcs+((i) % self.arcs);
    self.indices[6*i+5] = arcs+((i+1) % self.arcs);
  }
  return {
    addTransformed : function(geom, center, length, radius, rotation, colorOne, 
                               colorTwo) {
      var baseIndex = geom.numVerts();
      var pos = vec3.create(), normal = vec3.create(), color;
      for (var i = 0; i < 2*self.arcs; ++i) {
        vec3.set(pos, radius*self.verts[3*i], radius*self.verts[3*i+1], 
                 length*self.verts[3*i+2]);
        vec3.transformMat3(pos, pos, rotation);
        vec3.add(pos, pos, center);
        vec3.set(normal, self.normals[3*i], self.normals[3*i+1], self.normals[3*i+2]);
        vec3.transformMat3(normal, normal, rotation);
        geom.addVertex(pos, normal, i < self.arcs ? colorOne : colorTwo);
      }
      for (i = 0; i < self.indices.length/3; ++i) {
        geom.addTriangle(baseIndex+self.indices[i*3], 
                         baseIndex+self.indices[i*3+1], 
                         baseIndex+self.indices[i*3+2]);
      }
    }
  };
};

// an (indexed) mesh geometry container.
//
// stores the vertex data in interleaved format. not doing so has severe 
// performance penalties in WebGL, and by severe I mean orders of magnitude 
// slower than using an interleaved array.
var MeshGeom = function(gl) {
  var self = {
    interleavedBuffer : gl.createBuffer(),
    indexBuffer : gl.createBuffer(),
    vertData : [],
    indexData : [],
    num_triangles : 0,
    numVerts : 0,
    ready : false
  };

  return {
    numVerts : function() { return self.numVerts; },
    requiresOutlinePass : function() { return true; },
    draw: function(shaderProgram) {
      this.bind();
      var posAttrib = gl.getAttribLocation(shaderProgram, 'attrPos');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 9*4, 0*4);

      var normalAttrib = gl.getAttribLocation(shaderProgram, 'attrNormal');
      if (normalAttrib !== -1) {
        gl.enableVertexAttribArray(normalAttrib);
        gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 9*4, 3*4);
      }

      var clrAttrib = gl.getAttribLocation(shaderProgram, 'attrColor');
      if (clrAttrib !== -1) {
        gl.vertexAttribPointer(clrAttrib, 3, gl.FLOAT, false, 9*4, 6*4);
        gl.enableVertexAttribArray(clrAttrib);
      }
      gl.drawElements(gl.TRIANGLES, self.num_triangles*3, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(posAttrib);
      if (clrAttrib !==-1)
        gl.disableVertexAttribArray(clrAttrib);
      if (normalAttrib !== -1)
        gl.disableVertexAttribArray(normalAttrib);
    },
    addVertex : function(pos, normal, color) {
      // pushing all values at once seems to be more efficient than pushing
      // separately. resizing the vertData prior and setting the elements
      // is substantially slower.
      self.vertData.push(pos[0], pos[1], pos[2], 
                         normal[0], normal[1], normal[2],
                         color[0], color[1], color[2]);
      self.numVerts += 1;
    },
    addTriangle : function(idx1, idx2, idx3) {
      self.indexData.push(idx1, idx2, idx3);
      self.num_triangles +=1;
    },
    bind : function() {
      gl.bindBuffer(gl.ARRAY_BUFFER, self.interleavedBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      if (!self.ready) {
        var floatArray = new Float32Array(self.vertData);
        gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
        var indexArray = new Uint16Array(self.indexData);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
        self.ready = true;
        self.indexData = [];
        self.vertData = [];
      }
    }
  };
};

// A scene node holds a set of child nodes to be rendered on screen. Later on, 
// the SceneNode might grow additional functionality commonly found in a scene 
// graph, e.g. coordinate transformations.
function SceneNode() {
  this._children = [];
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

var exports = {};

exports.SceneNode = SceneNode;

exports.lineTrace = function(structure, gl, options) {
  console.time('lineTrace');
  var colorOne = vec3.create(), colorTwo = vec3.create();
  var lineGeom = LineGeom(gl);
  var chains = structure.chains();
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    chain.eachBackboneTrace(function(trace) {
      for (var i = 1; i < trace.length; ++i) {
        options.color(trace[i-1].atom('CA'), colorOne, 0);
        options.color(trace[i].atom('CA'), colorTwo, 0);
        lineGeom.addLine(trace[i-1].atom('CA').pos(), colorOne, 
                         trace[i-0].atom('CA').pos(), colorTwo);
      }
    });
  }
  console.time('lineTrace');
  return lineGeom;
};

exports.spheres = function(structure, gl, options) {
  console.time('spheres');
  var clr = vec3.create();
  var geom = MeshGeom(gl);
  var protoSphere = ProtoSphere(options.sphereDetail, options.sphereDetail);
  structure.eachAtom(function(atom) {
    options.color(atom, clr, 0);
    protoSphere.addTransformed(geom, atom.pos(), 1.5, clr);
  });
  console.timeEnd('spheres');
  return geom;
};


exports.sline = function(structure, gl, options) {
  console.time('sline');
  var lineGeom = LineGeom(gl);
  var posOne = vec3.create(), posTwo = vec3.create();
  var colorOne = vec3.create(), colorTwo = vec3.create();
  var chains = structure.chains();
  var i, e;
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    chain.eachBackboneTrace(function(trace) {
      var positions = new Float32Array(trace.length*3);
      var colors = new Float32Array(trace.length*3);
      for (i = 0; i < trace.length; ++i) {
        var atom = trace[i].atom('CA');
        options.color(atom, colors, 3*i);
        var p = atom.pos();
        positions[i*3] = p[0];
        positions[i*3+1] = p[1];
        positions[i*3+2] = p[2];
      }
      var sdiv = geom.catmullRomSpline(positions, options.splineDetail, 
                                       options.strength, false);
      var interpColors = interpolateColor(colors, options.splineDetail);
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
      }
    });
  }
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
    options.color(trace[i].atom('CA'), colors, i*3);
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
    var mgeom = MeshGeom(gl);

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

      _cartoonAddTube(mgeom, pos, normal, trace[0], tangent, color, true, 
                      options, 0);

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
        _cartoonAddTube(mgeom, pos, normal, trace[traceIndex], tangent, color, 
                        false, options, offset);
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
                
      _cartoonAddTube(mgeom, pos, normal, trace[trace.length-1], tangent, color, 
                      false, options, 0);
    }
    return mgeom;
  };
})();

exports.cartoon = function(structure, gl, options) {
  console.time('cartoon');
  options.coilProfile = TubeProfile(COIL_POINTS, options.arcDetail, 1.0);
  options.helixProfile = TubeProfile(HELIX_POINTS, options.arcDetail, 0.1);
  options.strandProfile = TubeProfile(HELIX_POINTS, options.arcDetail, 0.1);

  var node = new SceneNode();
  var chains = structure.chains();
  for (var i = 0, e = chains.length;  i < e; ++i) {
    var mgeom = _cartoonForChain(chains[i], gl, options);
    // check that there is anything to be added...
    if (mgeom) {
      node.add(mgeom);
    }
  }
  console.timeEnd('cartoon');
  return node;
};


exports.lines = function(structure, gl, options) {
  console.time('lines');
  var mp = vec3.create();
  var lineGeom = LineGeom(gl);
  var clr = vec3.create();
  structure.eachAtom(function(atom) {
    // for atoms without bonds, we draw a small cross, otherwise these atoms 
    // would be invisible on the screen.
    if (atom.bonds().length) {
      atom.eachBond(function(bond) {
        bond.mid_point(mp); 
        options.color(bond.atom_one(), clr, 0);
        lineGeom.addLine(bond.atom_one().pos(), clr, mp, clr);
        options.color(bond.atom_two(), clr, 0);
        lineGeom.addLine(mp, clr, bond.atom_two().pos(), clr);

      });
    } else {
      var cs = 0.2;
      var pos = atom.pos();
      options.color(atom, clr, 0);
      lineGeom.addLine([pos[0]-cs, pos[1], pos[2]], clr, 
                        [pos[0]+cs, pos[1], pos[2]], clr);
      lineGeom.addLine([pos[0], pos[1]-cs, pos[2]], clr, 
                        [pos[0], pos[1]+cs, pos[2]], clr);
      lineGeom.addLine([pos[0], pos[1], pos[2]-cs], clr, 
                        [pos[0], pos[1], pos[2]+cs], clr);
    }
  });
  console.timeEnd('lines');
  return lineGeom;
};

var _traceForChain = (function() {

  var rotation = mat3.create();

  var dir = vec3.create(), left = vec3.create(), up = vec3.create();
  var colorOne = vec3.create(), colorTwo = vec3.create();

  return function(chain, gl, options) {
    var traces = chain.backboneTraces();
    if (traces.length === 0) {
      return null;
    }
    var mgeom = MeshGeom(gl);
    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];

      options.color(trace[0].atom('CA'), colorOne, 0);
      options.protoSphere.addTransformed(mgeom, trace[0].atom('CA').pos(), 
                                         options.radius, colorOne);
      for (var i = 1; i < trace.length; ++i) {
        var caPrevPos = trace[i-1].atom('CA').pos();
        var caThisPos = trace[i].atom('CA').pos();
        options.color(trace[i].atom('CA'), colorTwo, 0);
        options.protoSphere.addTransformed(mgeom, caThisPos, options.radius, 
                                           colorTwo);
        vec3.sub(dir, caThisPos, caPrevPos);
        var length = vec3.length(dir);

        vec3.scale(dir, dir, 1.0/length);

        buildRotation(rotation, dir, left, up, false);

        var mid_point = vec3.clone(caPrevPos);
        vec3.add(mid_point, mid_point, caThisPos);
        vec3.scale(mid_point, mid_point, 0.5);
        options.protoCyl.addTransformed(mgeom, mid_point, length, 
                                        options.radius, rotation, 
                                        colorOne, colorTwo);
        vec3.copy(colorOne, colorTwo);
      }
    }
    return mgeom;
  };
})();

exports.trace = function(structure, gl, options) {
  var node = new SceneNode();
  options.protoCyl = ProtoCylinder(options.arcDetail);
  options.protoSphere = ProtoSphere(options.sphereDetail, options.sphereDetail);
  var chains = structure.chains();
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
    var mgeom = _traceForChain(chain, gl, options);
    if (mgeom) {
      node.add(mgeom);
    }
  }
  return node;
};

return exports;

})();

