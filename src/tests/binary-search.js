define(['core'], function(core) {

return function() {
  test("binary search", function() {
    var VALUES = [1,2,4,6,10,20,21,22,23];
    strictEqual(0, core.binarySearch(VALUES, 1));
    strictEqual(1, core.binarySearch(VALUES, 2));
    strictEqual(2, core.binarySearch(VALUES, 4));
    strictEqual(3, core.binarySearch(VALUES, 6));
    strictEqual(4, core.binarySearch(VALUES, 10));
    strictEqual(5, core.binarySearch(VALUES, 20));
    strictEqual(6, core.binarySearch(VALUES, 21));
    strictEqual(7, core.binarySearch(VALUES, 22));
    strictEqual(8, core.binarySearch(VALUES, 23));
    strictEqual(-1, core.binarySearch(VALUES, 25));
    strictEqual(-1, core.binarySearch(VALUES, 0));
    strictEqual(-1, core.binarySearch(VALUES, 3));
  });

  test("index of first larger equal than", function() {
    var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 0), 0);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 1), 1);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 2), 2);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 3), 2);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 4), 3);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 5), 4);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 6), 6);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 7), 7);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 8), 8);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, -1), -1);
    strictEqual(core.indexFirstLargerEqualThan(VALUES, 9), 8);
  });

  test("index of last smaller than", function() {
    var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
    strictEqual(core.indexLastSmallerThan(VALUES, 0), -1);
    strictEqual(core.indexLastSmallerThan(VALUES, 1), 0);
    strictEqual(core.indexLastSmallerThan(VALUES, 2), 1);
    strictEqual(core.indexLastSmallerThan(VALUES, 3), 1);
    strictEqual(core.indexLastSmallerThan(VALUES, 4), 2);
    strictEqual(core.indexLastSmallerThan(VALUES, 5), 4);
    strictEqual(core.indexLastSmallerThan(VALUES, 6), 5);
    strictEqual(core.indexLastSmallerThan(VALUES, 7), 6);
    strictEqual(core.indexLastSmallerThan(VALUES, 8), 7);
    strictEqual(core.indexLastSmallerThan(VALUES, -1), -1);
    strictEqual(core.indexLastSmallerThan(VALUES, -2), -1);
    strictEqual(core.indexLastSmallerThan(VALUES, 9), 8);
    strictEqual(core.indexLastSmallerThan(VALUES, 20), 8);
  });

  test("index of last smaller equal than", function() {
    var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 0), 0);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 1), 1);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 2), 2);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 3), 2);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 4), 3);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 5), 5);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 6), 6);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 7), 7);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 8), 8);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, -1), -1);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, -2), -1);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, -3), -1);
    strictEqual(core.indexLastSmallerEqualThan(VALUES, 9), 8);
  });

};

});
