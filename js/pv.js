var pv = (function(){
"use strict";


var WEBGL_NOT_SUPPORTED = '\
<div style="vertical-align:middle; text-align:center;">\
<h1>Oink</h1><p>Your browser does not support WebGL. \
You might want to try Chrome, Firefox, IE 10 or newer versions of Safari\
</p>\
<p>If you are using a recent version of one of the above browsers, your \
graphic card might be blocked. Check the browser documentation for details\
</p>\
</div>';

// hemilight fragment shader
var HEMILIGHT_FS = '\n\
precision mediump float;\n\
\n\
varying vec3 vert_color;\n\
varying vec3 vert_normal;\n\
uniform float fog_near;\n\
uniform float fog_far;\n\
uniform vec3 fog_color;\n\
\n\
void main(void) {\n\
  float dp = dot(vert_normal, vec3(0.0, 0.0, 1.0));\n\
  float hemi = max(0.0, dp)*0.5+0.5;\n\
  gl_FragColor = vec4(vert_color*hemi, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  float fog_factor = smoothstep(fog_near, fog_far, depth);\n\
  gl_FragColor = mix(gl_FragColor, vec4(fog_color, gl_FragColor.w),\n\
                      fog_factor);\n\
}\n\
'

// hemilight vertex shader
var HEMILIGHT_VS = '\n\
attribute vec3 attr_pos;\n\
attribute vec3 attr_color;\n\
attribute vec3 attr_normal;\n\
\n\
uniform mat4 projection_mat;\n\
uniform mat4 modelview_mat;\n\
varying vec3 vert_color;\n\
varying vec3 vert_normal;\n\
void main(void) {\n\
  gl_Position = projection_mat * modelview_mat * vec4(attr_pos, 1.0);\n\
  vec4 n = (modelview_mat * vec4(attr_normal, 0.0));\n\
  vert_normal = n.xyz;\n\
  vert_color = attr_color;\n\
}\n\
'
// outline shader. mixes outline_color with fog_color
var OUTLINE_FS = '\n\
precision mediump float;\n\
\n\
uniform vec3 outline_color;\n\
uniform float fog_near;\n\
uniform float fog_far;\n\
uniform vec3 fog_color;\n\
\n\
void main() {\n\
  gl_FragColor = vec4(outline_color, 1.0);\n\
  float depth = gl_FragCoord.z / gl_FragCoord.w;\n\
  float fog_factor = smoothstep(fog_near, fog_far, depth);\n\
  gl_FragColor = mix(gl_FragColor, vec4(fog_color, gl_FragColor.w),\n\
                      fog_factor);\n\
}\n\
'
// outline vertex shader. expands vertices along the (in-screen) xy
// components of the normals.
var OUTLINE_VS = '\n\
\n\
attribute vec3 attr_pos;\n\
attribute vec3 attr_normal;\n\
                                                                       \n\
uniform vec3 outline_color;\n\
uniform mat4 projection_mat;\n\
uniform mat4 modelview_mat;\n\
\n\
void main(void) {\n\
  gl_Position = projection_mat * modelview_mat * vec4(attr_pos, 1.0);\n\
  vec4 normal = modelview_mat * vec4(attr_normal, 0.0);\n\
  gl_Position.xy += normal.xy*0.200;\n\
}\n\
'

function bind(obj, fn) { 
  return function() { return fn.apply(obj, arguments); };
}


var requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

vec3.ortho = (function() {
  var tmp = vec3.create();
  return function(out, vec) {
    vec3.copy(tmp, vec);
    if (Math.abs(vec[0]) < Math.abs(vec[1])) {
      if (Math.abs(vec[0]) < Math.abs(vec[2])) {
        tmp[0] += 1
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


// assumes that axis is normalized. don't expect  to get meaningful results 
// if it's not
mat3.axisRotation = function(out, axis, angle) {
  var sa = Math.sin(angle),
      ca = Math.cos(angle),
      x  = axis[0], y  = axis[1], z = axis[2],
      xx = x*x, xy = x*y, xz = x*z, yy = y*y,
      yz = y*z, zz =z*z;

  out[0] = xx+ca-xx*ca;   out[1] = xy-ca*xy-sa*z; out[2] = xz-ca*xz+sa*y;
  out[3] = xy-ca*xy+sa*z; out[4] = yy+ca-ca*yy;   out[5] = yz-ca*yz-sa*x;
  out[6] = xz-ca*xz-sa*y; out[7] = yz-ca*yz+sa*x; out[8] = zz+ca-ca*zz;
  return out;
}


// performs an in-place smoothing over 3 consecutive positions.
var inplace_smooth = (function() {
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
  }
})();

// linearly interpolates the array of colors and returns it as a Float32Array
// color must be an array containing a sequence of R,G,B triples.
function interpolate_color(colors, num) {
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

function even_odd(even, odd) {
  return function(atom, out, index) {
    if (atom.residue().num() % 2) {
      out[index] = even[0];
      out[index+1] = even[1];
      out[index+2] = even[2];
    } else {
      out[index] = odd[0];
      out[index+1] = odd[1];
      out[index+2] = odd[2];
    }
  }
}


function ss() {
  return function(atom, out, index) {
    switch (atom.residue().ss()) {
      case 'C':
        out[index] = 0.8;
        out[index+1] = 0.8;
        out[index+2] = 0.8;
        return;
      case 'H':
        out[index] = 1.0;
        out[index+1] = 0.0;
        out[index+2] = 0.0;
        return;
      case 'E':
        out[index] = 0.0;
        out[index+1] = 1.0;
        out[index+2] = 0.0;
        return;
    }
  }
}


function uniform_color(color) {
  return function(atom, out, index) {
    out[index] = color[0];
    out[index+1] = color[1];
    out[index+2] = color[2];
  }
}


function MolBase() {

};

function Mol() {
}

function MolView(mol) {
 this._mol = mol; 
 this._pv = mol._pv;
 this._chains = [];
}


MolView.prototype = new MolBase();


function ChainBase() {
}

ChainBase.prototype.each_atom = function(callback) {
  for (var i = 0; i< this._residues.length; i+=1) {
    this._residues[i].each_atom(callback);
  }
}
ChainBase.prototype.each_residue = function(callback) {
  for (var i = 0; i < this._residues.length; i+=1) {
    callback(this._residues[i]);
  }
}

ChainBase.prototype.residues = function() { return this._residues; }
ChainBase.prototype.structure = function() { return this._structure; }

// invokes a callback for each connected stretch of amino acids. these 
// stretches are used for all trace-based rendering styles, e.g. sline, 
// line_trace, tube, cartoon etc. 
ChainBase.prototype.each_backbone_trace = function(callback) {
  var  stretch = [];
  for (var i = 0; i < this._residues.length; i+=1) {
    var residue = this._residues[i];
    if (!residue.is_aminoacid()) {
      if (stretch.length > 1) {
        callback(stretch);
        stretch = [];
      }
      continue;
    }
    if (stretch.length == 0) {
      stretch.push(residue);
      continue;
    }
    var ca_prev = this._residues[i-1].atom('C');
    var n_this = residue.atom('N');
    if (Math.abs(vec3.sqrDist(ca_prev.pos(), n_this.pos()) - 1.5*1.5) < 1) {
      stretch.push(residue);
    } else {
      if (stretch.length > 1) {
        callback(stretch);
        stretch = [];
      }
    }
  }
  if (stretch.length > 1) {
    callback(stretch);
  }
}


// returns all connected stretches of amino acids found in this chain as 
// a list.
ChainBase.prototype.backbone_traces = function() {
  var traces = [];
  this.each_backbone_trace(function(trace) { traces.push(trace); });
  return traces;

}

function ChainView(mol_view, chain) {
  this._chain = chain;
  this._residues = [];
  this._mol_view = mol_view;

}


ChainView.prototype = new ChainBase();

ChainView.prototype.add_residue = function(residue, recurse) {
  var res_view = new ResidueView(this, residue);
  this._residues.push(res_view);
  if (recurse) {
    var atoms = residue.atoms();
    for (var i = 0; i < atoms.length; ++i) {
      res_view.add_atom(atoms[i]);
    }
  }
  return res_view;
}


function ResidueBase() {

}

ResidueBase.prototype.is_water = function() {
  return this.name() == 'HOH' || this.name() == 'DOD';
}

ResidueBase.prototype.each_atom = function(callback) {
  for (var i =0; i< this._atoms.length; i+=1) {
    callback(this._atoms[i]);
  }
}
ResidueBase.prototype.atom = function(index_or_name) { 
  if (typeof index_or_name == 'string') {
    for (var i =0; i < this._atoms.length; ++i) {
     if (this._atoms[i].name() == index_or_name) {
       return this._atoms[i];
     }
    }
  }
  return this._atoms[index_or_name]; 
}


ResidueBase.prototype.is_aminoacid = function() { 
  return this.atom('N') && this.atom('CA') && this.atom('C') && this.atom('O');
}



function ResidueView(chain_view, residue) {
  this._chain_view = chain_view;
  this._atoms = [];
  this._residue = residue;
}

ResidueView.prototype = new ResidueBase();

ResidueView.prototype.add_atom = function(atom) {
  var atom_view = new AtomView(this, atom);
  this._atoms.push(atom_view);
}
function AtomView(res_view, atom) {
  this._res_view = res_view;
  this._atom = atom;
  this._bonds = [];
}


AtomView.prototype = new AtomBase();
AtomView.prototype.name = function() { return this._atom.name(); }
AtomView.prototype.pos = function() { return this._atom.pos(); }
AtomView.prototype.element = function() { return this._atom.element(); }
AtomView.prototype.bonds = function() { return this._bonds; }


function Chain(structure, name) {
  this._structure = structure;
  this._name = name;
  this._residues = [];
}



Chain.prototype = new ChainBase();

Chain.prototype.name = function() { return this._name; }

Chain.prototype.add_residue = function(name, num) {
  var residue = new Residue(this, name, num);
  this._residues.push(residue);
  return residue;
}

// assigns secondary structure to residues in range from_num to to_num.
Chain.prototype.assign_ss = function(from_num, to_num, ss) {
  // FIXME: when the chain numbers are completely ordered, perform binary 
  // search to identify range of residues to assign secondary structure to.
  for (var i = 1; i < this._residues.length-1; ++i) {
    var res = this._residues[i];
    // FIXME: we currently don't set the secondary structure of the first and 
    // last residue of helices and sheets. that takes care of better 
    // transitions between coils and helices. ideally, this should be done
    // in the cartoon renderer, NOT in this function.
    if (res.num() <=  from_num || res.num() >= to_num) {
      continue;
    }
    res.set_ss(ss);
  }
},


ChainView.prototype.name = function () { return this._chain.name(); }

function color_for_element(ele, out) {
  if (!out) {
    out = vec3.create();
  }
  if (ele == 'C') {
    vec3.set(out, 0.8,0.8, 0.8);
    return out;
  }
  if (ele == 'N') {
    vec3.set(out, 0, 0, 1);
    return out;
  }
  if (ele == 'O') {
    vec3.set(out, 1, 0, 0);
    return out;
  }
  if (ele == 'S') {
    vec3.set(out, 0.8, 0.8, 0);
    return out;
  }
  if (ele == 'CA') {
    vec3.set(out, 0.533, 0.533, 0.666);
    return out;
  }
  vec3.set(out, 1, 0, 1);
  return out;
}

function cpk_color() {
  return function(atom, out, index) {
    color_for_element(atom.element(), out);
  }
}


var cubic_hermite_interpolate = (function() {
  var p = vec3.create();
  return function (out, p_k, m_k, p_kp1, m_kp1, t, index) {
    var tt = t*t;
    var three_minus_two_t = 3.0 - 2.0*t;
    var h01 = tt*three_minus_two_t;
    var h00 = 1.0 - h01;
    var h10 = tt*(t - 2.0)+t;
    var h11 = tt*(t - 1.0);
    vec3.copy(p, p_k);
    vec3.scale(p, p, h00);
    vec3.scaleAndAdd(p, p, m_k, h10);
    vec3.scaleAndAdd(p, p, p_kp1, h01);
    vec3.scaleAndAdd(p, p, m_kp1, h11);
    out[index] = p[0];
    out[index+1] = p[1];
    out[index+2] = p[2];
}
})();


// interpolates the given list of points (stored in a Float32Array) with a 
// Cubic Hermite spline using the method of Catmull and Rom to calculate the 
// tangents.
function catmull_rom_spline(points, num, strength, circular) {
  circular = circular || false;
  strength = strength || 0.5;
  if (circular) {
    var out = new Float32Array(points.length*num);
  } else {
    var out = new Float32Array((points.length-3)*num);
  }
  var index = 0;
  var delta_t = 1.0/num;
  var m_k = vec3.create(), m_kp1 = vec3.create(); // tangents at k-1 and k+1
  var p_k = vec3.create(), p_kp1 = vec3.create(), 
      p_kp2 = vec3.create(), p_kp3 = vec3.create(); 

  vec3.set(p_kp1, points[0], points[1], points[2]);
  vec3.set(p_kp2, points[3], points[4], points[5]);
  if (circular) {
    vec3.set(p_k,  points[points.length-3], points[points.length-2], 
             points[points.length-1]);
    vec3.sub(m_k, p_kp2, p_k);
    vec3.scale(m_k, m_k, strength);
  } else {
    vec3.set(p_k,   points[0], points[1], points[2]);
    vec3.set(m_k, 0, 0, 0);
  }
  for (var i = 1, e = points.length/3-1; i < e; ++i) {
    vec3.set(p_kp3, points[3*(i+1)], points[3*(i+1)+1], points[3*(i+1)+2]);
    vec3.sub(m_kp1, p_kp3, p_kp1);
    vec3.scale(m_kp1, m_kp1, strength);
    for (var j = 0; j < num; ++j) {
      var t = delta_t*j;
      cubic_hermite_interpolate(out, p_kp1, m_k, p_kp2, m_kp1, t, index);
      index+=3;
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
  for (var j = 0; j < num; ++j) {
    var t = delta_t*j;
    cubic_hermite_interpolate(out, p_kp1, m_k, p_kp2, m_kp1, t, index);
    index+=3;
  }
  if (!circular) {
    out[index] = points[points.length-3];
    out[index+1] = points[points.length-2];
    out[index+2] = points[points.length-1];
    return out;
  }
  vec3.copy(p_k, p_kp1);
  vec3.copy(p_kp1, p_kp2);
  vec3.copy(p_kp2, p_kp3);
  vec3.copy(m_k, m_kp1);
  vec3.set(p_kp3, points[3], points[4], points[5]);
  vec3.sub(m_kp1, p_kp3, p_kp1);
  vec3.scale(m_kp1, m_kp1, strength);
  for (var j = 0; j < num; ++j) {
    var t = delta_t*j;
    cubic_hermite_interpolate(out, p_kp1, m_k, p_kp2, m_kp1, t, index);
    index+=3;
  }
  return out;
}


var LineGeom = function(gl) {
  var self = {
    data : [],
    ready : false,
    interleaved_buffer : gl.createBuffer(),
    num_lines : 0
  };

  return {
    draw : function(shader_program) {
      this.bind();
      var vert_attrib = gl.getAttribLocation(shader_program, 'attr_pos');
      gl.enableVertexAttribArray(vert_attrib);
      gl.vertexAttribPointer(vert_attrib, 3, gl.FLOAT, false, 6*4, 0*4);
      var clr_attrib = gl.getAttribLocation(shader_program, 'attr_color');
      gl.vertexAttribPointer(clr_attrib, 3, gl.FLOAT, false, 6*4, 3*4);
      gl.enableVertexAttribArray(clr_attrib);
      gl.drawArrays(gl.LINES, 0, self.num_lines*2);
      gl.disableVertexAttribArray(vert_attrib);
      gl.disableVertexAttribArray(clr_attrib);
    },

    requires_outline_pass : function() { return false; },
    // prepare data for rendering. if the buffer data was modified, this 
    // synchronizes the corresponding GL array buffers.
    bind : function() {
      gl.bindBuffer(gl.ARRAY_BUFFER, self.interleaved_buffer);
      if (!self.ready) {
        var float_array = new Float32Array(self.data);
        gl.bufferData(gl.ARRAY_BUFFER, float_array, gl.STATIC_DRAW);
        self.ready = true;
        // clear original data. it's not used anymore
        self.data = []
      }
    },
    add_line : function(start_pos, start_color, end_pos, end_color) {
     self.data.push(start_pos[0]); 
     self.data.push(start_pos[1]); 
     self.data.push(start_pos[2]); 
     self.data.push(start_color[0]);
     self.data.push(start_color[1]);
     self.data.push(start_color[2]);

     self.data.push(end_pos[0]); 
     self.data.push(end_pos[1]); 
     self.data.push(end_pos[2]); 
     self.data.push(end_color[0]);
     self.data.push(end_color[1]);
     self.data.push(end_color[2]);
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
  for (var i = 0; i < self.stacks; ++i) {
    var radius = Math.sin(i*vert_angle);
    var z = Math.cos(i*vert_angle);
    for (var j = 0; j < self.arcs; ++j) {
      var nx = radius*Math.cos(j*horz_angle);
      var ny = radius*Math.sin(j*horz_angle);
      self.verts[3*(j+i*self.arcs)] = nx;
      self.verts[3*(j+i*self.arcs)+1] = ny;
      self.verts[3*(j+i*self.arcs)+2] = z;
    }
  }
  var index = 0;
  for (var i = 0; i < self.stacks-1; ++i) {
    for (var j = 0; j < self.arcs; ++j) {
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
    add_transformed : function(geom, center, radius, color) {
      var base_index = geom.num_verts();
      for (var i = 0; i < self.stacks*self.arcs; ++i) {
        vec3.set(normal, self.verts[3*i], self.verts[3*i+1], 
                 self.verts[3*i+2]);
        vec3.copy(pos, normal);
        vec3.scale(pos, pos, radius);
        vec3.add(pos, pos, center);
        geom.add_vertex(pos, normal, color);
      }
      for (var i = 0; i < self.indices.length/3; ++i) {
        geom.add_triangle(base_index+self.indices[i*3], 
                          base_index+self.indices[i*3+1], 
                          base_index+self.indices[i*3+2]);
      }
    },
    num_indices : function() { return self.indices.length; },
    num_vertices : function() { return self.verts.length; }
  };
}

// A tube profile is a cross-section of a tube, e.g. a circle or a 'flat' square. They
// are used to control the style of helices, strands and coils for the cartoon
// render mode. 
var TubeProfile = function(points, num, strength) {

  var interpolated = catmull_rom_spline(points, num, strength, true);

  var self = {
    indices : new Uint16Array(interpolated.length*2),
    verts : interpolated,
    normals : new Float32Array(interpolated.length),
    arcs : interpolated.length/3
  };

  var normal = vec3.create();
  for (var i = 0; i < self.arcs; ++i) {
    var i_prev = i == 0 ? self.arcs-1 : i-1;
    var i_next = i == self.arcs-1 ? 0 : i+1;
    normal[0] = self.verts[3*i_next+1] - self.verts[3*i_prev+1];
    normal[1] = self.verts[3*i_prev] - self.verts[3*i_next];
    vec3.normalize(normal, normal);
    self.normals[3*i] = normal[0];
    self.normals[3*i+1] = normal[1];
    self.normals[3*i+2] = normal[2];
  }

  for (var i = 0; i < self.arcs; ++i) {
    self.indices[6*i] = i;
    self.indices[6*i+1] = i+self.arcs;
    self.indices[6*i+2] = ((i+1) % self.arcs) + self.arcs;
    self.indices[6*i+3] = i;
    self.indices[6*i+4] = ((i+1) % self.arcs) + self.arcs;
    self.indices[6*i+5] = (i+1) % self.arcs;
  }

  var pos = vec3.create(), normal = vec3.create();
  return {
    add_transformed : function(geom, center, radius, rotation, color, first) {
      var base_index = geom.num_verts() - self.arcs;
      for (var i = 0; i < self.arcs; ++i) {
        vec3.set(pos, radius*self.verts[3*i], radius*self.verts[3*i+1], 
                 0.0);
        vec3.transformMat3(pos, pos, rotation);
        vec3.add(pos, pos, center);
        vec3.set(normal, self.normals[3*i], self.normals[3*i+1], 0.0);
        vec3.transformMat3(normal, normal, rotation);
        geom.add_vertex(pos, normal, color);
      }
      if (first) {
        return;
      }
      for (var i = 0; i < self.indices.length/3; ++i) {
        geom.add_triangle(base_index+self.indices[i*3], base_index+self.indices[i*3+1], 
                          base_index+self.indices[i*3+2]);
      }
    }
  };
}

var R = 0.7071;
var COIL_POINTS = [
  -R, -R, 0,
   R, -R, 0,
   R, R, 0,
  -R,  R, 0
];


var HELIX_POINTS = [
  -6*R, -1.5*R, 0,
   6*R, -1.5*R, 0,
   6*R, 1.5*R, 0,
  -6*R,  1.5*R, 0
];

var ProtoCylinder = function(arcs) {
  var self = {
    arcs : arcs,
    indices : new Uint16Array(arcs*3*2),
    verts : new Float32Array(3*arcs*2),
    normals : new Float32Array(3*arcs*2)
  };
  var angle = Math.PI*2/self.arcs
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
  for (var i = 0; i < self.arcs; ++i) {
    self.indices[6*i] = (i) % self.arcs;
    self.indices[6*i+1] = arcs+((i+1) % self.arcs);
    self.indices[6*i+2] = (i+1) % self.arcs;

    self.indices[6*i+3] = (i) % self.arcs;
    self.indices[6*i+4] = arcs+((i) % self.arcs);
    self.indices[6*i+5] = arcs+((i+1) % self.arcs);
  }
  return {
    add_transformed : function(geom, center, length, radius, rotation, clr_one, clr_two) {
      var base_index = geom.num_verts();
      var pos = vec3.create(), normal = vec3.create(), color;
      for (var i = 0; i < 2*self.arcs; ++i) {
        vec3.set(pos, radius*self.verts[3*i], radius*self.verts[3*i+1], 
                 length*self.verts[3*i+2]);
        vec3.transformMat3(pos, pos, rotation);
        vec3.add(pos, pos, center);
        vec3.set(normal, self.normals[3*i], self.normals[3*i+1], self.normals[3*i+2]);
        vec3.transformMat3(normal, normal, rotation);
        geom.add_vertex(pos, normal, i < self.arcs ? clr_one : clr_two);
      }
      for (var i = 0; i < self.indices.length/3; ++i) {
        geom.add_triangle(base_index+self.indices[i*3], base_index+self.indices[i*3+1], 
                          base_index+self.indices[i*3+2]);
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
}

SceneNode.prototype.draw = function(shader_program, outline_pass) {
  for (var i = 0; i < this._children.length; ++i) {
    if (!outline_pass || this._children[i].requires_outline_pass())
      this._children[i].draw(shader_program, outline_pass);
  }
}

// an (indexed) mesh geometry container.
//
// stores the vertex data in interleaved format. not doing so has severe 
// performance penalties in WebGL, and by severe I mean orders of magnitude 
// slower than using an interleaved array.
var MeshGeom = function(gl) {
  var self = {
    interleaved_buffer : gl.createBuffer(),
    index_buffer : gl.createBuffer(),
    vert_data : [],
    index_data : [],
    num_triangles : 0,
    num_verts : 0,
    ready : false
  };

  return {
    num_verts : function() { return self.num_verts; },
    requires_outline_pass : function() { return true; },
    draw: function(shader_program) {
      this.bind();
      var pos_attrib = gl.getAttribLocation(shader_program, 'attr_pos');
      gl.enableVertexAttribArray(pos_attrib);
      gl.vertexAttribPointer(pos_attrib, 3, gl.FLOAT, false, 9*4, 0*4);

      var normal_attrib = gl.getAttribLocation(shader_program, 'attr_normal');
      if (normal_attrib !== -1) {
        gl.enableVertexAttribArray(normal_attrib);
        gl.vertexAttribPointer(normal_attrib, 3, gl.FLOAT, false, 9*4, 3*4);
      }

      var clr_attrib = gl.getAttribLocation(shader_program, 'attr_color');
      if (clr_attrib !== -1) {
        gl.vertexAttribPointer(clr_attrib, 3, gl.FLOAT, false, 9*4, 6*4);
        gl.enableVertexAttribArray(clr_attrib);
      }
      gl.drawElements(gl.TRIANGLES, self.num_triangles*3, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(pos_attrib);
      if (clr_attrib !==-1)
        gl.disableVertexAttribArray(clr_attrib);
      if (normal_attrib !== -1)
        gl.disableVertexAttribArray(normal_attrib);
    },
    add_vertex : function(pos, normal, color) {
      // pushing all values at once seems to be more efficient than pushing
      // separately. resizing the vert_data prior and setting the elements
      // is substantially slower.
      self.vert_data.push(pos[0], pos[1], pos[2], 
                          normal[0], normal[1], normal[2],
                          color[0], color[1], color[2]);
      self.num_verts += 1;
    },
    add_triangle : function(idx1, idx2, idx3) {
      self.index_data.push(idx1, idx2, idx3)
      self.num_triangles +=1;
    },
    bind : function() {
      gl.bindBuffer(gl.ARRAY_BUFFER, self.interleaved_buffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.index_buffer);
      if (!self.ready) {
        var float_array = new Float32Array(self.vert_data);
        gl.bufferData(gl.ARRAY_BUFFER, float_array, gl.STATIC_DRAW);
        var index_array = new Uint16Array(self.index_data);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index_array, gl.STATIC_DRAW);
        self.ready = true;
        self.index_data = [];
        self.vert_data = [];
      }
    }
  };
};

var Cam = function(gl) {
  var self = {
    projection : mat4.create(),
    modelview : mat4.create(),
    near : 0.1,
    far : 400.0,
    fog_near : -5,
    fog_far : 10,
    fog_color : vec3.fromValues(1, 1, 1),
    center : vec3.create(),
    zoom : 50,
    rotation : mat4.create(),
    translation : mat4.create(),
    update_mat : true
  }; 


  function update_if_needed() {
    if (!self.update_mat) {
      return;
    }
    mat4.identity(self.modelview);
    mat4.translate(self.modelview, self.modelview, 
                   [-self.center[0], -self.center[1], -self.center[2]]);
    mat4.mul(self.modelview, self.rotation, self.modelview);
    mat4.identity(self.translation);
    mat4.translate(self.translation, self.translation, [0,0, -self.zoom]);
    mat4.mul(self.modelview, self.translation, self.modelview);
    self.update_mat = false;
  }

  mat4.perspective(self.projection, 45.0, gl.viewportWidth / gl.viewportHeight, 
                   self.near, self.far);
  mat4.translate(self.modelview, self.modelview, [0, 0, -20]);
  return {

    set_center : function(point) {
      self.update_mat = true;
      vec3.copy(self.center, point);
    },
    rotate_z : function(delta) {
      self.update_mat = true;
      var tm = mat4.create();
      mat4.rotate(tm, tm, delta, [0,0,1]);
      mat4.mul(self.rotation, tm, self.rotation);
    },
    rotate_x: function(delta) {
      self.update_mat = true;
      var tm = mat4.create();
      mat4.rotate(tm, tm, delta, [1,0,0]);
      mat4.mul(self.rotation, tm, self.rotation);
    },
    rotate_y : function(delta) {
      self.update_mat = true;
      var tm = mat4.create();
      mat4.rotate(tm, tm, delta, [0,1,0]);
      mat4.mul(self.rotation, tm, self.rotation);
    },
    zoom : function(delta) {
      self.update_mat = true;
      self.zoom += delta;
    },

    bind : function(shader) {
      update_if_needed();
      gl.useProgram(shader);
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      shader.projection = gl.getUniformLocation(shader, 'projection_mat');
      shader.modelview = gl.getUniformLocation(shader, 'modelview_mat');
      gl.uniformMatrix4fv(shader.projection, false, self.projection);
      gl.uniformMatrix4fv(shader.modelview, false, self.modelview);
      gl.uniform1f(gl.getUniformLocation(shader, 'fog_far'),
                    self.fog_far+self.zoom);
      gl.uniform1f(gl.getUniformLocation(shader, 'fog_near'),
                    self.fog_near+self.zoom);
      gl.uniform3fv(gl.getUniformLocation(shader, 'fog_color'),
                    self.fog_color);
    }
  };
};


function PV(dom_element, opts) {
  opts = opts || {}
  this._options = {
    width : opts.width || 500,
    height: opts.height || 500,
    antialias : opts.antialias || true,
    quality : opts.quality || 'low'
  }
  this._ok = false;
  this.quality(this._options.quality);
  this._canvas = document.createElement('canvas');
  this._canvas.width = this._options.width;
  this._canvas.height = this._options.height;
  this._dom_element = dom_element
  this._dom_element.appendChild(this._canvas);

  document.addEventListener('DOMContentLoaded', 
                            bind(this, this._init_pv));
}

PV.prototype.gl = function() { return this._gl; }

PV.prototype.ok = function() { return this._ok; }


PV.prototype.options = function(opt_name) {
  return this._options[opt_name];
}

PV.prototype.quality = function(qual) {
  this._options.quality = qual;
  console.info('setting quality to', qual);
  if (qual == 'high') {
    this._options.arc_detail = 4;
    this._options.sphere_detail = 16;
    this._options.spline_detail = 8;
    return;
  } 
  if (qual == 'medium') {
    this._options.arc_detail = 3;
    this._options.sphere_detail = 10;
    this._options.spline_detail = 4;
    return;
  }
  if (qual == 'low') {
    this._options.arc_detail = 2;
    this._options.sphere_detail = 8;
    this._options.spline_detail = 2;
    return;
  }
  console.error('invalid quality argument', qual);
}

PV.prototype._initGL = function () {
    // todo wrap in try-catch for browser which don't support WebGL
    this._gl = this._canvas.getContext('experimental-webgl', 
                                      { antialias: this._options.antialias });
    if (!this._gl) {
      console.error('WebGL not supported');
      return false;
    }
    this._gl.viewportWidth = this._options.width;
    this._gl.viewportHeight = this._options.height;

    this._gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this._gl.lineWidth(2.0);
    this._gl.cullFace(this._gl.FRONT);
    this._gl.enable(this._gl.CULL_FACE);
    this._gl.enable(this._gl.DEPTH_TEST);
    return true;
}

PV.prototype._shader_from_string = function(shader_code, type) {
  var shader;
  if (type === 'fragment') {
    shader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
  } else if (type === 'vertex') {
    shader = this._gl.createShader(this._gl.VERTEX_SHADER);
  } else {
    console.error('could not determine type for shader');
    return null;
  }
  this._gl.shaderSource(shader, shader_code);
  this._gl.compileShader(shader);
  if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
    console.error(this._gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

PV.prototype._init_shader = function(vert_shader, frag_shader) {
  var frag_shader = this._shader_from_string(frag_shader, 'fragment');
  var vert_shader = this._shader_from_string(vert_shader, 'vertex');
  var shader_program = this._gl.createProgram();
  this._gl.attachShader(shader_program, vert_shader);
  this._gl.attachShader(shader_program, frag_shader);
  this._gl.linkProgram(shader_program);
  if (!this._gl.getProgramParameter(shader_program, this._gl.LINK_STATUS)) {
    console.error('could not initialise shaders')
  }
  return shader_program;
};

PV.prototype._mouse_up = function(event) {
  this._canvas.removeEventListener('mousemove', this._mouse_move_listener, 
                                   false);
  this._canvas.removeEventListener('mouseup', this._mouse_up_listener, false);
  document.removeEventListener('mousemove', this._mouse_move_listener);
}


PV.prototype._init_pv = function() {
  if (!this._initGL()) {
    this._dom_element.removeChild(this._canvas);
    this._dom_element.innerHTML = WEBGL_NOT_SUPPORTED;
    this._dom_element.style.width = this._options.width+'px';
    this._dom_element.style.height = this._options.height+'px';
    return false; 
  }
  this._ok = true;
  this._cam = Cam(this._gl);
  this._hemilight_shader = this._init_shader(HEMILIGHT_VS, HEMILIGHT_FS);
  this._outline_shader = this._init_shader(OUTLINE_VS, OUTLINE_FS);
  this._mouse_move_listener = bind(this, this._mouse_move);
  this._mouse_up_listener = bind(this, this._mouse_up);
  // Firefox responds to the wheel event, whereas other browsers listen to
  // the mousewheel event. Register different event handlers, depending on
  // what properties are available.
  if ('onwheel' in this._canvas) {
    this._canvas.addEventListener('wheel', bind(this, this._mouse_wheel_ff), 
                                  false);
  } else {
    this._canvas.addEventListener('mousewheel', bind(this, this._mouse_wheel), 
                                  false);
  }
  this._canvas.addEventListener('mousedown', bind(this, this._mouse_down), 
                                false);
  return true;
}

PV.prototype._add = function(what) {
  this._objects.push(what);
  this.requestRedraw();
}

PV.prototype.requestRedraw = function() {
  requestAnimFrame(bind(this, this._draw));
}

PV.prototype._draw = function() {

  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

  this._cam.bind(this._hemilight_shader);
  this._gl.cullFace(this._gl.FRONT);
  this._gl.enable(this._gl.CULL_FACE);
  for (var i=0; i<this._objects.length; i+=1) {
    this._objects[i].draw(this._hemilight_shader, false);
  }
  this._cam.bind(this._outline_shader);
  this._gl.cullFace(this._gl.BACK);
  this._gl.enable(this._gl.CULL_FACE);
  for (var i=0; i<this._objects.length; i+=1) {
    this._objects[i].draw(this._outline_shader, true);
  }
}



PV.prototype.center_on = function(what) {
  this._cam.set_center(what.center());
}

PV.prototype.clear = function() {
  this._objects = [];
}

PV.prototype._parse_helix_record = function(line) {
  // FIXME: handle insertion codes
  var frst_num = parseInt(line.substr(21, 4));
  var last_num = parseInt(line.substr(33, 4));
  var chain_name = line[19];
  return { first : frst_num, last : last_num, chain_name : chain_name };
}

PV.prototype._parse_sheet_record = function(line) {
  // FIXME: handle insertion codes
  var frst_num = parseInt(line.substr(22, 4));
  var last_num = parseInt(line.substr(33, 4));
  var chain_name = line[21];
  return { first : frst_num, last : last_num, chain_name : chain_name };
}

// a truly minimalistic PDB parser. It will die as soon as the input is 
// not well-formed. it only reads ATOM, HETATM, HELIX and SHEET records, 
// everything else is ignored. in case of multi-model files, only the 
// first model is read.
//
// FIXME: load PDB currently spends a substantial amount of time creating
// the vec3 instances for the atom positions. it's possible that it's
// cheaper to initialize a bulk buffer once and create buffer views to
// that data for each atom position. since the atom's lifetime is bound to
// the parent structure, the buffer could be managed on that level and
// released once the structure is deleted.
PV.prototype.pdb = function(text) {
  if (!this._ok) {
    console.error('can not load PDB. Viewer not properly initialized');
    return false;
  }
  console.time('PV.pdb'); 
  var structure = new Mol(this);
  var curr_chain = null;
  var curr_res = null;
  var curr_atom = null;
  
  var helices = [];
  var sheets = [];
  
  function parse_and_add_atom(line, hetatm) {
    var alt_loc = line[16];
    if (alt_loc!=' ' && alt_loc!='A') {
      return;
    }
    var chain_name = line[21];
    var res_name = line.substr(17, 3);
    var atom_name = line.substr(12, 4).trim();
    var rnum_num = parseInt(line.substr(22, 4));
    var ins_code = line[26];
    var update_residue = false;
    var update_chain = false;
    if (!curr_chain || curr_chain.name() != chain_name) {
      update_chain = true;
      update_residue = true;
    }
    if (!curr_res || curr_res.num() != rnum_num) {
      update_residue = true;
    }
    if (update_chain) {
      curr_chain = structure.add_chain(chain_name);
    }
    if (update_residue) {
      curr_res = curr_chain.add_residue(res_name, rnum_num);
    }
    var pos = vec3.create();
    for (var i=0;i<3;++i) {
      pos[i] = (parseFloat(line.substr(30+i*8, 8)));
    }
    curr_res.add_atom(atom_name, pos, line.substr(76, 2).trim());
  }
  var lines = text.split(/\r\n|\r|\n/g);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var record_name = line.substr(0, 6);

    if (record_name == 'ATOM  ') {
      parse_and_add_atom(line, false);
      continue;
    }
    if (record_name == 'HETATM') {
      parse_and_add_atom(line, true);
      continue;
    }
    if (record_name == 'HELIX ') {
      helices.push(this._parse_helix_record(line));
      continue;
    }
    if (record_name == 'SHEET ') {
      sheets.push(this._parse_sheet_record(line));
      continue;
    }
    if (record_name == 'END') {
      break;
    }
  }
  for (var i = 0; i < sheets.length; ++i) {
    var sheet = sheets[i];
    var chain = structure.chain(sheet.chain_name);
    if (chain) {
      chain.assign_ss(sheet.first, sheet.last, 'E');
    }
  }
  for (var i = 0; i < helices.length; ++i) {
    var helix = helices[i];
    var chain = structure.chain(helix.chain_name);
    if (chain) {
      chain.assign_ss(helix.first, helix.last, 'H');
    }
  }
  structure.derive_connectivity();
  console.timeEnd('PV.pdb');

  return structure;
};


PV.prototype._mouse_wheel = function(event) {
  this._cam.zoom(event.wheelDelta*0.05);
  this.requestRedraw();
}

PV.prototype._mouse_wheel_ff = function(event) {
  this._cam.zoom(-event.deltaY*0.05);
  this.requestRedraw();
}

PV.prototype._mouse_down = function(event) {
  event.preventDefault();
  this._canvas.addEventListener('mousemove', this._mouse_move_listener, false);
  document.addEventListener('mousemove', this._mouse_move_listener, false);
  this._canvas.addEventListener('mouseup', this._mouse_up_listener, false);
  document.addEventListener('mouseup', this._mouse_up_listener, false);
  this._last_mouse_pos = { x: event.pageX, y: event.pageY };
}

PV.prototype._mouse_move = function(event) {
  var new_mouse_pos = { x : event.pageX, y : event.pageY };
  var delta = { x : new_mouse_pos.x - this._last_mouse_pos.x,
                y : new_mouse_pos.y - this._last_mouse_pos.y};
                
  var speed = 0.005;
  this._cam.rotate_x(speed*delta.y);
  this._cam.rotate_y(speed*delta.x);
  this._last_mouse_pos = new_mouse_pos;
  this.requestRedraw();
}

// derive a rotation matrix which rotates the z-axis onto tangent. when
// left is given and use_hint is true, x-axis is chosen to be as close
// as possible to left.
//
// upon returning, left will be modified to contain the updated left
// direction.
var build_rotation = (function() {


  return function(rotation, tangent, left, up, use_left_hint) {
    if (use_left_hint) {
      vec3.cross(up, tangent, left);
    } else {
      vec3.ortho(up, tangent);
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
})();

function Mol(pv) {
  this._chains = [];
  this._pv = pv;
  this._next_atom_index = 0;
}

function MolBase() {
}

MolBase.prototype.each_residue = function(callback) {
  for (var i = 0; i < this._chains.length; i+=1) {
    this._chains[i].each_residue(callback);
  }
}

MolBase.prototype.each_atom = function(callback) {
  for (var i = 0; i < this._chains.length; i+=1) {
    this._chains[i].each_atom(callback);
  }
}

MolBase.prototype.line_trace = function(opts) {
  console.time('MolBase.line_trace');
  opts = opts || {};
  var options = {
    color : opts.color || uniform_color([1, 0, 1])
  }
  var clr_one = vec3.create(), clr_two = vec3.create();
  var line_geom = LineGeom(this._pv.gl());
  for (var ci  in this._chains) {
    var chain = this._chains[ci];
    chain.each_backbone_trace(function(trace) {
      for (var i = 1; i < trace.length; ++i) {
        options.color(trace[i-1].atom('CA'), clr_one, 0);
        options.color(trace[i].atom('CA'), clr_two, 0);
        line_geom.add_line(trace[i-1].atom('CA').pos(), clr_one, 
                           trace[i-0].atom('CA').pos(), clr_two);
      }
    });
  }
  this._pv._add(line_geom);
  console.time('MolBase.line_trace');
  return line_geom;
}


MolBase.prototype.spheres = function(opts) {
  console.time('MolBase.spheres');
  opts = opts || {};
  var options = {
    color : opts.color || cpk_color()
  }
  var clr = vec3.create();
  var geom = MeshGeom(this._pv.gl());
  var sphere_detail = this._pv.options('sphere_detail');
  var proto_sphere = ProtoSphere(sphere_detail, sphere_detail);
  this.each_atom(function(atom) {
    options.color(atom, clr, 0);
    proto_sphere.add_transformed(geom, atom.pos(), 1.5, clr);
  });
  console.timeEnd('MolBase.spheres');
  this._pv._add(geom);
  return geom;
}

MolBase.prototype.RENDER_MODES = [
  'sline', 'line', 'trace', 'line_trace', 'cartoon', 'tube',
  'spheres'
]


/// simple dispatcher which allows to render using a certain style.
//  will bail out if the render mode does not exist.
MolBase.prototype.render_as = function(mode, opts) {
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
  return this[mode](opts);

}

MolBase.prototype.sline = function(opts) {
  console.time('MolBase.sline');
  opts = opts || {};
  var options = {
    color : opts.color || uniform_color([1, 0, 1]),
    spline_detail : opts.spline_detail || this._pv.options('spline_detail'),
    strength: opts.strength || 0.5
  };
  var line_geom = LineGeom(this._pv.gl());
  var pos_one = vec3.create(), pos_two = vec3.create();
  var clr_one = vec3.create(), clr_two = vec3.create();
  for (var ci  in this._chains) {
    var chain = this._chains[ci];
    chain.each_backbone_trace(function(trace) {
      var positions = new Float32Array(trace.length*3);
      var colors = new Float32Array(trace.length*3);
      for (var i = 0; i < trace.length; ++i) {
        var atom = trace[i].atom('CA');
        options.color(atom, colors, 3*i);
        var p = atom.pos();
        positions[i*3] = p[0];
        positions[i*3+1] = p[1];
        positions[i*3+2] = p[2];
      }
      var sdiv = catmull_rom_spline(positions, options.spline_detail, 
                                    options.strength, false);
      var interp_colors = interpolate_color(colors, options.spline_detail);
      for (var i = 1, e = sdiv.length/3; i < e; ++i) {
        pos_one[0] = sdiv[3*(i-1)];
        pos_one[1] = sdiv[3*(i-1)+1];
        pos_one[2] = sdiv[3*(i-1)+2];
        pos_two[0] = sdiv[3*(i-0)];
        pos_two[1] = sdiv[3*(i-0)+1];
        pos_two[2] = sdiv[3*(i-0)+2];

        clr_one[0] = interp_colors[3*(i-1)];
        clr_one[1] = interp_colors[3*(i-1)+1];
        clr_one[2] = interp_colors[3*(i-1)+2];
        clr_two[0] = interp_colors[3*(i-0)];
        clr_two[1] = interp_colors[3*(i-0)+1];
        clr_two[2] = interp_colors[3*(i-0)+2];
        line_geom.add_line(pos_one, clr_one, pos_two, clr_two);
      }
    });
  }
  console.timeEnd('MolBase.sline');
  this._pv._add(line_geom);
  return line_geom;
}


MolBase.prototype._cartoon_add_tube = (function() {
  var rotation = mat3.create();
  var up = vec3.create();

  return function(geom, pos, left, res, tangent, color, first, options) {
    var ss = res.ss();
    var prof = options.coil_profile
    if (ss == 'H' && !options.force_tube) {
      prof = options.helix_profile;
    } else if (ss == 'E' && !options.force_tube) {
      prof = options.strand_profile;
    } else {
      if (first) {
        vec3.ortho(left, tangent);
      } else {
        vec3.cross(left, up, tangent);
      }
    }

    build_rotation(rotation, tangent, left, up, true);

    prof.add_transformed(geom, pos, options.radius, rotation, color, first);
  }
})();


// INTERNAL: fills positions, normals and colors from the information found in 
// trace. The 3 arrays must already have the correct size (3*trace.length).
MolBase.prototype._color_pos_normals_from_trace = function(trace, colors, 
                                                           positions, normals, 
                                                           strengths, options) {
  var last_x = 0, last_y = 0, last_z = 0;
  for (var i = 0; i < trace.length; ++i) {
    var p = trace[i].atom('CA').pos();
    var c = trace[i].atom('C').pos();
    var o = trace[i].atom('O').pos();
    strengths[i] = trace[i].ss() === 'E' ? 0.5 : 1.0;
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
    last_x = dx;
    last_y = dy;
    last_z = dz;
    normals[i*3]   = positions[3*i]+dx*div; 
    normals[i*3+1] = positions[3*i+1]+dy*div; 
    normals[i*3+2] = positions[3*i+2]+dz*div;
    options.color(trace[i].atom('CA'), colors, i*3);
  }
}

// constructs a cartoon representation for all consecutive backbone traces found
// in the given chain. 
MolBase.prototype._cartoon_for_chain = (function() {

  var tangent = vec3.create(), pos = vec3.create(), left =vec3.create(),
      color = vec3.create(), normal = vec3.create();

  return function(chain, gl, options) {

    var traces = chain.backbone_traces();
    if (traces.length === 0) {
      return null;
    }
    var geom = MeshGeom(gl);

    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];

      var positions = new Float32Array(trace.length*3);
      var colors = new Float32Array(trace.length*3);
      var normals = new Float32Array(trace.length*3);
      var strenghts = new Float32Array(trace.length);

      mol._color_pos_normals_from_trace(trace, colors, positions, normals, 
                                        strenghts, options);
      var sdiv = catmull_rom_spline(positions, options.spline_detail, 
                                    options.strength, false);
      var normal_sdiv = catmull_rom_spline(normals, options.spline_detail,
                                           options.strength, false);
      var interp_colors = interpolate_color(colors, options.spline_detail);

      // handle start of trace. this could be moved inside the for-loop, but
      // at the expense of a conditional inside the loop. unrolling is 
      // slightly faster.
      //
      // we repeat the following steps for the start, central section and end 
      // of the profile: (a) assign position, normal, tangent and color, (b)
      // add tube (or rectangular profile for helices and strands).
      vec3.set(tangent, sdiv[3]-sdiv[0], sdiv[4]-sdiv[1], sdiv[5]-sdiv[2]);
      vec3.set(pos, sdiv[0], sdiv[1], sdiv[2]);
      vec3.set(normal, normal_sdiv[0]-sdiv[0], 
               normal_sdiv[1]-sdiv[0], normal_sdiv[2]-sdiv[2]);
      vec3.normalize(tangent, tangent);
      vec3.normalize(normal, normal);
      vec3.set(color, interp_colors[0], interp_colors[1], interp_colors[2]);

      this._cartoon_add_tube(geom, pos, normal, trace[0], tangent, color, 
                             true, options);

      // handle the bulk of the trace
      for (var i = 1, e = sdiv.length/3 - 1; i < e; ++i) {
        vec3.set(pos, sdiv[3*i], sdiv[3*i+1], sdiv[3*i+2]);
        vec3.set(normal, normal_sdiv[3*i]-sdiv[3*i], 
                 normal_sdiv[3*i+1]-sdiv[3*i+1],
                 normal_sdiv[3*i+2]-sdiv[3*i+2]);

        vec3.normalize(normal, normal);
        vec3.set(tangent, sdiv[3*(i+1)]-sdiv[3*(i-1)],
                  sdiv[3*(i+1)+1]-sdiv[3*(i-1)+1],
                  sdiv[3*(i+1)+2]-sdiv[3*(i-1)+2]);
        vec3.normalize(tangent, tangent);
        vec3.set(color, interp_colors[i*3], interp_colors[i*3+1],
                interp_colors[i*3+2]);
        this._cartoon_add_tube(geom, pos, normal, 
                               trace[Math.floor(i/options.spline_detail)], 
                               tangent, color, false, options);
      }
      var i = sdiv.length;
      // finish trace off, again unrolled for efficiency.
      vec3.set(tangent, sdiv[3*i-3]-sdiv[3*i-6], 
                sdiv[3*i-2]-sdiv[3*i-5],
                sdiv[3*i-1]-sdiv[3*i-4]);

      vec3.set(pos, sdiv[3*i-3], sdiv[3*i-2], 
                sdiv[3*i-1]);
      vec3.set(normal, normal_sdiv[3*i]-sdiv[3*i], 
                normal_sdiv[3*i-3]-sdiv[3*i-3],
                normal_sdiv[3*i-2]-sdiv[3*i-2]);
      vec3.normalize(normal, normal);
      vec3.normalize(tangent, tangent);
      vec3.set(color, interp_colors[interp_colors.length-3],
                interp_colors[interp_colors.length-2],
                interp_colors[interp_colors.length-1]);
                
      this._cartoon_add_tube(geom, pos, normal, trace[trace.length-1], 
                             tangent, color, false, options);
    }
    return geom;
  }
})();

MolBase.prototype.cartoon = function(opts) {
  console.time('Mol.cartoon');
  opts = opts || {};


  var options = {
    color : opts.color || ss(),
    strength: opts.strength || 1.0,
    spline_detail : opts.spline_detail || this._pv.options('spline_detail'),
    arc_detail : opts.arc_detail || this._pv.options('arc_detail'),
    radius : opts.radius || 0.3,
    force_tube: opts.force_tube || false
  };
  options.coil_profile = TubeProfile(COIL_POINTS, options.arc_detail, 1.0);
  options.helix_profile = TubeProfile(HELIX_POINTS, options.arc_detail, 0.1);
  options.strand_profile = TubeProfile(HELIX_POINTS, options.arc_detail, 0.1);

  var node = new SceneNode();
  for (var i = 0; i < this._chains.length; ++i) {
    var geom = this._cartoon_for_chain(this._chains[i], this._pv.gl(), 
                                       options);
    // check that there is anything to be added...
    if (geom) {
      node.add(geom);
    }
  }
  console.timeEnd('Mol.cartoon');
  this._pv._add(node);
  return node;
}

// renders the protein using a smoothly interpolated tube, essentially 
// identical to the cartoon render mode, but without special treatment for 
// helices and strands.
MolBase.prototype.tube = function(opts) {
  opts = opts || {};
  opts.force_tube = true;
  return this.cartoon(opts);
}

MolBase.prototype.lines = function(opts) {
  console.time('MolBase.lines');
  opts = opts || {};
  var options = {
    color : opts.color || cpk_color()
  };
  var mp = vec3.create();
  var line_geom = LineGeom(this._pv.gl());
  var clr = vec3.create();
  this.each_atom(function(atom) {
    // for atoms without bonds, we draw a small cross, otherwise these atoms 
    // would be invisible on the screen.
    if (atom.bonds().length) {
      atom.each_bond(function(bond) {
        bond.mid_point(mp); 
        options.color(bond.atom_one(), clr, 0);
        line_geom.add_line(bond.atom_one().pos(), clr, mp, clr);
        options.color(bond.atom_two(), clr, 0);
        line_geom.add_line(mp, clr, bond.atom_two().pos(), clr);

      });
    } else {
      var cs = 0.2;
      var pos = atom.pos();
      options.color(atom, clr, 0);
      line_geom.add_line([pos[0]-cs, pos[1], pos[2]], clr, 
                         [pos[0]+cs, pos[1], pos[2]], clr);
      line_geom.add_line([pos[0], pos[1]-cs, pos[2]], clr, 
                         [pos[0], pos[1]+cs, pos[2]], clr);
      line_geom.add_line([pos[0], pos[1], pos[2]-cs], clr, 
                         [pos[0], pos[1], pos[2]+cs], clr);
    }
  });
  console.timeEnd('MolBase.lines');
  this._pv._add(line_geom);
  return line_geom;
}

ChainBase.prototype._trace_for_chain = (function() {

  var rotation = mat3.create();

  var dir = vec3.create(), left = vec3.create(), up = vec3.create();
  var clr_one = vec3.create(), clr_two = vec3.create();

  return function(gl, options) {
    var traces = this.backbone_traces();
    if (traces.length === 0) {
      return null;
    }
    var geom = MeshGeom(gl);
    for (var ti = 0; ti < traces.length; ++ti) {
      var trace = traces[ti];

      options.color(trace[0].atom('CA'), clr_one, 0);
      options.proto_sphere.add_transformed(geom, trace[0].atom('CA').pos(), 
                                           options.radius, clr_one);
      for (var i = 1; i < trace.length; ++i) {
        var ca_prev_pos = trace[i-1].atom('CA').pos();
        var ca_this_pos = trace[i].atom('CA').pos();
        options.color(trace[i].atom('CA'), clr_two, 0);
        options.proto_sphere.add_transformed(geom, ca_this_pos, options.radius, 
                                             clr_two);
        vec3.sub(dir, ca_this_pos, ca_prev_pos);
        var length = vec3.length(dir);

        vec3.scale(dir, dir, 1.0/length);

        build_rotation(rotation, dir, left, up, false);

        var mid_point = vec3.clone(ca_prev_pos);
        vec3.add(mid_point, mid_point, ca_this_pos);
        vec3.scale(mid_point, mid_point, 0.5);
        options.proto_cyl.add_transformed(geom, mid_point, length, 
                                          options.radius, rotation, 
                                          clr_one, clr_two);
        vec3.copy(clr_one, clr_two);
      }
    }
    return geom;
  }
})();

MolBase.prototype.trace = function(opts) {
  opts = opts || {}
  var options = {
    color : opts.color || uniform_color([1, 0, 0]),
    radius: opts.radius || 0.3,
    arc_detail : (opts.arc_detail || this._pv.options('arc_detail'))*4,
    sphere_detail : opts.sphere_detail || this._pv.options('sphere_detail')
  }
  var node = new SceneNode();
  options.proto_cyl = ProtoCylinder(options.arc_detail);
  options.proto_sphere = ProtoSphere(options.sphere_detail, 
                                     options.sphere_detail);
  for (var ci = 0; ci < this._chains.length; ++ci) {
    var chain = this._chains[ci];
    var geom = this._chains[ci]._trace_for_chain(this._pv.gl(), options);
    if (geom) {
      node.add(geom);
    }
  }
  this._pv._add(node);
  return node;
}

MolBase.prototype.center = function() {
  var sum = vec3.create();
  var count = 1;
  this.each_atom(function(atom) {
    vec3.add(sum, sum, atom.pos());
    count+=1;
  });
  if (count) {
    vec3.scale(sum, sum, 1/count);
  }
  return sum;
}

Mol.prototype = new MolBase()

Mol.prototype.chains = function() { return this._chains; }

Mol.prototype.residue_select = function(predicate) {
  console.time('Mol.residue_select');
  var view = new MolView(this);
  for (var ci = 0; ci < this._chains.length; ++ci) {
    var chain = this._chains[ci];
    var chain_view = null;
    var residues = chain.residues();
    for (var ri = 0; ri < residues.length; ++ri) {
      if (predicate(residues[ri])) {
        if (!chain_view) {
          chain_view = view.add_chain(chain, false);
        }
        chain_view.add_residue(residues[ri], true);
      }
    }
  }
  console.timeEnd('Mol.residue_select')
  return view;
}

Mol.prototype.select = function(what) {

  if (what == 'protein') {
    return this.residue_select(function(r) { return r.is_aminoacid(); });
  }
  if (what == 'water') {
    return this.residue_select(function(r) { return r.is_water(); });
  }
  if (what == 'ligand') {
    return this.residue_select(function(r) { 
      return !r.is_aminoacid() && !r.is_water();
    });
  }
  return view;
}

Mol.prototype.chain = function(name) { 
  for (var i = 0; i < this._chains.length; ++i) {
    if (this._chains[i].name() == name) {
      return this._chains[i];
    }
  }
  return null;
}

Mol.prototype.next_atom_index = function() {
  var next_index = this._next_atom_index; 
  this._next_atom_index+=1; 
  return next_index; 
}

Mol.prototype.add_chain = function(name) {
  var chain = new Chain(this, name);
  this._chains.push(chain);
  return chain;
}


Mol.prototype.connect = function(atom_a, atom_b) {
  var bond = new Bond(atom_a, atom_b);
  atom_a.add_bond(bond);
  atom_b.add_bond(bond);
  return bond;
}

// determine connectivity structure. for simplicity only connects atoms of the 
// same residue and peptide bonds
Mol.prototype.derive_connectivity = function() {
  console.time('Mol.derive_connectivity');
  var this_structure = this;
  var prev_residue;
  this.each_residue(function(res) {
    var d = vec3.create();
    for (var i = 0; i < res.atoms().length; i+=1) {
    for (var j = 0; j < i; j+=1) {
      var sqr_dist = vec3.sqrDist(res.atom(i).pos(), res.atom(j).pos());
      if (sqr_dist < 1.6*1.6) {
          this_structure.connect(res.atom(i), res.atom(j));
      }
    }
    }
    if (prev_residue) {
    var c_atom = prev_residue.atom('C');
    var n_atom = res.atom('N');
    if (c_atom && n_atom) {
      var sqr_dist = vec3.sqrDist(c_atom.pos(), n_atom.pos());
      if (sqr_dist < 1.6*1.6) {
        this_structure.connect(n_atom, c_atom);
      }
    }
    }
    prev_residue = res;
  });
  console.timeEnd('Mol.derive_connectivity');
}

// add chain to view
MolView.prototype.add_chain = function(chain, recurse) {
  var chain_view = new ChainView(this, chain);
  this._chains.push(chain_view);
  if (recurse) {
    var residues = chain.residues();
    for (var i = 0; i< residues.length; ++i) {
      chain_view.add_residue(residues[i], true);
    }
  }
  return chain_view;
}


function Residue(chain, name, num) {
  this._name = name
  this._num = num;
  this._atoms = [];
  this._ss = 'C';
  this._chain = chain;
}

Residue.prototype = new ResidueBase();

Residue.prototype.name = function() { return this._name; }

Residue.prototype.num = function() { return this._num; }

Residue.prototype.add_atom = function(name, pos, element) {
  var atom = new Atom(this, name, pos, element);
  this._atoms.push(atom);
  return atom;
}

Residue.prototype.ss = function() { return this._ss; }
Residue.prototype.set_ss = function(ss) { this._ss = ss; }

Residue.prototype.atoms = function() { return this._atoms; }
Residue.prototype.chain = function() { return this._chain; }


Residue.prototype.structure = function() { 
  return this._chain.structure(); 
}

function AtomBase() {
}

AtomBase.prototype.name = function() { return this._name; },
AtomBase.prototype.pos = function() { return this._pos; },
AtomBase.prototype.element = function() { return this._element; },
AtomBase.prototype.index = function() { return this._index; },
AtomBase.prototype.each_bond = function(callback) {
  for (var i = 0; i < this._bonds.length; ++i) {
    callback(this._bonds[i]);
  }
}

function Atom(residue, name, pos, element) {
  this._residue = residue;
  this._bonds = [];
  this._name = name;
  this._pos = pos;
  this._element = element;
}

Atom.prototype = new AtomBase();

Atom.prototype.add_bond = function(bond) { this._bonds.push(bond); },
Atom.prototype.name = function() { return this._name; },
Atom.prototype.bonds = function() { return this._bonds; }
Atom.prototype.residue = function() { return this._residue; }
Atom.prototype.structure = function() { return this._residue.structure(); }

var Bond = function(atom_a, atom_b) {
  var self = {
    atom_one : atom_a,
    atom_two : atom_b
  };
  return {
    atom_one : function() { return self.atom_one; },
    atom_two : function() { return self.atom_two; },

    // calculates the mid-point between the two atom positions
    mid_point : function(out) { 
      if (!out) {
        out = vec3.create();
      }
      vec3.add(out, self.atom_one.pos(), self.atom_two.pos());
      vec3.scale(out, out, 0.5);
      return out;
    }
  };
}

return { Viewer: function(elem, options) { return new PV(elem, options); }};
})();

