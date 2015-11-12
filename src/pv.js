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

define(
  ['./gl-matrix', './viewer', './io', './mol/all', './color', 
    './viewpoint', './traj'], 
  function(glMatrix, viewer, io, mol, color, viewpoint, traj) {
  'use strict';
  // export 
  return {
    Viewer : viewer.Viewer,
    isWebGLSupported : viewer.isWebGLSupported,
    io : io,
    traj : traj,
    color : color,
    mol : mol,
    // for backward compatibility prior to version 1.4
    rgb : {
      setColorPalette : color.setColorPalette,
      hex2rgb : color.hex2rgb
    },
    vec3 : glMatrix.vec3,
    vec4 : glMatrix.vec4,
    mat3 : glMatrix.mat3,
    mat4 : glMatrix.mat4,
    quat : glMatrix.quat,
    viewpoint : viewpoint
  };
});
