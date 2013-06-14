function get_element_contents(element) {
  var contents = '';
  var k = element.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      contents += k.textContent;
    }
    k = k.nextSibling;
  }
  return contents;
}

var ortho_vec = (function() {
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


function color_for_element(ele, out) {
  if (!out) {
    out = vec4.create();
  }
  if (ele == 'C') {
    vec4.set(out, 1, 1, 1, 1);
    return out;
  }
  if (ele == 'N') {
    vec4.set(out, 0, 0, 1, 1);
    return out;
  }
  if (ele == 'O') {
    vec4.set(out, 1, 0, 0, 1);
    return out;
  }
  if (ele == 'S') {
    vec4.set(out, 1, 1, 0, 1);
    return out;
  }
  vec4.set(out, 1, 0, 1, 1);
  return out;
}

var LineGeom = function() {
  var self = {
    data : [],
    ready : false,
    interleaved_buffer : gl.createBuffer(),
    num_lines : 0,
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
    },

    // prepare data for rendering. if the buffer data was modified, this synchronizes 
    // the corresponding GL array buffers.
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
    verts : new Float32Array(3*arcs*stacks),
  };
  var vert_angle = Math.PI/(stacks-1);
  var horz_angle = Math.PI*2.0/arcs;
  for (var i = 0; i < self.stacks; ++i) {
    var radius = Math.sin(i*vert_angle);
    var z = Math.cos(i*vert_angle);
    for (var j = 0; j < self.arcs; ++j) {
      var nx = radius*Math.cos(j*horz_angle);
      var ny = radius*Math.sin(j*horz_angle);
      self.verts[3*(j+i*self.arcs)+0] = nx;
      self.verts[3*(j+i*self.arcs)+1] = ny;
      self.verts[3*(j+i*self.arcs)+2] = z;
    }
  }
  var index = 0;
  for (var i = 0; i < self.stacks-1; ++i) {
    for (var j = 0; j < self.arcs; ++j) {
      
      self.indices[index+0] = (i+0)*self.arcs+j+0;
      self.indices[index+1] = (i+0)*self.arcs+((j+1) % self.arcs);
      self.indices[index+2] = (i+1)*self.arcs+j+0;
      index += 3;
      
      self.indices[index+0] = (i+0)*self.arcs+((j+1) % self.arcs);
      self.indices[index+1] = (i+1)*self.arcs+j+0;
      self.indices[index+2] = (i+1)*self.arcs+((j+1) % self.arcs);
      index += 3;
    }
  }
  return {
    add_transformed : function(geom, center, radius) {
      var base_index = geom.num_verts();
      var pos = vec3.create(), normal = vec3.create(), color = vec3.fromValues(1, 1, 1);
      for (var i = 0; i < self.stacks*self.arcs; ++i) {
        vec3.set(normal, self.verts[3*i+0], self.verts[3*i+1], self.verts[3*i+2]);
        vec3.copy(pos, normal);
        vec3.scale(pos, pos, radius);
        vec3.add(pos, pos, center);
        geom.add_vertex(pos, normal, color);
      }
      for (var i = 0; i < self.indices.length/3; ++i) {
        geom.add_triangle(base_index+self.indices[i*3+0], base_index+self.indices[i*3+1], 
                          base_index+self.indices[i*3+2]);
      }
    }
  };
}
var ProtoCylinder = function(arcs) {
  var self = {
    arcs : arcs,
    indices : new Uint16Array(arcs*3*2),
    verts : new Float32Array(3*arcs*2),
    normals : new Float32Array(3*arcs*2),
  };
  var angle = Math.PI*2/self.arcs
  for (var i = 0; i < self.arcs; ++i) {
    var cos_angle = Math.cos(angle*i);
    var sin_angle = Math.sin(angle*i);
    self.verts[3*i+0] = cos_angle;
    self.verts[3*i+1] = sin_angle;
    self.verts[3*i+2] = -0.5;
    self.verts[3*arcs+3*i+0] = cos_angle;
    self.verts[3*arcs+3*i+1] = sin_angle;
    self.verts[3*arcs+3*i+2] = 0.5;
    self.normals[3*i+0] = cos_angle;
    self.normals[3*i+1] = sin_angle;
    self.normals[3*arcs+3*i+0] = cos_angle;
    self.normals[3*arcs+3*i+1] = sin_angle;
  }
  for (var i = 0; i < self.arcs; ++i) {
    self.indices[6*i+0] = (i+0) % self.arcs;
    self.indices[6*i+1] = arcs+((i+1) % self.arcs);
    self.indices[6*i+2] = (i+1) % self.arcs;

    self.indices[6*i+3] = (i+0) % self.arcs;
    self.indices[6*i+4] = arcs+((i+0) % self.arcs);
    self.indices[6*i+5] = arcs+((i+1) % self.arcs);
  }
  return {
    add_transformed : function(geom, center, length, radius, rotation) {
      var base_index = geom.num_verts();
      var pos = vec3.create(), normal = vec3.create(), color = vec3.fromValues(1, 1, 1);
      for (var i = 0; i < 2*self.arcs; ++i) {
        vec3.set(pos, radius*self.verts[3*i+0], radius*self.verts[3*i+1], 
                 length*self.verts[3*i+2]);
        vec3.transformMat3(pos, pos, rotation);
        vec3.add(pos, pos, center);
        vec3.set(normal, self.normals[3*i+0], self.normals[3*i+1], self.normals[3*i+2]);
        vec3.transformMat3(normal, normal, rotation);
        geom.add_vertex(pos, normal, color);
      }
      for (var i = 0; i < self.indices.length/3; ++i) {
        geom.add_triangle(base_index+self.indices[i*3+0], base_index+self.indices[i*3+1], 
                          base_index+self.indices[i*3+2]);
      }
    }
  };
};

// an (indexed mesh geometry container.
//
// stores the vertex data in interleaved format. not doing so has severe performance penalties
// in WebGL, and by severe I mean orders of magnitude slower than using an interleaved array.
var MeshGeom = function() {
  var self = {
    interleaved_buffer : gl.createBuffer(),
    index_buffer : gl.createBuffer(),
    vert_data : [],
    index_data : [],
    num_triangles : 0,
    num_verts : 0,
    ready : false,
  };

  return {
    num_verts : function() { return self.num_verts; },
    draw: function(shader_program) {
      this.bind();
      var pos_attrib = gl.getAttribLocation(shader_program, 'attr_pos');
      gl.enableVertexAttribArray(pos_attrib);
      gl.vertexAttribPointer(pos_attrib, 3, gl.FLOAT, false, 9*4, 0*4);

      var normal_attrib = gl.getAttribLocation(shader_program, 'attr_normal');
      gl.enableVertexAttribArray(normal_attrib);
      gl.vertexAttribPointer(normal_attrib, 3, gl.FLOAT, false, 9*4, 3*4);

      var clr_attrib = gl.getAttribLocation(shader_program, 'attr_color');
      gl.vertexAttribPointer(clr_attrib, 3, gl.FLOAT, false, 9*4, 6*4);
      gl.enableVertexAttribArray(clr_attrib);
      gl.drawElements(gl.TRIANGLES, self.num_triangles*3, gl.UNSIGNED_SHORT, 0);
    },
    add_vertex : function(pos, normal, color) {
      self.vert_data.push(pos[0]);
      self.vert_data.push(pos[1]);
      self.vert_data.push(pos[2]);
      self.vert_data.push(normal[0]);
      self.vert_data.push(normal[1]);
      self.vert_data.push(normal[2]);
      self.vert_data.push(color[0]);
      self.vert_data.push(color[1]);
      self.vert_data.push(color[2]);
      self.num_verts += 1;
    },
    add_triangle : function(idx1, idx2, idx3) {
      self.index_data.push(idx1);
      self.index_data.push(idx2);
      self.index_data.push(idx3);
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
    },
  };
};

var Cam = function() {
  var self = {
    projection : mat4.create(),
    modelview : mat4.create(),

    center : vec3.create(),
    zoom : 50,
    rotation : mat4.create(),
    translation : mat4.create(),
    update_mat : true,
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
                   0.1, 400.0);
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
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      shader.projection = gl.getUniformLocation(shader, 'projection_mat');
      shader.modelview = gl.getUniformLocation(shader, 'modelview_mat');
      gl.uniformMatrix4fv(shader.projection, false, self.projection);
      gl.uniformMatrix4fv(shader.modelview, false, self.modelview);
    }
  };
};


var PV = function(dom_element, width, height) {
  var canvas_element = document.createElement('canvas');
  canvas_element.width = width || 800;
  canvas_element.height = height || 800;
  dom_element.appendChild(canvas_element);

  var self = {
    dom_element : canvas_element,
    objects : [],
  };


  function init_gl() {
    // todo wrap in try-catch for browser which don't support WebGL
    gl = self.dom_element.getContext('experimental-webgl', { antialias: true });
    gl.viewportWidth = self.dom_element.width;
    gl.viewportHeight = self.dom_element.height;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.cullFace(gl.FRONT);
    gl.enable(gl.DEPTH_TEST);
  }

  function shader_from_element(gl, element) {
    var shader_code = get_element_contents(element);
    var shader;
    if (element.type == 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (element.type == 'x-shader/x-vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      console.error('could not determine type for shader');
      return null;
    }
    gl.shaderSource(shader, shader_code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function init_shader() {
    var frag_shader = shader_from_element(gl, document.getElementById('shader-fs'));
    var vert_shader = shader_from_element(gl, document.getElementById('shader-vs'));
    var shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
      console.error('could not initialise shaders')
    }
    return shader_program;
  };

  function mouse_up(event) {
    self.dom_element.removeEventListener('mousemove', mouse_move, false);
    self.dom_element.removeEventListener('mouseup', mouse_up, false);
    self.dom_element.removeEventListener('mouseout', mouse_out, false);
    document.removeEventListener('mousemove', mouse_move);
  }
  var shader_program;
  var cam;
  
  function init_pv() {
    init_gl();
    cam = Cam();
    shader_program = init_shader();
    gl.useProgram(shader_program);
  }


  var pv = {
    add : function(stuff) {
      self.objects.push(stuff);
    },

    draw : function() {
      cam.bind(shader_program);
      gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
      for (var i=0; i<self.objects.length; i+=1) {
        self.objects[i].draw(shader_program);
      }
    },
    center_on : function(thing) {
      cam.set_center(thing.center());
    }
  };
  function mouse_wheel(event) {
    cam.zoom(event.wheelDelta*0.05);
    pv.draw();
  }
  function mouse_down(event) {
    event.preventDefault();
    self.dom_element.addEventListener('mousemove', mouse_move, false);
    document.addEventListener('mousemove', mouse_move, false);
    self.dom_element.addEventListener('mouseup', mouse_up, false);
    document.addEventListener('mouseup', mouse_up, false);
    self.dom_element.addEventListener('mouseout', mouse_out, false);
    last_mouse_pos = { x: event.pageX, y: event.pageY };
  }


  function mouse_move(event) {
    var new_mouse_pos = { x : event.pageX, y : event.pageY };
    var delta = { x : new_mouse_pos.x - last_mouse_pos.x,
                  y : new_mouse_pos.y - last_mouse_pos.y};
                  
    var speed = 0.005;
    cam.rotate_x(speed*delta.y);
    cam.rotate_y(speed*delta.x);
    last_mouse_pos = new_mouse_pos;
    pv.draw();
  }

  function mouse_out(event) {}
  self.dom_element.addEventListener('mousewheel', mouse_wheel, false);
  self.dom_element.addEventListener('mousedown', mouse_down, false);

  document.addEventListener('DOMContentLoaded', init_pv);
  return pv;
};

var Structure = function() {
  var  self = {
    chains : [],
    next_atom_index : 0,
  };

  return {
    add_chain : function(name) {
      chain = Chain(this, name);
      self.chains.push(chain);
      return chain;
    },
    next_atom_index : function() { 
      var next_index = self.next_atom_index; 
      self.next_atom_index+=1; 
      return next_index; 
    },
    chains : function() { return self.chains; },
    each_residue : function(callback) {
      for (var i = 0; i < self.chains.length; i+=1) {
        self.chains[i].each_residue(callback);
      }
    },
    each_atom : function(callback) {
      for (var i = 0; i < self.chains.length; i+=1) {
        self.chains[i].each_atom(callback);
      }
    },

    line_trace : function() {
      var clr = vec3.fromValues(1,1,1,1);
      var line_geom = LineGeom();
      var prev_residue = false;
      this.each_residue(function(residue) {
        if (!residue.is_aminoacid()) {
          prev_residue = false;
          return;
        }
        if (!prev_residue) {
          prev_residue = residue;
          return;
        }
        var ca_prev = prev_residue.atom('CA');
        var ca_this = residue.atom('CA');
        var dist_square = vec3.distSqr(ca_prev.pos(), ca_next.pos());
        prev_residue = residue;
        if (Math.abs(dist_square - 3.5*3.5) < 0.5) {
          line_geom.add_line(ca_prev.pos(), clr, ca_this.pos(), clr);
        }
      });
      return line_geom;
    },
    lines : function() {
      var mp = vec3.create();
      var clr = vec4.create();
      var line_geom = LineGeom();
      this.each_atom(function(atom) {
        // for atoms without bonds, we draw a small cross, otherwise these atoms 
        // would be invisible on the screen.
        if (atom.bonds().length) {
          atom.each_bond(function(bond) {
            bond.mid_point(mp); 
            color_for_element(bond.atom_one().element(), clr);
            line_geom.add_line(bond.atom_one().pos(), clr, mp, clr);
            color_for_element(bond.atom_two().element(), clr);
            line_geom.add_line(mp, clr, bond.atom_two().pos(), clr);

          });
        } else {
          var cs = 0.2;
          var pos = atom.pos();
          color_for_element(atom.element(), clr);
          line_geom.add_line([pos[0]-cs, pos[1], pos[2]], clr, [pos[0]+cs, pos[1], pos[2]], clr);
          line_geom.add_line([pos[0], pos[1]-cs, pos[2]], clr, [pos[0], pos[1]+cs, pos[2]], clr);
          line_geom.add_line([pos[0], pos[1], pos[2]-cs], clr, [pos[0], pos[1], pos[2]+cs], clr);
        }
      });
      return line_geom;
    },
    trace : function() {
      var clr = vec3.fromValues(1,1,1,1);
      var geom = MeshGeom();
      var prev_residue = false;
      var proto_cyl = ProtoCylinder(8);
      var proto_sphere = ProtoSphere(8, 8);
      var rotation = mat3.create();
      var dir = vec3.create();
      var left = vec3.create();
      var up = vec3.create();
      this.each_residue(function(residue) {
        if (!residue.is_aminoacid()) {
          prev_residue = false;
          return;
        }
        proto_sphere.add_transformed(geom, residue.atom('CA').pos(), 0.3);
        if (!prev_residue) {
          prev_residue = residue;
          return;
        }
        var ca_prev = prev_residue.atom('CA');
        var ca_this = residue.atom('CA');
        prev_residue = residue;
        vec3.sub(dir, ca_this.pos(), ca_prev.pos());
        var length = vec3.length(dir);

        if (Math.abs(length - 3.5) > 0.5) {
          prev_residue = residue;
          return;
        }
        vec3.scale(dir, dir, 1.0/length);
        ortho_vec(left, dir);
        vec3.cross(up, dir, left);
        vec3.normalize(up, up);
        vec3.normalize(left, left);
        rotation[0] = left[0];
        rotation[1] = left[1];
        rotation[2] = left[2];

        rotation[3] = up[0];
        rotation[4] = up[1];
        rotation[5] = up[2];

        rotation[6] = dir[0];
        rotation[7] = dir[1];
        rotation[8] = dir[2];
        var mid_point = vec3.clone(ca_prev.pos());
        vec3.add(mid_point, mid_point, ca_this.pos());
        vec3.scale(mid_point, mid_point, 0.5);
        proto_cyl.add_transformed(geom, mid_point, length, 0.3, rotation);
      });
      return geom;
    },
    center : function() {
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
    },
    connect : function(atom_a, atom_b) {
      var bond = new Bond(atom_a, atom_b);
      atom_a.add_bond(bond);
      atom_b.add_bond(bond);
      return bond;
    },
    // determine connectivity structure. for simplicity only connects atoms of the same 
    // residue and peptide bonds
    derive_connectivity : function() {
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
    }
  };
}


var Chain = function(structure, name) {
  var self = {
    name : name,
    residues: [],
    structure : structure
  };
  return {
    name : function() { return self.name; },

    add_residue : function(name, num) {
      var residue = Residue(this, name, num);
      self.residues.push(residue);
      return residue;
    },
    each_atom : function(callback) {
      for (var i = 0; i< self.residues.length; i+=1) {
        self.residues[i].each_atom(callback);
      }
    },
    each_residue : function(callback) {
      for (var i = 0; i < self.residues.length; i+=1) {
        callback(self.residues[i]);
      }
    },
    residues : function() { return self.residues; },
    structure : function() { return self.structure; } 
  };
}

var Residue = function(chain, name, num) {
  var self = {
       name : name,
       num : num,
       atoms : [],
       chain: chain
  };

  return {
    name : function() { return self.name; },
    num : function() { return self.num; },
    add_atom : function(name, pos, element) {
      var atom = Atom(this, name, pos, element);
      self.atoms.push(atom);
      return atom;
    },
    each_atom : function(callback) {
      for (var i =0; i< self.atoms.length; i+=1) {
        callback(self.atoms[i]);
      }
    },
    atoms : function() { return self.atoms; },
    chain : function() { return self.chain; },
    atom : function(index_or_name) { 
      if (typeof index_or_name == 'string') {
        for (var i =0; i < self.atoms.length; ++i) {
          if (self.atoms[i].name() == index_or_name) {
            return self.atoms[i];
          }
        }
      }
      return self.atoms[index_or_name]; 
    },

    is_aminoacid : function() { 
      return this.atom('N') && this.atom('CA') && this.atom('C') && this.atom('O');
    },
    structure : function() { return self.chain.structure(); }
  }
}

var Atom = function(residue, name, pos, element) {
  var self = {
     name : name,
     pos : pos,
     element : element,
     bonds : [],
     index : residue.structure().next_atom_index(),
     residue: residue,
  };
  return {
    name : function() { return self.name; },
    pos : function() { return self.pos; },
    element : function() { return self.element; },
    add_bond : function(bond) { self.bonds.push(bond); },
    bonds : function() { return self.bonds; },
    residue: function() { return self.residue; },
    structure : function() { return self.residue.structure(); },
    each_bond : function(callback) {
      for (var i = 0; i < self.bonds.length; ++i) {
        callback(self.bonds[i]);
      }
    },
    index : function() { return self.index; }
  };
}


var Bond = function(atom_a, atom_b) {
  var self = {
    atom_one : atom_a,
    atom_two : atom_b,
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


var load_pdb_from_element = function(element) {
  return load_pdb(get_element_contents(element));
}
// a truly minimalistic PDB parser. It will die as soon as the input is 
// not well-formed. it only reas ATOM and HETATM records, everyting else 
// is ignored. in case of multi-model files, only the first model is read.
var load_pdb = function(text) {
  
  var structure = Structure();
  var curr_chain = null;
  var curr_res = null;
  var curr_atom = null;
  
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
    var pos = [];
    for (var i=0;i<3;++i) {
      pos.push(parseFloat(line.substr(30+i*8, 8)));
    }
    curr_res.add_atom(atom_name, pos, line.substr(77, 2).trim());
  }

  var lines = text.split(/\r\n|\r|\n/g);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.substr(0, 6) == 'ATOM  ') {
      parse_and_add_atom(line, false);
    }
    if (line.substr(0, 6) == 'HETATM') {
      parse_and_add_atom(line, true);
    }
    if (line.substr(0, 3) == 'END') {
      break;
    }
  }
  structure.derive_connectivity();
  return structure;
};
