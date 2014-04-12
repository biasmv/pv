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
  this._looping = false;
  this._finished = false;
}

Animation.prototype.setLooping = function(looping) {
  this._looping = looping;
};

Animation.prototype.step = function() {
  var now = Date.now();
  var elapsed = now - this._start;
  var t;
  if (this._duration === 0) {
    t = 1.0;
  } else {
    if (this._looping) {
      var times = Math.floor(elapsed/this._duration);
      t = (elapsed - times * this._duration)/this._duration;
    } else {
      elapsed = Math.min(this._duration, elapsed);
      t = elapsed/this._duration;
      this._finished = t === 1.0;
    }
  }
  return this._setTo(t);
};

Animation.prototype.finished = function() {
  return this._finished;
};



function Move(from, to, duration) {
  Animation.prototype.constructor.call(this, vec3.clone(from), 
                                       vec3.clone(to), duration);
  this._current = vec3.clone(from);
}

derive(Move, Animation);

Move.prototype._setTo = function(t) {
  vec3.lerp(this._current, this._from, this._to, t);
  return this._current;
};

function RockAndRoll(rotation, axis, duration) {
  var initial = mat3.create();
  mat3.fromMat4(initial, rotation);
  Animation.prototype.constructor.call(this, initial, null, duration);
  this._axis = vec3.clone(axis);
  this.setLooping(true);
  this._current = mat3.create();
  this._angle = 0.0;
}

derive(RockAndRoll, Animation);

RockAndRoll.prototype._setTo = (function() {
  var axisRot = mat3.create();
  return function(t) {
    var angle = 0.2 * Math.sin(2 * t * Math.PI);
    geom.axisRotation(axisRot, this._axis, angle);
    mat3.mul(this._current, this._from, axisRot);
    return this._current;
  };
})();

exports.Move = Move;
exports.RockAndRoll = RockAndRoll;

return true;
})(this);
