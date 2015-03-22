require(['unique-object-id-pool'], function(UniqueObjectIdPool) { 

test("simple continuous range", function(assert) {
  var idPool = new UniqueObjectIdPool();
  var range = idPool.getContinuousRange(5);
  assert.strictEqual(range.nextId({}), 1);
  assert.strictEqual(range.nextId({}), 2);
  assert.strictEqual(range.nextId({}), 3);
  assert.strictEqual(range.nextId({}), 4);
  assert.strictEqual(range.nextId({}), 5);
  assert.strictEqual(range.length(), 5);
  range.recycle();
});

test("clear free ranges in case there are not enough ids", function(assert) {
  var idPool = new UniqueObjectIdPool();
  var range = idPool.getContinuousRange(5);
  range.recycle();
  range = idPool.getContinuousRange(65536);
  assert.ok(range !== null);
});

});
