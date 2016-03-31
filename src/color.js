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
    './gl-matrix'
  ], 
  function(
    glMatrix) {

"use strict";

var vec4 = glMatrix.vec4;

var exports = {};
exports.rgb = {};
var rgb = exports.rgb;

exports.rgb.create = vec4.create;
exports.rgb.scale = vec4.scale;
exports.rgb.copy = vec4.copy;
exports.rgb.clone = vec4.clone;
exports.rgb.fromValues = vec4.fromValues;

exports.rgb.mix = function(out, colorOne, colorTwo, t) {
  var oneMinusT = 1.0 - t;
  out[0] = colorOne[0]*t+colorTwo[0]*oneMinusT;
  out[1] = colorOne[1]*t+colorTwo[1]*oneMinusT;
  out[2] = colorOne[2]*t+colorTwo[2]*oneMinusT;
  out[3] = colorOne[3]*t+colorTwo[3]*oneMinusT;
  return out;
};

var COLORS = {
  white :        rgb.fromValues(1.0,1.0 ,1.0,1.0),
  black :        rgb.fromValues(0.0,0.0 ,0.0,1.0),
  grey :         rgb.fromValues(0.5,0.5 ,0.5,1.0),
  lightgrey :    rgb.fromValues(0.8,0.8 ,0.8,1.0),
  darkgrey :     rgb.fromValues(0.3,0.3 ,0.3,1.0),
  red :          rgb.fromValues(1.0,0.0 ,0.0,1.0),
  darkred :      rgb.fromValues(0.5,0.0 ,0.0,1.0),
  lightred :     rgb.fromValues(1.0,0.5 ,0.5,1.0),
  green :        rgb.fromValues(0.0,1.0 ,0.0,1.0),
  darkgreen :    rgb.fromValues(0.0,0.5 ,0.0,1.0),
  lightgreen :   rgb.fromValues(0.5,1.0 ,0.5,1.0),
  blue :         rgb.fromValues(0.0,0.0 ,1.0,1.0),
  darkblue :     rgb.fromValues(0.0,0.0 ,0.5,1.0),
  lightblue :    rgb.fromValues(0.5,0.5 ,1.0,1.0),
  yellow :       rgb.fromValues(1.0,1.0 ,0.0,1.0),
  darkyellow :   rgb.fromValues(0.5,0.5 ,0.0,1.0),
  lightyellow :  rgb.fromValues(1.0,1.0 ,0.5,1.0),
  cyan :         rgb.fromValues(0.0,1.0 ,1.0,1.0),
  darkcyan :     rgb.fromValues(0.0,0.5 ,0.5,1.0),
  lightcyan :    rgb.fromValues(0.5,1.0 ,1.0,1.0),
  magenta :      rgb.fromValues(1.0,0.0 ,1.0,1.0),
  darkmagenta :  rgb.fromValues(0.5,0.0 ,0.5,1.0),
  lightmagenta : rgb.fromValues(1.0,0.5 ,1.0,1.0),
  orange :       rgb.fromValues(1.0,0.5 ,0.0,1.0),
  darkorange :   rgb.fromValues(0.5,0.25,0.0,1.0),
  lightorange :  rgb.fromValues(1.0,0.75,0.5,1.0)
};


exports.hex2rgb = function(color, alpha) {
  alpha = alpha === undefined ? 1.0 : + alpha;
  var r, g, b, a;
  if (color.length === 4 || color.length === 5 ) {
    r = parseInt(color[1], 16);
    g = parseInt(color[2], 16);
    b = parseInt(color[3], 16);
    a = Math.round(alpha * 15);
    if(color.length===5) {
      a = parseInt(color[4], 16);
    }
    var oneOver15 = 1/15.0;
    return rgb.fromValues(oneOver15 * r, oneOver15 * g, 
                          oneOver15 * b, oneOver15 * a);
  }
  if (color.length === 7 || color.length === 9) {
    r = parseInt(color.substr(1, 2), 16);
    g = parseInt(color.substr(3, 2), 16);
    b = parseInt(color.substr(5, 2), 16);
    a = Math.round(255 * alpha);
    if(color.length===9) {
      a = parseInt(color.substr(7, 2), 16);
    }
    var oneOver255 = 1/255.0;
    return rgb.fromValues(oneOver255 * r, oneOver255 * g, 
                          oneOver255 * b, oneOver255 * a);
  }
};
  

  // provide an override of the default color setting.
exports.setColorPalette = function(customColors){
  console.log("setting colors");
    COLORS = customColors;
  exports.initGradients();
};

// internal function to force various types into an RGBA quadruplet 
exports.forceRGB = function(color, alpha) {
  alpha = alpha === undefined ? 1.0 : +alpha;
  if (typeof color === 'string') {
    var lookup = COLORS[color];
    if (lookup !== undefined) {
      color = rgb.clone(lookup);
      color[3] = alpha;
    }
    if (color.length > 0 && color[0] === '#') {
     return exports.hex2rgb(color, alpha);
    }
  }
  // in case no alpha component is provided, default alpha to 1.0
  if (color.length === 3) {
    return [color[0], color[1], color[2], alpha];
  }
  return color;
};

function Gradient(colors, stops) {
  this._colors = colors;
  for (var i = 0; i < this._colors.length; ++i) {
    this._colors[i] = exports.forceRGB(this._colors[i]);
  }
  this._stops = stops;
}

Gradient.prototype = {
  colorAt : function(out, value) {
    if (value <= this._stops[0]) {
      return vec4.copy(out, this._colors[0]);
    }
    if (value >= this._stops[this._stops.length-1]) {
      return vec4.copy(out, this._colors[this._stops.length-1]);
    }
    // could use a binary search here, but since most gradients
    // have a really small number of stops, that's not going to
    // help much.
    var lowerIndex = 0;
    for (var i = 1; i < this._stops.length; ++i) {
      if (this._stops[i] > value) {
        break;
      }
      lowerIndex = i;
    }
    var upperIndex = lowerIndex + 1;
    var lowerStop = this._stops[lowerIndex];
    var upperStop = this._stops[upperIndex];
    var t = (value - lowerStop)/ (upperStop - lowerStop);
    return rgb.mix(out, this._colors[upperIndex], this._colors[lowerIndex], t);
  }
};

var GRADIENTS = { };
// creates a new gradient from the given set of colors. 
// 
// colors must be a valid list of colors.
//
// when stops is set to 'equal' or ommitted, then the color stops are
// assumed to be equi distant on the interval 0,1. otherwise, stops 
// must be  a list of floating point numbers with the same length 
// than colors.
exports.gradient = function(colors, stops) {
  if (typeof colors === 'string') {
    return GRADIENTS[colors];
  }
  stops = stops || 'equal';
  if (stops === 'equal') {
    stops = [];
    for (var i = 0; i < colors.length; ++i) {
      stops.push(i*1.0/(colors.length-1));
    }
  }
  return new Gradient(colors, stops);
};
var gradient = exports.gradient;

exports.initGradients = function() {
  GRADIENTS.rainbow = gradient(['blue', 'green', 'yellow', 'red']);
  GRADIENTS.reds = gradient(['lightred', 'darkred']);
  GRADIENTS.greens = gradient(['lightgreen', 'darkgreen']);
  GRADIENTS.blues = gradient(['lightblue', 'darkblue']);
  GRADIENTS.trafficlight = gradient(['green', 'yellow', 'red']);
  GRADIENTS.heatmap = gradient(['red', 'white', 'blue']);
};

function ColorOp(colorFunc, beginFunc, endFunc) {
  this.colorFor = colorFunc;
  this._beginFunc = beginFunc;
  this._endFunc = endFunc;
}

ColorOp.prototype = {
  begin : function(obj) {
    if (this._beginFunc) {
      this._beginFunc(obj);
    }
  },

  end : function(obj) {
    if (this._endFunc) {
      this._endFunc(obj);
    }
  }
};


exports.ColorOp = ColorOp;

exports.uniform = function(color) {
  color = exports.forceRGB(color || 'white');
  return new ColorOp(function(atom, out, index) {
    out[index+0] = color[0];
    out[index+1] = color[1];
    out[index+2] = color[2];
    out[index+3] = color[3];
  }, null, null);
};

var CPK_TABLE = {
 H :  [0.87, 0.87, 0.87],
 C :  [0.61, 0.61, 0.61],
 N :  [0.00, 0.47, 0.84],
 O :  [0.97, 0.18, 0.18],
 F :  [0.12, 0.94, 0.12],
 CL : [0.12, 0.94, 0.12],
 BR : [0.60, 0.13, 0.00],
 I :  [0.40, 0.00, 0.73],
 HE : [0.00, 1.00, 1.00],
 NE : [0.00, 1.00, 1.00],
 AR : [0.00, 1.00, 1.00],
 XE : [0.00, 1.00, 1.00],
 KR : [0.00, 1.00, 1.00],
 P :  [1.00, 0.43, 0.13],
 S :  [1.00, 0.73, 0.22],
 B :  [1.00, 0.67, 0.47],
 LI : [0.47, 0.00, 1.00],
 NA : [0.47, 0.00, 1.00],
 K :  [0.47, 0.00, 1.00],
 RB : [0.47, 0.00, 1.00],
 CS : [0.47, 0.00, 1.00],
 FR : [0.47, 0.00, 1.00],
 BE : [0.00, 0.47, 0.00],
 MG : [0.00, 0.47, 0.00],
 SR : [0.00, 0.47, 0.00],
 BA : [0.00, 0.47, 0.00],
 RA : [0.00, 0.47, 0.00],
 TI : [0.60, 0.60, 0.60],
 FE : [0.56, 0.31, 0.12]
};

exports.byElement = function() {
  return new ColorOp(function(atom, out, index) {
    var ele = atom.element();
    var color = CPK_TABLE[ele];
    if (color !== undefined) {
      out[index] = color[0]; 
      out[index+1] = color[1]; 
      out[index+2] = color[2]; 
      out[index+3] = 1.0;
      return out;
    }
    out[index] = 1; 
    out[index+1] = 0; 
    out[index+2] = 1;
    out[index+3] = 1.0;
    return out;
  }, null, null);
};

exports.bySS = function() {

  return new ColorOp(function(atom, out, index) {
    switch (atom.residue().ss()) {
      case 'C':
        out[index] = 0.8;   out[index+1] = 0.8; 
        out[index+2] = 0.8; out[index+3] = 1.0;
        return;
      case 'H':
        out[index] = 0.6;   out[index+1] = 0.6; 
        out[index+2] = 0.9; out[index+3] = 1.0;
        return;
      case 'E':
        out[index] = 0.2;   out[index+1] = 0.8; 
        out[index+2] = 0.2; out[index+3] = 1.0;
        return;
    }
  }, null, null);
};

exports.rainbow = function(grad) {
  if (!grad) {
    grad = gradient('rainbow');
  }
  var colorFunc = new ColorOp(function(a, out, index) {
    var t = 0.0;
    var limits = this.chainLimits[a.residue().chain().name()];
    if (limits !== undefined) {
      var idx = a.residue().index();
      t =  (idx - limits[0])/(limits[1]-limits[0]);
    } 
    var x = [1,1,1,1];
    grad.colorAt(x, t);
    out[index] = x[0];
    out[index+1] = x[1];
    out[index+2] = x[2];
    out[index+3] = x[3];
  }, function(obj) {
    var chains = obj.chains();
    this.chainLimits = {};
    for (var i = 0; i < chains.length; ++i) {
      var bb = chains[i].backboneTraces();
      if (bb.length === 0) {
        continue;
      }
      var minIndex = bb[0].residueAt(0).index(), 
          maxIndex = bb[0].residueAt(bb[0].length()-1).index();
      for (var j = 1; j < bb.length; ++j) {
        var bbj = bb[j];
        minIndex = Math.min(minIndex, bbj.residueAt(0).index());
        maxIndex = Math.max(maxIndex, bbj.residueAt(bbj.length()-1).index());
      }
      if (minIndex !== maxIndex) {
        this.chainLimits[chains[i].name()] = [minIndex, maxIndex];
      }
    }
  },
  function() {
    this.chainLimits = null;
  });
  return colorFunc;
};

exports.ssSuccession = function(grad, coilColor) {
  if (!grad) {
    grad = gradient('rainbow');
  }
  if (!coilColor) {
    coilColor = exports.forceRGB('lightgrey');
  } else {
    coilColor = exports.forceRGB(coilColor);
  }
  var colorFunc = new ColorOp(function(a, out, index) {
    var idx = a.residue().index();
    var limits = this.chainLimits[a.residue().chain().name()];
    var ssIndex = limits.indices[idx];
    if (ssIndex === -1) {
      out[index] = coilColor[0];
      out[index+1] = coilColor[1];
      out[index+2] = coilColor[2];
      out[index+3] = coilColor[3];
      return;
    }
    var t = 0.0;
    if (limits.max === null) {
    }
    if (limits.max !== null) {
      t =  ssIndex/(limits.max > 0 ? limits.max : 1);
    } 
    var x = [0,0,0,0];
    grad.colorAt(x, t);
    out[index] = x[0];
    out[index+1] = x[1];
    out[index+2] = x[2];
    out[index+3] = x[3];
  }, function(obj) {
    var chains = obj.chains();
    this.chainLimits = {};
    for (var i = 0; i < chains.length; ++i) {
      var residues = chains[i].residues();
      var maxIndex = null;
      var indices = {};
      var ssIndex = 0;
      var lastSS = 'C';
      for (var j = 0; j < residues.length; ++j) {
        var ss =  residues[j].ss();
        if (ss === 'C') {
          if (lastSS !== 'C') {
            ssIndex++;
          }
          indices[residues[j].index()] = -1;
        } else {
          maxIndex = ssIndex;
          indices[residues[j].index()] = ssIndex;
        }
        lastSS = ss;
      }
      this.chainLimits[chains[i].name()] = {
        indices : indices,
        max: maxIndex
      };
    }
  },
  function() {
    this.chainLimits = null;
  });
  return colorFunc;
};

exports.byChain = function(grad) {
  if (!grad) {
    grad = gradient('rainbow');
  }
  var colorFunc = new ColorOp(function(a, out, index) {
    var chainIndex = this.chainIndices[a.residue().chain().name()];
    var t =  chainIndex*this.scale;
    var x = [0,0,0,0];
    grad.colorAt(x, t);
    out[index+0] = x[0];
    out[index+1] = x[1];
    out[index+2] = x[2];
    out[index+3] = x[3];
  }, function(obj) {
    var chains = obj.chains();
    this.chainIndices = {};
    for (var i = 0; i < chains.length; ++i) {
      this.chainIndices[chains[i].name()] = i;
    }
    this.scale = chains.length > 1 ? 1.0/(chains.length-1) : 1.0;
  },
  function() {
    this.chainIndices = null;
  });
  return colorFunc;
};

function getMinMaxRange(obj, iter, propName) {
  var min = null;
  var max = null;
  obj[iter](function(item) {
    var value = item.prop(propName);
    if (min === null && max === null) {
      min = max = value;
      return;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
  });
  return { min: min, max: max };
}

var gradColor = (function() {
  var color = vec4.create();
  return function(out, index, grad, t) {
    grad.colorAt(color, t);
    out[index+0] = color[0];
    out[index+1] = color[1];
    out[index+2] = color[2];
    out[index+3] = color[3];
  };
})();

function colorByItemProp(propName, grad, range, iter, item) {
  if (!grad) {
    grad = gradient('rainbow');
  }
  return new ColorOp(function(a, out, index) {
      var t = 0.0;
      if (this._min !== this._max) {
        t = (item(a).prop(propName) - this._min)/(this._max - this._min);
      }
      gradColor(out, index, grad, t);
    }, 
    function(obj) {
      if (range !== undefined) {
        this._min = range[0];
        this._max = range[1];
        return;
      }
      range = getMinMaxRange(obj, iter, propName);
      this._min = range.min;
      this._max = range.max;
    }, 
    function() { }
  );
}

exports.byAtomProp = function(propName, grad, range) {
  return colorByItemProp(propName, grad, range, 'eachAtom', 
                         function(a) {return a;});
};

exports.byResidueProp = function(propName, grad, range) {
  return colorByItemProp(propName, grad, range, 'eachResidue', 
                         function(a) {return a.residue();});
};

// linearly interpolates the array of colors and returns it as a Float32Array
// color must be an array containing a sequence of R,G,B triples.
exports.interpolateColor = function(colors, num) {
  var out = new Float32Array((num*(colors.length/4-1) + 1)*4);
  var index = 0;
  var bf = vec4.create(), af = vec4.create();
  var halfNum = num/2;
  for (var i = 0; i < colors.length/4-1; ++i) {
    vec4.set(bf, colors[4*i+0], colors[4*i+1], colors[4*i+2], colors[4*i+3]);
    vec4.set(af, colors[4*i+4], colors[4*i+5], colors[4*i+6], colors[4*i+7]);
    for (var j = 0; j < num; ++j) {
      var t = j < halfNum ? 0.0 : 1.0; 
      out[index+0] = bf[0]*(1-t)+af[0]*t;
      out[index+1] = bf[1]*(1-t)+af[1]*t;
      out[index+2] = bf[2]*(1-t)+af[2]*t;
      out[index+3] = bf[3]*(1-t)+af[3]*t;
      index+=4;
    }
  }
  out[index+0] = af[0];
  out[index+1] = af[1];
  out[index+2] = af[2];
  out[index+3] = af[3];
  return out;
};


// initialize gradients with default colors
exports.initGradients();

return exports;
});
