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
  [
    '../gl-matrix', 
    '../utils', 
    '../geom'
  ], 
  function(
    glMatrix, 
    utils, 
    geom) {
"use strict";

var vec3 = glMatrix.vec3;
var quat = glMatrix.quat;
var mat3 = glMatrix.mat3;

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


Animation.prototype = {
  setLooping : function(looping) {
    this._looping = looping;
  },
  step : function(cam) {
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
    this.apply(cam, t);
    return this._finished;
  },

  apply : function(cam, t) {
    var smoothInterval = (1 - Math.cos(t * Math.PI ) ) / 2;
    this._current = this._from * (1-smoothInterval) + this._to * smoothInterval;
    cam.setZoom(this._current);
  },

  finished : function() {
    return this._finished;
  }
};



function Move(from, to, duration) {
  Animation.call(this, vec3.clone(from), vec3.clone(to), duration);
  this._current = vec3.clone(from);
}

utils.derive(Move, Animation, {
  apply : function(cam, t) {
    var smoothInterval = (1 - Math.cos(t * Math.PI ) ) / 2;
    vec3.lerp(this._current, this._from, this._to, smoothInterval);
    cam.setCenter(this._current);
  }
});

function Rotate(initialRotation, destinationRotation, duration) {
  var initial = mat3.create();
  var to = mat3.create();
  mat3.fromMat4(initial, initialRotation);
  mat3.fromMat4(to, destinationRotation);
  var initialQuat = quat.create();
  var toQuat = quat.create();
  quat.fromMat3(initialQuat, initial);
  quat.fromMat3(toQuat, to);
  this._current = mat3.create();
  Animation.call(this, initialQuat, toQuat, duration);
}

utils.derive(Rotate, Animation, {
  apply : (function() {
    var quatRot = quat.create();
    
    return function(cam, t) {
      quat.slerp(quatRot, this._from, this._to, t);
      mat3.fromQuat(this._current, quatRot);
      cam.setRotation(this._current);
    };
  })()
});

function RockAndRoll(axis, duration) {
  Animation.call(this, null, null, duration);
  this._axis = vec3.clone(axis);
  this.setLooping(true);
  this._previousAngle = 0.0;
}

utils.derive(RockAndRoll, Animation, {
  apply : (function() {
    var axisRot = mat3.create();
    var rotation = mat3.create();
    return function(cam, t) {
      mat3.fromMat4(rotation, cam.rotation());
      var angle = 0.2 * Math.sin(2 * t * Math.PI);
      var deltaAngle = angle - this._previousAngle;
      this._previousAngle = angle;
      geom.axisRotation(axisRot, this._axis, deltaAngle);
      mat3.mul(rotation, axisRot, rotation);
      cam.setRotation(rotation);
    };
  })()
});

function Spin(axis, speed) {
  var duration = 1000 * (2 * Math.PI / speed);
  Animation.call(this, null, null, duration);
  this._axis = vec3.clone(axis);
  this.setLooping(true);
  this._speed = speed;
  this._previousT = 0.0;
}

utils.derive(Spin, Animation, {
  apply : (function() {
    var axisRot = mat3.create();
    var rotation = mat3.create();
    return function(cam, t) {
      mat3.fromMat4(rotation, cam.rotation());
      var angle = Math.PI * 2 * (t - this._previousT);
      this._previousT = t;
      geom.axisRotation(axisRot, this._axis, angle);
      mat3.mul(rotation, axisRot, rotation);
      cam.setRotation(rotation);
    };
  })(),
  setSpeed : function(speed) {
    this._speed = speed;
    this._duration = 1000 * (2 * Math.PI / speed);
  },
  setAxis : function(axis) {
    this._axis = axis;
  }
});


function AnimationControl() {
  this._animations = [];
}

AnimationControl.prototype = {
  // apply all currently active animations to the camera 
  // returns true if there are pending animations.
  run : function(camera) {
    var time = Date.now();
    this._animations = this._animations.filter(function(anim) {
      return !anim.step(camera, time);
    });
    return this._animations.length > 0;
  },
  add : function(animation) {
    this._animations.push(animation);
  },
  remove : function(animation) {
    this._animations = this._animations.filter(function(a) {
      return a !== animation;
    });
  }
};


function move(from, to, duration) {
  return new Move(from, to, duration);
}

function rotate(from, to, duration) {
  return new Rotate(from, to, duration);
}

function zoom(from, to, duration) {
  return new Animation(from, to, duration);
}


function spin(axis, speed) {
  return new Spin(axis, speed);
}

function rockAndRoll() {
  return new RockAndRoll([0, 1, 0], 2000);
}

return {
  AnimationControl : AnimationControl,
  move : move,
  rotate : rotate,
  zoom : zoom,
  rockAndRoll : rockAndRoll,
  spin : spin
};

});
