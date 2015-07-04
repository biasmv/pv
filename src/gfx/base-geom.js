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
    '../utils', 
    '../gl-matrix', 
    './scene-node'
  ], 
  function(
    utils, 
    glMatrix, 
    SceneNode) {

"use strict";

var vec3 = glMatrix.vec3;

function eachCentralAtomAsym(structure, callback) {
  structure.eachResidue(function(residue) {
    var centralAtom = residue.centralAtom();
    if (centralAtom === null) {
      return;
    }
    callback(centralAtom, centralAtom.pos());
  });
}

var eachCentralAtomSym = (function() {
  var transformedPos = vec3.create();
  return function(structure, gens, callback) {
    for (var i = 0; i < gens.length; ++i) {
      var gen = gens[i];
      var chains = structure.chainsByName(gen.chains());
      for (var j = 0; j < gen.matrices().length; ++j) {
        var matrix = gen.matrix(j);
        for (var k = 0; k < chains.length; ++k) {
          var chain = chains[k];
          for (var l = 0; l < chain.residues().length; ++l) {
            var centralAtom = chain.residues()[l].centralAtom();
            if (centralAtom === null) {
              continue;
            }
            vec3.transformMat4(transformedPos, centralAtom.pos(), matrix);
            callback(centralAtom, transformedPos);
          }
        }
      }
    }
  };
})();

function BaseGeom(gl) {
  SceneNode.call(this, gl);
  this._idRanges = [];
  this._vertAssocs = [];
  this._showRelated = null;
  this._selection = null;
}

utils.derive(BaseGeom, SceneNode, {
  setShowRelated : function(rel) {
    if (rel && rel !== 'asym') {
      if (this.structure().assembly(rel) === null) {
        console.error('no assembly with name', rel, 
                      '. Falling back to asymmetric unit');
        return;
      }
    }
    this._showRelated = rel;
    return rel;
  },

  symWithIndex : function(index) {
    if (this.showRelated() === 'asym') {
      return null;
    }
    var assembly = this.structure().assembly(this.showRelated());
    if (!assembly) {
      return null;
    }
    var gen = assembly.generators();
    for (var i = 0 ; i < gen.length; ++i) {
      if (gen[i].matrices().length > index) {
        return gen[i].matrix(index);
      }
      index -= gen[i].matrices().length;
    }
    return null;
  },

  showRelated : function() {
    return this._showRelated;
  },

  select : function(what) {
    return this.structure().select(what);
  },

  structure : function() {
    return this._vertAssocs[0]._structure;
  },


  getColorForAtom : function(atom, color) {
    // FIXME: what to do in case there are multiple assocs?
    return this._vertAssocs[0].getColorForAtom(atom, color);
  },

  addIdRange : function(range) {
    this._idRanges.push(range);
  },

  destroy : function() {
    SceneNode.prototype.destroy.call(this);
    for (var i = 0; i < this._idRanges.length; ++i) {
      this._idRanges[i].recycle();
    }
  },

  eachCentralAtom : function(callback) {
    var go = this;
    var structure = go.structure();
    var assembly = structure.assembly(go.showRelated());
    // in case there is no assembly, just loop over all the atoms contained
    // in the structure and invoke the callback as is
    if (assembly === null) {
      return eachCentralAtomAsym(structure, callback);
    }
    return eachCentralAtomSym(structure, assembly.generators(), callback);
  },

  addVertAssoc : function(assoc) {
    this._vertAssocs.push(assoc);
  },

  // returns all vertex arrays that contain geometry for one of the specified
  // chain names. Typically, there will only be one array for a given chain,
  // but for larger chains with mesh geometries a single chain may be split
  // across multiple vertex arrays.
  _vertArraysInvolving : function(chains) {
    var vertArrays = this.vertArrays();
    var selectedArrays = [];
    var set = {};
    for (var ci = 0; ci < chains.length; ++ci) {
      set[chains[ci]] = true;
    }
    for (var i = 0; i < vertArrays.length; ++i) {
      if (set[vertArrays[i].chain()] === true) {
        selectedArrays.push(vertArrays[i]);
      }
    }
    return selectedArrays;
  },


  // draws vertex arrays by using the symmetry generators contained in assembly
  _drawSymmetryRelated : function(cam, shader, assembly) {
    var gens = assembly.generators();
    for (var i = 0; i < gens.length; ++i) {
      var gen = gens[i];
      var affectedVAs = this._vertArraysInvolving(gen.chains());
      this._drawVertArrays(cam, shader, affectedVAs, gen.matrices());
    }
  },

  _updateProjectionIntervalsAsym : 
      function(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
      var vertArrays = this.vertArrays();
      for (var i = 0; i < vertArrays.length; ++i) {
        vertArrays[i].updateProjectionIntervals(xAxis, yAxis, zAxis, xInterval, 
                                                yInterval, zInterval);
      }
  },

  updateProjectionIntervals :
      function(xAxis, yAxis, zAxis, xInterval, yInterval, zInterval) {
    if (!this._visible) {
      return;
    }
    var showRelated = this.showRelated();
    if (showRelated === 'asym') {
      return this._updateProjectionIntervalsAsym(xAxis, yAxis, zAxis, 
                                                 xInterval, yInterval, 
                                                 zInterval);
    } 
    var assembly = this.structure().assembly(showRelated);
    // in case there is no assembly, fallback to asymmetric unit and bail out.
    var gens = assembly.generators();
    for (var i = 0; i < gens.length; ++i) {
      var gen = gens[i];
      var affectedVAs = this._vertArraysInvolving(gen.chains());
      for (var j = 0; j < gen.matrices().length; ++j) {
        for (var k = 0; k < affectedVAs.length; ++k) {
          var transform = gen.matrix(j);
          affectedVAs[k].updateProjectionIntervals(xAxis, yAxis, zAxis, 
                                                   xInterval, yInterval, 
                                                   zInterval, transform);
        }
      }
    }
  },

  // FIXME: investigate the performance cost of sharing code between 
  // updateSquaredSphereRadius and updateProjectionIntervals 
  _updateSquaredSphereRadiusAsym : function(center, radius) {
      var vertArrays = this.vertArrays();
      for (var i = 0; i < vertArrays.length; ++i) {
        radius = vertArrays[i].updateSquaredSphereRadius(center, radius);
      }
      return radius;
  },

  updateSquaredSphereRadius : function(center, radius) {
    if (!this._visible) {
      return radius;
    }
    var showRelated = this.showRelated();
    if (showRelated === 'asym') {
      return this._updateSquaredSphereRadiusAsym(center, radius);
    } 
    var assembly = this.structure().assembly(showRelated);
    var gens = assembly.generators();
    for (var i = 0; i < gens.length; ++i) {
      var gen = gens[i];
      var affectedVAs = this._vertArraysInvolving(gen.chains());
      for (var j = 0; j < gen.matrices().length; ++j) {
        for (var k = 0; k < affectedVAs.length; ++k) {
          // FIXME: is this correct?
          // var transform = gen.matrix(j);
          radius = affectedVAs[k].updateSquaredSphereRadius(center, radius);
        }
      }
    }
    return radius;
  },

  draw : function(cam, shaderCatalog, style, pass) {

    if (!this._visible) {
      return;
    }

    var shader = this.shaderForStyleAndPass(shaderCatalog, style, pass);

    if (!shader) {
      return;
    }
    var showRelated = this.showRelated();
    if (showRelated === 'asym') {
      return this._drawVertArrays(cam, shader, this.vertArrays(), null);
    } 

    var assembly = this.structure().assembly(showRelated);
    return this._drawSymmetryRelated(cam, shader, assembly);
  },

  colorBy : function(colorFunc, view) {
    console.time('BaseGeom.colorBy');
    this._ready = false;
    view = view || this.structure();
    for (var i = 0; i < this._vertAssocs.length; ++i) {
      this._vertAssocs[i].recolor(colorFunc, view);
    }
    console.timeEnd('BaseGeom.colorBy');
  },

  setOpacity : function(val, view) {
    console.time('BaseGeom.setOpacity');
    this._ready = false;
    view = view || this.structure();
    for (var i = 0; i < this._vertAssocs.length; ++i) {
      this._vertAssocs[i].setOpacity(val, view);
    }
    console.timeEnd('BaseGeom.setOpacity');
  },
  setSelection : function(view) {
    console.time('BaseGeom.setSelection');
    this._selection = view;
    this._ready = false;
    for (var i = 0; i < this._vertAssocs.length; ++i) {
      this._vertAssocs[i].setSelection(view);
    }
    console.timeEnd('BaseGeom.setSelection');
  },
   selection : function() {
     if (this._selection === null) {
       this._selection = this.structure().createEmptyView();
     }
     return this._selection;
   }
});


return BaseGeom;

});


