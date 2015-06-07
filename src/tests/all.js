"use strict";

blanket.options('existingRequireJS', true);
function addCustomAssertions(QUnit) {
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
}

addCustomAssertions(QUnit);

require.config({
    baseUrl : 'src',
});

var UNIT_TESTS = [
  'tests/mol/basics',
  'tests/binary-search',
  'tests/mol/iterators',
  'tests/mol/select',
  'tests/mol/assign-helix-sheet',
  'tests/mol/superpose',
  'tests/viewer/functional',
  'tests/io/pdb',
  'tests/colors',
  'tests/gfx/base-geom',
  'tests/gfx/canvas',
  'tests/io/sdf',
  'tests/unique-object-id-pool',
  'tests/viewer/pick'
];

// require the unit tests.
require(UNIT_TESTS, function() {
  console.log('loaded unit tests', UNIT_TESTS);
  // manually call setupCoverage to avoid "you must call setupCoverage" 
  // errors.
  blanket.noConflict().setupCoverage();
  QUnit.load();
  QUnit.start();
});
