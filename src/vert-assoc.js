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

AtomVertexAssoc.prototype.addAssoc = function(atom, va, vertStart, vertEnd)  {
  this._assocs.push({ 
    atom: atom, vertexArray : va, vertStart : vertStart, vertEnd : vertEnd 
  });
};

AtomVertexAssoc.prototype.recolor = function(colorOp, view) {
  // allocate buffer to hold all colors of the view.
  var colorData = new Float32Array(view.atomCount()*4); 
  if (this._callBeginEnd) {
    // FIXME: does this need to be called on the complete structure or the 
    // view?
    colorOp.begin(this._structure);
  }

  var atomMap = {};
  view.eachAtom(function(atom, index) {
    atomMap[atom.index()] = index;
    colorOp.colorFor(atom, colorData, index*4);
  });
  if (this._callBeginEnd) {
    colorOp.end(this._structure);
  }
  // apply the color to the actual interleaved vertex array.
  for (var i = 0; i < this._assocs.length; ++i) {
    var assoc = this._assocs[i];
    var ai = atomMap[assoc.atom.index()];
    if (ai === undefined) {
      continue;
    }
    var r = colorData[ai*4], g = colorData[ai*4+1], b = colorData[ai*4+2], a = colorData[ai*4+3];
    var va = assoc.vertexArray;
    for (var j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
      va.setColor(j, r, g, b, a);
    }
  }
};

AtomVertexAssoc.prototype.setTransparency = function( val, view) {
  // apply the color to the actual interleaved vertex array.
  for (var i = 0; i < this._assocs.length; ++i) {
    var assoc = this._assocs[i];
    var va = assoc.vertexArray;
    for (var j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
      va.setTransparency(j, val);
    }
  }
};

// handles the association between a trace element, and sets of vertices.
function TraceVertexAssoc(structure, interpolation, callColoringBeginEnd,
                          perResidueColors) {
  this._structure = structure;
  this._assocs = [];
  this._callBeginEnd = callColoringBeginEnd;
  this._interpolation = interpolation || 1;
  this._perResidueColors = {};
}

TraceVertexAssoc.prototype.setPerResidueColors = function(traceIndex, colors) {
  this._perResidueColors[traceIndex] = colors;
};

TraceVertexAssoc.prototype.addAssoc = 
  function(traceIndex, vertexArray, slice, vertStart, vertEnd) {
    this._assocs.push({ traceIndex: traceIndex, slice : slice, 
                        vertStart : vertStart, vertEnd : vertEnd,
                        vertexArray : vertexArray});
};

TraceVertexAssoc.prototype.recolor = function(colorOp, view) {
  // FIXME: this function might create quite a few temporary buffers. Implement
  // a buffer pool to avoid hitting the GC and having to go through the slow
  // creation of typed arrays.
  if (this._callBeginEnd) {
    // FIXME: does this need to be called on the complete structure?
    colorOp.begin(this._structure);
  }
  var colorData = [];
  var i, j;
  var traces = this._structure.backboneTraces();
  console.assert(this._perResidueColors, 
                 "per-residue colors must be set for recoloring to work");
  for (i = 0; i < traces.length; ++i) {
    // get current residue colors
    var data = this._perResidueColors[i];
    console.assert(data, "no per-residue colors. Seriously, man?");
    var index = 0;
    var trace = traces[i];
    for (j = 0; j < trace.length(); ++j) {
      if (!view.containsResidue(trace.residueAt(j))) {
        index+=4;
        continue;
      }
      colorOp.colorFor(trace.centralAtomAt(j), data, index);
      index+=4;
    }
    if (this._interpolation > 1) {
      colorData.push(interpolateColor(data, this._interpolation));
    } else {
      colorData.push(data);
    }
  }

  // store the color in the actual interleaved vertex array.
  for (i = 0; i < this._assocs.length; ++i) {
    var assoc = this._assocs[i];
    var ai = assoc.slice;
    var newColors = colorData[assoc.traceIndex];
    var r = newColors[ai*4], g = newColors[ai*4+1], b = newColors[ai*4+2], a=newColors[ai*4+3];
    var va = assoc.vertexArray;
    for (j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
      va.setColor(j, r, g, b, a);
    }
  }
  if (this._callBeginEnd) {
    colorOp.end(this._structure);
  }
};


TraceVertexAssoc.prototype.setTransparency = function( val, view) {
  // store the color in the actual interleaved vertex array.
  for (i = 0; i < this._assocs.length; ++i) {
    var assoc = this._assocs[i];
    var va = assoc.vertexArray;
    for (j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
      va.setTransparency(j, val);
    }
  }

};

