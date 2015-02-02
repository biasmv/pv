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

require(['./viewer', './io', './mol/all', './color'], 
       function(viewer, io, mol, color) {
  (function(root) {
    'use strict';
    var publicApi = {
      Viewer : viewer.Viewer,
      isWebGLSupported : viewer.isWebGLSupported,
      io : io,
      color : color,
      mol : mol
    };
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, 
    // and plain browser loading
    if (typeof define === 'function' && define.amd) {
      define(function() { return publicApi; });
    } else if (typeof exports !== 'undefined') {
      module.exports = publicApi;
    } else {
      root.pv = publicApi;
      root.io = publicApi.io;
      root.mol = publicApi.mol;
      root.color = publicApi.color;
    }
  }(this));
});
