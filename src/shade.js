(function(exports) {
"use strict";


function Gradient(colors, stops) {
  this._colors = colors;
  this._stops = stops;
}

exports.rgb = {};

exports.rgb.create = vec3.create;
exports.rgb.scale = vec3.scale;
exports.rgb.copy = vec3.copy;
exports.rgb.fromValues = vec3.fromValues;

exports.rgb.mix = function(out, colorOne, colorTwo, t) {
  var oneMinusT = 1.0 - t;
  out[0] = colorOne[0]*t+colorTwo[0]*oneMinusT;
  out[1] = colorOne[1]*t+colorTwo[1]*oneMinusT;
  out[2] = colorOne[2]*t+colorTwo[2]*oneMinusT;
  return out;
};

Gradient.prototype.colorAt = function(out, value) {
  if (value <= this._stops[0]) {
    return vec3.copy(out, this._colors[0]);
  }
  if (value >= this._stops[this._stops.length-1]) {
    return vec3.copy(out, this._colors[this._stops.length-1]);
  }
  // could use a binary search here, but since most gradients
  // have a really small number of stops, that's not going to
  // help much.
  var lowerIndex = 0;
  for (var i = 0; i < this._stops.length; ++i) {
    if (this._stops[i] > value) {
      break;
    }
    lowerIndex = i;
  }
  var upperIndex = lowerIndex+1;
  var lowerStop = this._stops[lowerIndex];
  var upperStop = this._stops[upperIndex];
  var t = (value - lowerStop)/ (upperStop - lowerStop);
  return rgb.mix(out, this._colors[upperIndex], this._colors[lowerIndex], t);
};
// creates a new gradient from the given set of colors. 
// 
// colors must be a valid list of colors.
//
// when stops is set to 'equal', then the color stops are
// assumed to be equi distant on the interval 0,1. otherwise,
// stops must be  a list of floating point numbers with the 
// same length than colors.
exports.gradient = function(colors, stops) {
  stops = stops || 'equal';
  if (stops === 'equal') {
    stops = [];
    for (var i = 0; i < colors.length; ++i) {
      stops.push(i*1.0/(colors.length-1));
    }
  }
  return new Gradient(colors, stops);
};

// returns the color for the given name.
exports.rgbFromName = function(colorName) {
};

function ColorOp(colorFunc, beginFunc, endFunc) {
  this.colorFor = colorFunc;
  this._beginFunc = beginFunc;
  this._endFunc = endFunc;
}

ColorOp.prototype.begin = function(obj) {
  if (this._beginFunc) {
    this._beginFunc(obj);
  }
};


ColorOp.prototype.end = function(obj) {
  if (this._endFunc) {
    this._endFunc(obj);
  }
};

exports.color = {};

exports.ColorOp = ColorOp;

exports.color.uniform = function(color) {
  return new ColorOp(function(atom, out, index) {
    out[index] = color[0];
    out[index+1] = color[1];
    out[index+2] = color[2];
  }, null, null);
};

exports.color.byElement = function() {
  return new ColorOp(function(atom, out, index) {
    var ele = atom.element();
    if (ele == 'C') {
      out[index] = 0.8; out[index+1] = 0.8; out[index+2] = 0.8;
      return out;
    }
    if (ele == 'N') {
      out[index] = 0; out[index+1] = 0; out[index+2] = 1;
      return out;
    }
    if (ele == 'O') {
      out[index] = 1; out[index+1] = 0; out[index+2] = 0;
      return out;
    }
    if (ele == 'S') {
      out[index] = 0.8; out[index+1] = 0.8; out[index+2] = 0;
      return out;
    }
    if (ele == 'CA') {
      out[index] = 0.533; out[index+1] = 0.533; out[index+2] = 0.666;
      return out;
    }
    out[index] = 1; out[index+1] = 0; out[index+2] = 1;
    return out;
  }, null, null);
};

exports.color.bySS = function() {

  return new ColorOp(function(atom, out, index) {
    switch (atom.residue().ss()) {
      case 'C':
        out[index] = 0.8; out[index+1] = 0.8; out[index+2] = 0.8;
        return;
      case 'H':
        out[index] = 0.6; out[index+1] = 0.6; out[index+2] = 0.9;
        return;
      case 'E':
        out[index] = 0.2; out[index+1] = 0.8; out[index+2] = 0.2;
        return;
    }
  }, null, null);
};

exports.color.rainbow = function(grad) {
  if (!grad) {
    grad = gradient([rgb.fromValues(1,0,0), 
                     rgb.fromValues(1,1,0), 
                     rgb.fromValues(0,1,0),
                     rgb.fromValues(0,0,1)]);
  }
  var colorFunc = new ColorOp(function(a, out, index) {
    var idx = a.residue().index();
    var limits = this.chainLimits[a.residue().chain().name()];
    var t =  (idx - limits[0])/(limits[1]-limits[0]);
    var x = [0,0,0];
    grad.colorAt(x, t);
    out[index] = x[0];
    out[index+1] = x[1];
    out[index+2] = x[2];
  }, function(obj) {
    var chains = obj.chains();
    this.chainLimits = {};
    for (var i = 0; i < chains.length; ++i) {
      var bb = chains[i].backboneTraces();
      if (bb.length === 0) {
        continue;
      }
      var minIndex = bb[0][0].index(), maxIndex = bb[0][bb[0].length-1].index();
      for (var j = 1; j < bb.length; ++j) {
        minIndex = Math.min(minIndex, bb[i][0].index());
        maxIndex = Math.max(maxIndex, bb[i][bb[i].length-1].index());
      }
      this.chainLimits[chains[i].name()] = [minIndex, maxIndex];
    }
  },function(obj) {
    this.chainLimits = null;
  });
  return colorFunc;
};

return true;
})(this);
