require(['gfx/canvas', ], function(canvas) { 

function createCanvas(width, height, antialias, forceManualAntialiasing) {
  var options =  {
    width: width, height : height, 
    backgroundColor : [0,0,0,0],
    antialias : antialias,
    forceManualAntialiasing : forceManualAntialiasing
  };
  var c = new canvas.Canvas(document.getElementById('viewer'), options);
  c.initGL();
  return c;
}

test('Canvas.isWebGLSupported', 
     function(assert) {
  var canvas = createCanvas(200, 300, false, false);
  assert.ok(canvas.isWebGLSupported());
});

test('width and height without antialiasing', 
     function(assert) {
  var canvas = createCanvas(200, 300, false, false);

  assert.strictEqual(canvas.width(), 200);
  assert.strictEqual(canvas.height(), 300);
  assert.strictEqual(canvas.viewportWidth(), 200);
  assert.strictEqual(canvas.viewportHeight(), 300);
  assert.strictEqual(canvas.superSamplingFactor(), 1);
});

test('resize without antialiasing', 
     function(assert) {
  var canvas = createCanvas(200, 300, false, false);

  assert.strictEqual(canvas.width(), 200);
  assert.strictEqual(canvas.height(), 300);
  canvas.resize(100, 200);
  canvas.bind();
  assert.strictEqual(canvas.width(), 100);
  assert.strictEqual(canvas.height(), 200);
  assert.strictEqual(canvas.viewportWidth(), 100);
  assert.strictEqual(canvas.viewportHeight(), 200);
  assert.strictEqual(canvas.superSamplingFactor(), 1);
});

test('width and height with manual antialiasing', 
     function(assert) {
  var canvas = createCanvas(200, 300, true, true);

  assert.strictEqual(canvas.width(), 200);
  assert.strictEqual(canvas.height(), 300);
  assert.strictEqual(canvas.viewportWidth(), 400);
  assert.strictEqual(canvas.viewportHeight(), 600);
  assert.strictEqual(canvas.superSamplingFactor(), 2);
});

test('resize with manual antialiasing', 
     function(assert) {
  var canvas = createCanvas(200, 300, true, true);

  assert.strictEqual(canvas.width(), 200);
  assert.strictEqual(canvas.height(), 300);
  assert.strictEqual(canvas.viewportWidth(), 400);
  assert.strictEqual(canvas.viewportHeight(), 600);
  assert.strictEqual(canvas.superSamplingFactor(), 2);
  canvas.resize(100, 200);
  canvas.bind();
  assert.strictEqual(canvas.width(), 100);
  assert.strictEqual(canvas.height(), 200);
  assert.strictEqual(canvas.viewportWidth(), 200);
  assert.strictEqual(canvas.viewportHeight(), 400);
  assert.strictEqual(canvas.superSamplingFactor(), 2);
});

test('width and height with antialiasing', 
     function(assert) {
  // many either be using manual or hardware fullscreen antialiasing
  var canvas = createCanvas(200, 300, true, false);

  assert.strictEqual(canvas.width(), 200);
  assert.strictEqual(canvas.height(), 300);
  var sf = canvas.superSamplingFactor();
  assert.strictEqual(canvas.viewportWidth(), sf * 200);
  assert.strictEqual(canvas.viewportHeight(), sf * 300);
});

test('resize with antialiasing', 
     function(assert) {
  // many either be using manual or hardware fullscreen antialiasing
  var canvas = createCanvas(200, 300, true, false);

  assert.strictEqual(canvas.width(), 200);
  assert.strictEqual(canvas.height(), 300);
  var sf = canvas.superSamplingFactor();
  assert.strictEqual(canvas.viewportWidth(), 200 * sf);
  assert.strictEqual(canvas.viewportHeight(), 300 * sf);
  canvas.resize(100, 200);
  canvas.bind();
  assert.strictEqual(canvas.width(), 100);
  assert.strictEqual(canvas.height(), 200);
  assert.strictEqual(canvas.viewportWidth(), 100 * sf);
  assert.strictEqual(canvas.viewportHeight(), 200 * sf);
});

});


