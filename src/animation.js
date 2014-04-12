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

(function(exports) {
"use strict";

// base for all animations, e.g. position transitions, slerping etc.
function Animation(from, to, duration) {
  this._from = from;
  this._to = to;
  this._duration = duration;
  this._left = duration;
  this._start = Date.now();
}

Animation.prototype.step = function() {
  this._left = Math.max(0, this._duration - (Date.now() - this._start));
  console.log(this._left, this._duration);
  var t = this._duration > 0.0 ? (1.0 - this._left/this._duration) : 1.0;
  return this._setTo(t);
};

Animation.prototype.finished = function() {
  return this._left === 0;
};



function Move(from, to, duration) {
  Animation.prototype.constructor.call(this, from, to, duration);
  this._current = vec3.clone(from);
}

derive(Move, Animation);

Move.prototype._setTo = function(t) {
  vec3.lerp(this._current, this._from, this._to, t);
  return this._current;
};

exports.Move = Move;

return true;
})(this);
