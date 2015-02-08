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

define(function() {

"use strict";

// A scene node holds a set of child nodes to be rendered on screen. Later on,
// the SceneNode might grow additional functionality commonly found in a scene
// graph, e.g. coordinate transformations.
function SceneNode(gl) {
  this._children = [];
  this._visible = true;
  this._name = name || '';
  this._gl = gl;
  this._order = 1;
}


SceneNode.prototype = {

  order : function(order) {
    if (order !== undefined) {
      this._order = order;
    }
    return this._order;
  },

  add : function(node) {
    this._children.push(node);
  },

  draw : function(cam, shaderCatalog, style, pass) {
    for (var i = 0, e = this._children.length; i !== e; ++i) {
      this._children[i].draw(cam, shaderCatalog, style, pass);
    }
  },

  show : function() {
    this._visible = true;
  },

  hide : function() {
    this._visible = false;
  },

  name : function(name) {
    if (name !== undefined) {
      this._name = name;
    }
    return this._name;
  },

  destroy : function() {
    for (var i = 0; i < this._children.length; ++i) {
      this._children[i].destroy();
    }
  },

  visible : function() {
    return this._visible;
  }
};

return SceneNode;

});


