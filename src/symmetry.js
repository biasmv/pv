// Copyright (c) 2013-2015 Marco Biasini
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

define(function() {

"use strict";

// a list of rotation/translation operators to be applied to certain chains,
// typically of the asymmetric unit.
function SymGenerator(chains, matrices) {
  this._chains = chains || [];
  this._matrices = matrices || [];
}

SymGenerator.prototype = {

  addChain : function(name) {
    this._chains.push(name);
  },

  chains : function() { return this._chains; },

  addMatrix : function(matrix) {
    this._matrices.push(matrix);
  },

  matrices : function() { return this._matrices; },
  matrix : function(index) { return this._matrices[index]; }
};

// contains the definition for how to construct a biological assembly from
// an asymmetric unit. Essentially a list of rotation/translation operators
// to be applied to chains of the asymmetric unit.
function Assembly(name) {
  this._name = name;
  this._generators = [];
}


Assembly.prototype = {
  name : function() { return this._name; },

  generators : function() { return this._generators; },
  generator : function(index) { return this._generators[index]; },
  addGenerator : function(gen) { 
    this._generators.push(gen); 
  }
};

return {
  SymGenerator : SymGenerator,
  Assembly : Assembly
};

});


