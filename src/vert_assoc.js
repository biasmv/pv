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

AtomVertexAssoc.prototype.recolor = function(colorOp, view, buffer, offset, 
                                             stride) {
  // allocate buffer to hold all colors of the view.
  var colorData = new Float32Array(view.atomCount()*3); 
  if (this._callBeginEnd) {
    // FIXME: does this need to be called on the complete structure or the 
    // view?
    colorOp.begin(this._structure);
  }
  // loop over all atoms in the view, calculate its color and store the
  // index in to the colorData array.
  var atomMap = {};
  view.eachAtom(function(atom, index) {
    atomMap[atom.index()] = index;
    colorOp.colorFor(atom, colorData, index*3);
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
    var r = colorData[ai*3], g = colorData[ai*3+1], b = colorData[ai*3+2];
    for (var j = assoc.vertStart ; j < assoc.vertEnd; ++j) {
       buffer[offset+j*stride+0] = r;  
       buffer[offset+j*stride+1] = g;  
       buffer[offset+j*stride+2] = b;  
    }
  }
};

// handles the association between a trace element, and sets of vertices.
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


TraceVertexAssoc.prototype.recolor = function(colorOp, view, buffer, offset, 
                                              stride) {
  // FIXME: this function might create quite a few temporary buffers. Implement
  // a buffer pool to avoid hitting the GC and having to go through the slow
  // creation of typed arrays.
  if (this._callBeginEnd) {
    // FIXME: does this need to be called on the complete structure?
    colorOp.begin(this._structure);
  }
  var colorData = [];
  var i, j;
  var chains = view.chains();
  for (var ci = 0; ci < chains.length; ++ci) {
    var chain = chains[ci];
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
  // store the color in the actual interleaved vertex array.
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

