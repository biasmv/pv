!(function(exports) {
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



})(this);
