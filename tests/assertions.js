// contains a few assertions we use for testing
QUnit.assert.almostEqual = function(actual, expected, epsilon, message) {
  epsilon = epsilon || 0.000001;
  var passes = Math.abs(actual -expected) < epsilon;
  QUnit.push(passes, actual, expected, message);
}

QUnit.assert.mat4Equal = function(actual, expected, epsilon, message) {
  for (var i = 0; i < 16; ++i) {
    QUnit.assert.almostEqual(actual[i], expected[i], epsilon, message);
  }
}

QUnit.assert.mat3Equal = function(actual, expected, epsilon, message) {
  for (var i = 0; i < 9; ++i) {
    QUnit.assert.almostEqual(actual[i], expected[i], epsilon, message);
  }
}

QUnit.assert.vec3Equal = function(actual, expected, epsilon, message) {
  for (var i = 0; i < 3; ++i) {
    QUnit.assert.almostEqual(actual[i], expected[i], epsilon, message);
  }
}

QUnit.assert.vec2Equal = function(actual, expected, epsilon, message) {
  for (var i = 0; i < 2; ++i) {
    QUnit.assert.almostEqual(actual[i], expected[i], epsilon, message);
  }
}

QUnit.assert.vec4Equal = function(actual, expected, epsilon, message) {
  for (var i = 0; i < 4; ++i) {
    QUnit.assert.almostEqual(actual[i], expected[i], epsilon, message);
  }
}


