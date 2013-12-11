// Copyright (c) 2013 Marco Biasini
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

(function(exports) {

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

  Range.prototype.min = function() {
    return this._min;
  };
  Range.prototype.max = function() {
    return this._max;
  };
  Range.prototype.length = function() {
    return this._max - this._min;
  };
  Range.prototype.empty = function() {
    return this._empty;
  };
  Range.prototype.center = function() {
    return (this._max + this._min) * 0.5;
  };

  Range.prototype.extend = function(amount) {
    this._min -= amount;
    this._max += amount;
  };

  Range.prototype.update = function(val) {
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
  };

  // A scene node holds a set of child nodes to be rendered on screen. Later on,
  // the SceneNode might grow additional functionality commonly found in a scene
  // graph, e.g. coordinate transformations.
  function SceneNode(name) {
    this._children = [];
    this._visible = true;
    this._name = name || '';
    this._order = 1;
  }

  SceneNode.prototype.order = function(order) {
    if (order !== undefined) {
      this._order = order;
    }
    return this._order;
  };

  SceneNode.prototype.add = function(node) {
    this._children.push(node);
  };

  SceneNode.prototype.draw = function(cam, shaderCatalog, style, pass) {
    for (var i = 0, e = this._children.length; i !== e; ++i) {
      this._children[i].draw(cam, shaderCatalog, style, pass);
    }
  };

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

  SceneNode.prototype.destroy = function() {
    for (var i = 0; i < this._children.length; ++i) {
      this._children[i].destroy();
    }
  };

  SceneNode.prototype.visible = function() {
    return this._visible;
  };

  function BaseGeom(gl) {
    SceneNode.prototype.constructor.call(this, gl);
    this._gl = gl;
    this._idRanges = [];
  }

  derive(BaseGeom, SceneNode);

  BaseGeom.prototype.select = function(what) {
    return this.structure().select(what);
  };

  BaseGeom.prototype.structure = function() {
    return this._vertAssoc._structure;
  };

  BaseGeom.prototype.setVertAssoc = function(assoc) {
    this._vertAssoc = assoc;
  };

  BaseGeom.prototype.addIdRange = function(range) {
    this._idRanges.push(range);
  };

  BaseGeom.prototype.destroy = function() {
    SceneNode.prototype.destroy.call(this);
    for (var i = 0; i < this._idRanges.length; ++i) {
      this._idRanges[i].recycle();
    }
  };

  // Holds geometrical data for objects rendered as lines. For each vertex,
  // the color and position is stored in an interleaved format.
  function LineGeom(gl, numVerts, float32BufferPool) {
    BaseGeom.prototype.constructor.call(this, gl);
    this._float32BufferPool = float32BufferPool || null;
    if (this._float32BufferPool) {
      this._data =
          this._float32BufferPool.request(numVerts * this._FLOATS_PER_VERT);
    } else {
      this._data = new Float32Array(numVerts * this._FLOATS_PER_VERT);
    }
    this._ready = false;
    this._interleavedBuffer = gl.createBuffer();
    this._numLines = 0;
    this._vertAssoc = null;
    this._lineWidth = 1.0;
  }

  derive(LineGeom, BaseGeom);

  LineGeom.prototype.setLineWidth = function(width) {
    this._lineWidth = width;
  };

  function updateProjectionIntervalsForBuffer(xAxis, yAxis, zAxis, data, stride,
                                              numVerts, xInterval, yInterval,
                                              zInterval) {
    var end = stride * numVerts;
    for (var i = 0; i < end; i += stride) {
      var x = data[i], y = data[i + 1], z = data[i + 2];
      xInterval.update(xAxis[0] * x + xAxis[1] * y + xAxis[2] * z);
      yInterval.update(yAxis[0] * x + yAxis[1] * y + yAxis[2] * z);
      zInterval.update(zAxis[0] * x + zAxis[1] * y + zAxis[2] * z);
    }
  }

  LineGeom.prototype.updateProjectionIntervals =
      function(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
    updateProjectionIntervalsForBuffer(
        xAxis, yAxis, zAxis, this._data, this._FLOATS_PER_VERT,
        this._numLines * 2, xInterval, yInterval, zInterval);
  };

  LineGeom.prototype.shaderForStyleAndPass =
      function(shaderCatalog, style, pass) {
    if (pass === 'outline') {
      return null;
    }
    if (pass === 'select') {
      return shaderCatalog.select;
    }
    return shaderCatalog.lines;
  };

  LineGeom.prototype._FLOATS_PER_VERT = 7;
  LineGeom.prototype._POS_OFFSET = 0;
  LineGeom.prototype._COLOR_OFFSET = 3;
  LineGeom.prototype._ID_OFFSET = 6;

  LineGeom.prototype.destroy = function() {
    BaseGeom.prototype.destroy.call(this);
    this._gl.deleteBuffer(this._interleavedBuffer);
    if (this._float32BufferPool) {
      this._float32BufferPool.release(this._data);
    } else {
      delete this._data;
    }
  };

  LineGeom.prototype.numVerts = function() {
    return this._numLines * 2;
  };

  LineGeom.prototype.draw = function(cam, shaderCatalog, style, pass) {

    if (!this._visible) {
      return;
    }

    var shader = this.shaderForStyleAndPass(shaderCatalog, style, pass);
    if (!shader) {
      return;
    }
    cam.bind(shader);
    this.bind();
    this._gl.lineWidth(this._lineWidth);
    this._gl.enableVertexAttribArray(shader.posAttrib);
    this._gl.vertexAttribPointer(shader.posAttrib, 3, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._POS_OFFSET * 4);
    this._gl.vertexAttribPointer(shader.colorAttrib, 3, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._COLOR_OFFSET * 4);
    this._gl.enableVertexAttribArray(shader.colorAttrib);
    if (shader.objIdAttrib !== -1) {
      this._gl.vertexAttribPointer(shader.objIdAttrib, 1, this._gl.FLOAT, false,
                                   this._FLOATS_PER_VERT * 4,
                                   this._ID_OFFSET * 4);
      this._gl.enableVertexAttribArray(shader.objIdAttrib);
    }
    this._gl.drawArrays(this._gl.LINES, 0, this._numLines * 2);
    this._gl.disableVertexAttribArray(shader.posAttrib);
    this._gl.disableVertexAttribArray(shader.colorAttrib);
    if (shader.objIdAttrib !== -1) {
      this._gl.disableVertexAttribArray(shader.objIdAttrib);
    }
  };

  LineGeom.prototype.colorBy = function(colorFunc, view) {
    console.time('LineGeom.colorBy');
    this._ready = false;
    view = view || this.structure();
    this._vertAssoc.recolor(colorFunc, view, this._data, this._COLOR_OFFSET,
                            this._FLOATS_PER_VERT);
    console.timeEnd('LineGeom.colorBy');
  };

  LineGeom.prototype.bind = function() {
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._interleavedBuffer);
    if (this._ready) {
      return;
    }
    this._gl.bufferData(this._gl.ARRAY_BUFFER, this._data,
                        this._gl.STATIC_DRAW);
    this._ready = true;
  };

  LineGeom.prototype.addLine =
      function(startPos, startColor, endPos, endColor, idOne, idTwo) {
    var index = this._FLOATS_PER_VERT * this._numLines * 2;
    this._data[index++] = startPos[0];
    this._data[index++] = startPos[1];
    this._data[index++] = startPos[2];
    this._data[index++] = startColor[0];
    this._data[index++] = startColor[1];
    this._data[index++] = startColor[2];
    this._data[index++] = idOne;
    this._data[index++] = endPos[0];
    this._data[index++] = endPos[1];
    this._data[index++] = endPos[2];
    this._data[index++] = endColor[0];
    this._data[index++] = endColor[1];
    this._data[index++] = endColor[2];
    this._data[index++] = idTwo;

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
    BaseGeom.prototype.constructor.call(this, null);
    this._geoms = [];
    this._structure = structure;
  }

  derive(CompositeGeom, BaseGeom);

  CompositeGeom.prototype.addGeom = function(geom) {
    this._geoms.push(geom);
  };

  CompositeGeom.prototype.destroy = function() {
    BaseGeom.prototype.destroy.call(this);
    for (var i = 0; i < this._geoms.length; ++i) {
      this._geoms[i].destroy();
    }
    this._geoms = [];
  };

  CompositeGeom.prototype.structure = function() {
    return this._structure;
  };

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

  CompositeGeom.prototype.updateProjectionIntervals =
      function(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
    for (var i = 0; i < this._geoms.length; ++i) {
      this._geoms[i].updateProjectionIntervals(xAxis, yAxis, zAxis, xInterval,
                                               yInterval, zInterval);
    }
  };

  CompositeGeom.prototype.draw = function(cam, shaderCatalog, style, pass) {
    if (!this._visible) {
      return;
    }
    for (var i = 0; i < this._geoms.length; ++i) {
      this._geoms[i].draw(cam, shaderCatalog, style, pass);
    }
  };

  function ProtoSphere(stacks, arcs) {
    this._arcs = arcs;
    this._stacks = stacks;
    this._indices = new Uint16Array(3 * arcs * stacks * 2);
    this._verts = new Float32Array(3 * arcs * stacks);
    var vert_angle = Math.PI / (stacks - 1);
    var horz_angle = Math.PI * 2.0 / arcs;
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
        this._indices[index] = (i) * this._arcs + j;
        this._indices[index + 1] = (i) * this._arcs + ((j + 1) % this._arcs);
        this._indices[index + 2] = (i + 1) * this._arcs + j;

        index += 3;

        this._indices[index] = (i) * this._arcs + ((j + 1) % this._arcs);
        this._indices[index + 1] =
            (i + 1) * this._arcs + ((j + 1) % this._arcs);
        this._indices[index + 2] = (i + 1) * this._arcs + j;
        index += 3;
      }
    }
  }

ProtoSphere.prototype.addTransformed = (function() {

    var pos = vec3.create(), normal = vec3.create();

    return function(geom, center, radius, color, objId) {
      var baseIndex = geom.numVerts();
    for (var i = 0; i < this._stacks * this._arcs; ++i) {
      vec3.set(normal, this._verts[3 * i], this._verts[3 * i + 1],
               this._verts[3 * i + 2]);
      vec3.copy(pos, normal);
      vec3.scale(pos, pos, radius);
      vec3.add(pos, pos, center);
      geom.addVertex(pos, normal, color, objId);
    }
    for (i = 0; i < this._indices.length / 3; ++i) {
      geom.addTriangle(baseIndex + this._indices[i * 3],
                       baseIndex + this._indices[i * 3 + 1],
                       baseIndex + this._indices[i * 3 + 2]);
    }
  };
})();

ProtoSphere.prototype.numIndices = function() {
  return this._indices.length;
};

ProtoSphere.prototype.numVerts = function() {
  return this._verts.length / 3;
};

// A tube profile is a cross-section of a tube, e.g. a circle or a 'flat'
// square.
// They are used to control the style of helices, strands and coils for the
// cartoon render mode.
function TubeProfile(points, num, strength) {
  var interpolated =
      geom.catmullRomSpline(points, points.length / 3, num, strength, true);

  this._indices = new Uint16Array(interpolated.length * 2);
  this._verts = interpolated;
  this._normals = new Float32Array(interpolated.length);
  this._arcs = interpolated.length / 3;

  var normal = vec3.create(), pos = vec3.create();

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
    this._indices[6 * i + 2] = ((i + 1) % this._arcs) + this._arcs;
    this._indices[6 * i + 3] = i;
    this._indices[6 * i + 4] = ((i + 1) % this._arcs) + this._arcs;
    this._indices[6 * i + 5] = (i + 1) % this._arcs;
  }
}

TubeProfile.prototype.addTransformed = (function() {
  var pos = vec3.create(), normal = vec3.create();
  return function(geom, center, radius, rotation, color, first, offset, objId) {
    var baseIndex = geom.numVerts() - this._arcs;
  for (var i = 0; i < this._arcs; ++i) {
    vec3.set(pos, radius * this._verts[3 * i], radius * this._verts[3 * i + 1],
             0.0);
    vec3.transformMat3(pos, pos, rotation);
    vec3.add(pos, pos, center);
    vec3.set(normal, this._normals[3 * i], this._normals[3 * i + 1], 0.0);
    vec3.transformMat3(normal, normal, rotation);
    geom.addVertex(pos, normal, color, objId);
  }
  if (first) {
    return;
  }
  if (offset === 0) {
    // that's what happens most of the time, thus is has been optimized.
    for (i = 0; i < this._indices.length / 3; ++i) {
      geom.addTriangle(baseIndex + this._indices[i * 3],
                       baseIndex + this._indices[i * 3 + 1],
                       baseIndex + this._indices[i * 3 + 2]);
    }
    return;
  }
  for (i = 0; i < this._arcs; ++i) {
    geom.addTriangle(baseIndex + ((i + offset) % this._arcs),
                     baseIndex + i + this._arcs,
                     baseIndex + ((i + 1) % this._arcs) + this._arcs);
    geom.addTriangle(baseIndex + (i + offset) % this._arcs,
                     baseIndex + ((i + 1) % this._arcs) + this._arcs,
                     baseIndex + ((i + 1 + offset) % this._arcs));
  }

  };
})();

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
    this._indices[6 * i] = (i) % this._arcs;
    this._indices[6 * i + 1] = arcs + ((i + 1) % this._arcs);
    this._indices[6 * i + 2] = (i + 1) % this._arcs;

    this._indices[6 * i + 3] = (i) % this._arcs;
    this._indices[6 * i + 4] = arcs + ((i) % this._arcs);
    this._indices[6 * i + 5] = arcs + ((i + 1) % this._arcs);
  }
}

ProtoCylinder.prototype.numVerts = function() {
  return this._verts.length / 3;
};

ProtoCylinder.prototype.numIndices = function() {
  return this._indices.length;
};

ProtoCylinder.prototype.addTransformed = (function() {
  var pos = vec3.create(), normal = vec3.create();
  return function(geom, center, length, radius, rotation, colorOne, colorTwo,
                  idOne, idTwo) {
    var baseIndex = geom.numVerts();
  for (var i = 0; i < 2 * this._arcs; ++i) {
    vec3.set(pos, radius * this._verts[3 * i], radius * this._verts[3 * i + 1],
             length * this._verts[3 * i + 2]);
    vec3.transformMat3(pos, pos, rotation);
    vec3.add(pos, pos, center);
    vec3.set(normal, this._normals[3 * i], this._normals[3 * i + 1],
             this._normals[3 * i + 2]);
    vec3.transformMat3(normal, normal, rotation);
    var objId = i < this._arcs ? idOne : idTwo;
    geom.addVertex(pos, normal, i < this._arcs ? colorOne : colorTwo, objId);
  }
  for (i = 0; i < this._indices.length / 3; ++i) {
    geom.addTriangle(baseIndex + this._indices[i * 3],
                     baseIndex + this._indices[i * 3 + 1],
                     baseIndex + this._indices[i * 3 + 2]);
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
// Px Py Pz Nx Ny Nz Cr Cg Cb Id
//
// , where P is the position, N the normal and C the color information
// of the vertex.
function MeshGeom(gl, numVerts, numIndices, float32BufferPool,
                  uint16BufferPool) {
  BaseGeom.prototype.constructor.call(this, gl);
  this._interleavedBuffer = gl.createBuffer();
  this._indexBuffer = gl.createBuffer();
  this._float32BufferPool = float32BufferPool || null;
  this._uint16BufferPool = uint16BufferPool || null;
  var numFloats = numVerts * this._FLOATS_PER_VERT;
  if (this._float32BufferPool) {
    this._vertData = this._float32BufferPool.request(numFloats);
  } else {
    this._vertData = new Float32Array(numFloats);
  }
  if (this._uint16BufferPool) {
    this._indexData = this._uint16BufferPool.request(numIndices);
  } else {
    this._indexData = new Uint16Array(numIndices);
  }
  this._numVerts = 0;
  this._numTriangles = 0;
  this._ready = false;
  this._vertAssoc = null;
}

MeshGeom.prototype._FLOATS_PER_VERT = 10;
MeshGeom.prototype._COLOR_OFFSET = 6;
MeshGeom.prototype._POS_OFFSET = 0;
MeshGeom.prototype._NORMAL_OFFSET = 3;

derive(MeshGeom, BaseGeom);

MeshGeom.prototype.setVertAssoc = function(assoc) {
  this._vertAssoc = assoc;
};
MeshGeom.prototype.updateProjectionIntervals =
    function(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
  updateProjectionIntervalsForBuffer(xAxis, yAxis, zAxis, this._vertData,
                                     this._FLOATS_PER_VERT, this._numVerts,
                                     xInterval, yInterval, zInterval);
};
MeshGeom.prototype.destroy = function() {
  BaseGeom.prototype.destroy.call(this);
  this._gl.deleteBuffer(this._interleavedBuffer);
  this._gl.deleteBuffer(this._indexBuffer);
  if (this._float32BufferPool) {
    this._float32BufferPool.release(this._vertData);
  } else {
    delete this._vertData;
  }
  if (this._uint16BufferPool) {
    this._uint16BufferPool.release(this._indexData);
  } else {
    delete this._indexData;
  }
};

MeshGeom.prototype.numVerts = function() {
  return this._numVerts;
};

MeshGeom.prototype.shaderForStyleAndPass =
    function(shaderCatalog, style, pass) {
  if (pass === 'outline') {
    return shaderCatalog.outline;
  }
  if (pass === 'select') {
    return shaderCatalog.select;
  }
  var shader = shaderCatalog[style];
  return shader !== undefined ? shader : null;
};

MeshGeom.prototype.colorBy = function(colorFunc, view) {
  console.time('MeshGeom.colorBy');
  this._ready = false;
  view = view || this.structure();
  this._vertAssoc.recolor(colorFunc, view, this._vertData, this._COLOR_OFFSET,
                          this._FLOATS_PER_VERT);
  console.timeEnd('MeshGeom.colorBy');
};

MeshGeom.prototype.draw = function(cam, shaderCatalog, style, pass) {

  if (!this._visible) {
    return;
  }

  var shader = this.shaderForStyleAndPass(shaderCatalog, style, pass);
  if (!shader) {
    return;
  }
  cam.bind(shader);
  this.bind();

  this._gl.enableVertexAttribArray(shader.posAttrib);
  this._gl.vertexAttribPointer(shader.posAttrib, 3, this._gl.FLOAT, false,
                               this._FLOATS_PER_VERT * 4, this._POS_OFFSET * 4);

  if (shader.normalAttrib !== -1) {
    this._gl.enableVertexAttribArray(shader.normalAttrib);
    this._gl.vertexAttribPointer(shader.normalAttrib, 3, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._NORMAL_OFFSET * 4);
  }

  if (shader.colorAttrib !== -1) {
    this._gl.vertexAttribPointer(shader.colorAttrib, 3, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4,
                                 this._COLOR_OFFSET * 4);
    this._gl.enableVertexAttribArray(shader.colorAttrib);
  }
  if (shader.objIdAttrib !== -1) {
    this._gl.vertexAttribPointer(shader.objIdAttrib, 1, this._gl.FLOAT, false,
                                 this._FLOATS_PER_VERT * 4, 9 * 4);
    this._gl.enableVertexAttribArray(shader.objIdAttrib);
  }
  this._gl.drawElements(this._gl.TRIANGLES, this._numTriangles * 3,
                        this._gl.UNSIGNED_SHORT, 0);
  this._gl.disableVertexAttribArray(shader.posAttrib);
  if (shader.colorAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.colorAttrib);
  }
  if (shader.normalAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.normalAttrib);
  }
  if (shader.objIdAttrib !== -1) {
    this._gl.disableVertexAttribArray(shader.objIdAttrib);
  }
};

MeshGeom.prototype.addVertex = function(pos, normal, color, objId) {
  /*
  // pushing all values at once seems to be more efficient than pushing
  // separately. resizing the vertData prior and setting the elements
  // is substantially slower.
  this._vertData.push(pos[0], pos[1], pos[2], normal[0], normal[1], normal[2],
                      color[0], color[1], color[2], objId);
  */
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
  this._vertData[i++] = objId;
  this._numVerts += 1;
};

MeshGeom.prototype.addTriangle = function(idx1, idx2, idx3) {
  var index = 3 * this._numTriangles;
  if (index >= this._indexData.length) {
    return;
  }
  this._indexData[index++] = idx1;
  this._indexData[index++] = idx2;
  this._indexData[index++] = idx3;
  this._numTriangles += 1;
};

MeshGeom.prototype.bind = function() {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._interleavedBuffer);
  this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
  if (this._ready) {
    return;
  }
  this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertData,
                      this._gl.STATIC_DRAW);
  this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, this._indexData,
                      this._gl.STATIC_DRAW);
  this._ready = true;
};

function TextLabel(gl, canvas, context, pos, text) {
  SceneNode.prototype.constructor.call(this, gl);
  this._gl = gl;
  this._order = 100;
  this._pos = pos;
  this._interleavedBuffer = this._gl.createBuffer();
  this._interleavedData = new Float32Array(5 * 6);

  this._prepareText(canvas, context, text);

  var halfWidth = this._width / 2;
  var halfHeight = this._height / 2;
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

TextLabel.prototype.updateProjectionIntervals = function() {
  // text labels don't affect the projection interval. Don't do anything.
};

derive(TextLabel, SceneNode);

TextLabel.prototype._setupTextParameters = function(ctx) {
  ctx.fillStyle = 'black';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = '24px "Helvetica Neue"';
  ctx.fontWeight = 'lighter';
};

function smallestPowerOfTwo(size) {
  var s = 1;
  while (s < size) {
    s *= 2;
  }
  return s;
}

TextLabel.prototype._prepareText = function(canvas, ctx, text) {
  this._setupTextParameters(ctx);
  var estimatedWidth = ctx.measureText(text).width;
  var estimatedHeight = 24;
  canvas.width = smallestPowerOfTwo(estimatedWidth);
  canvas.height = smallestPowerOfTwo(estimatedHeight);
  this._setupTextParameters(ctx);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.5;
  ctx.fillText(text, 0, canvas.height);
  ctx.strokeText(text, 0, canvas.height);
  this._texture = this._gl.createTexture();
  this._textureFromCanvas(this._texture, canvas);
  this._xScale = estimatedWidth / canvas.width;
  this._yScale = estimatedHeight / canvas.height;
  this._width = estimatedWidth * 0.002;
  this._height = estimatedHeight * 0.002;
};

TextLabel.prototype._textureFromCanvas = function(targetTexture, srcCanvas) {
  this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, true);
  this._gl.bindTexture(this._gl.TEXTURE_2D, targetTexture);
  this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA,
                      this._gl.UNSIGNED_BYTE, srcCanvas);
  this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER,
                         this._gl.LINEAR);
  this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER,
                         this._gl.LINEAR_MIPMAP_LINEAR);
  this._gl.generateMipmap(this._gl.TEXTURE_2D);
  this._gl.bindTexture(this._gl.TEXTURE_2D, null);
};

TextLabel.prototype.bind = function() {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._interleavedBuffer);
  this._gl.activeTexture(this._gl.TEXTURE0);
  this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
  if (this._ready) {
    return;
  }
  this._gl.bufferData(this._gl.ARRAY_BUFFER, this._interleavedData,
                      this._gl.STATIC_DRAW);
  this._ready = true;
};

TextLabel.prototype.draw = function(cam, shaderCatalog, style, pass) {
  if (!this._visible) {
    return;
  }

  if (pass !== 'normal') {
    return;
  }
  var shader = shaderCatalog.text;
  cam.bind(shader);
  this.bind();
  this._gl.uniform1f(this._gl.getUniformLocation(shader, 'xScale'),
                     this._xScale);
  this._gl.uniform1f(this._gl.getUniformLocation(shader, 'yScale'),
                     this._yScale);
  this._gl.uniform1i(this._gl.getUniformLocation(shader, 'sampler'), 0);
  var vertAttrib = this._gl.getAttribLocation(shader, 'attrCenter');
  this._gl.enableVertexAttribArray(vertAttrib);
  this._gl.vertexAttribPointer(vertAttrib, 3, this._gl.FLOAT, false, 5 * 4,
                               0 * 4);
  var texAttrib = this._gl.getAttribLocation(shader, 'attrCorner');
  this._gl.vertexAttribPointer(texAttrib, 2, this._gl.FLOAT, false, 5 * 4,
                               3 * 4);
  this._gl.enableVertexAttribArray(texAttrib);
  this._gl.enable(this._gl.BLEND);
  this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
  this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
  this._gl.disableVertexAttribArray(vertAttrib);
  this._gl.disableVertexAttribArray(texAttrib);
  this._gl.disable(this._gl.BLEND);
};

// A continous range of object identifiers.
//
function ContinuousIdRange(pool, start, end) {
  this._pool = pool;
  this._start = start;
  this._next = start;
  this._end = end;
}

ContinuousIdRange.prototype.nextId = function(obj) {
  var id = this._next;
  this._next++;
  this._pool._objects[id] = obj;
  return id;
};
ContinuousIdRange.prototype.recycle = function() {
  this._pool.recycle(this);
};
ContinuousIdRange.prototype.length = function() {
  return this._end - this._start;
};

function UniqueObjectIdPool() {
  this._objects = {};
  this._unusedRangeStart = 0;
  this._free = [];
}

UniqueObjectIdPool.prototype.getContinuousRange = function(num) {
  // FIXME: keep the "free" list sorted, so we can binary search it
  // for a good match
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
    return result;
  }
  var start = this._unusedRangeStart;
  var end = start + num;
  this._unusedRangeStart = end;
  return new ContinuousIdRange(this, start, end);
};

UniqueObjectIdPool.prototype.recycle = function(range) {
  for (var i = range._start; i < range._next; ++i) {
    delete this._objects[i];
  }
  range._next = range._start;
  this._free.push(range);
};

UniqueObjectIdPool.prototype.objectForId = function(id) {
  return this._objects[id];
};

function OrientedBoundingBox(gl, center, halfExtents) {
  LineGeom.prototype.constructor.call(this, gl, 24);
  var color = rgb.create();
  var tf = mat3.create();
  tf[0] = halfExtents[0][0];
  tf[1] = halfExtents[0][1];
  tf[2] = halfExtents[0][2];

  tf[3] = halfExtents[1][0];
  tf[4] = halfExtents[1][1];
  tf[5] = halfExtents[1][2];

  tf[6] = halfExtents[2][0];
  tf[7] = halfExtents[2][1];
  tf[8] = halfExtents[2][2];
  var a = vec3.create(), b = vec3.create();
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ -1, -1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ 1, -1, -1 ], tf)), color, -1);

  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ 1, -1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ 1, 1, -1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ 1, 1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ -1, 1, -1 ], tf)), color, -1);
  this.addLine(vec3.add(a, center, vec3.transformMat3(a, [ -1, 1, -1 ], tf)),
               color,
               vec3.add(b, center, vec3.transformMat3(b, [ -1, -1, -1 ], tf)),
               color, -1);

  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ -1, -1, 1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ 1, -1, 1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ 1, -1, 1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ 1, 1, 1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ 1, 1, 1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ -1, 1, 1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ -1, 1, 1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ -1, -1, 1 ], tf)), color, -1);

  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ -1, -1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ -1, -1, 1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ 1, -1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ 1, -1, 1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ 1, 1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ 1, 1, 1 ], tf)), color, -1);
  this.addLine(
      vec3.add(a, center, vec3.transformMat3(a, [ -1, 1, -1 ], tf)), color,
      vec3.add(b, center, vec3.transformMat3(b, [ -1, 1, 1 ], tf)), color, -1);
}

derive(OrientedBoundingBox, LineGeom);

exports.SceneNode = SceneNode;
exports.OrientedBoundingBox = OrientedBoundingBox;
exports.AtomVertexAssoc = AtomVertexAssoc;
exports.TraceVertexAssoc = TraceVertexAssoc;
exports.MeshGeom = MeshGeom;
exports.LineGeom = LineGeom;
exports.CompositeGeom = CompositeGeom;
exports.TubeProfile = TubeProfile;
exports.ProtoSphere = ProtoSphere;
exports.ProtoCylinder = ProtoCylinder;
exports.TextLabel = TextLabel;
exports.UniqueObjectIdPool = UniqueObjectIdPool;
exports.Range = Range;
})(this);

