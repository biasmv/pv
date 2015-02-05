define(['utils'], function(utils) {

return function() {
  test("binary search", function() {
    var VALUES = [1,2,4,6,10,20,21,22,23];
    strictEqual(0, utils.binarySearch(VALUES, 1));
    strictEqual(1, utils.binarySearch(VALUES, 2));
    strictEqual(2, utils.binarySearch(VALUES, 4));
    strictEqual(3, utils.binarySearch(VALUES, 6));
    strictEqual(4, utils.binarySearch(VALUES, 10));
    strictEqual(5, utils.binarySearch(VALUES, 20));
    strictEqual(6, utils.binarySearch(VALUES, 21));
    strictEqual(7, utils.binarySearch(VALUES, 22));
    strictEqual(8, utils.binarySearch(VALUES, 23));
    strictEqual(-1, utils.binarySearch(VALUES, 25));
    strictEqual(-1, utils.binarySearch(VALUES, 0));
    strictEqual(-1, utils.binarySearch(VALUES, 3));
  });

  test("index of first larger equal than", function() {
    var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 0), 0);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 1), 1);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 2), 2);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 3), 2);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 4), 3);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 5), 4);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 6), 6);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 7), 7);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 8), 8);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, -1), -1);
    strictEqual(utils.indexFirstLargerEqualThan(VALUES, 9), 8);
  });

  test("index of last smaller than", function() {
    var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
    strictEqual(utils.indexLastSmallerThan(VALUES, 0), -1);
    strictEqual(utils.indexLastSmallerThan(VALUES, 1), 0);
    strictEqual(utils.indexLastSmallerThan(VALUES, 2), 1);
    strictEqual(utils.indexLastSmallerThan(VALUES, 3), 1);
    strictEqual(utils.indexLastSmallerThan(VALUES, 4), 2);
    strictEqual(utils.indexLastSmallerThan(VALUES, 5), 4);
    strictEqual(utils.indexLastSmallerThan(VALUES, 6), 5);
    strictEqual(utils.indexLastSmallerThan(VALUES, 7), 6);
    strictEqual(utils.indexLastSmallerThan(VALUES, 8), 7);
    strictEqual(utils.indexLastSmallerThan(VALUES, -1), -1);
    strictEqual(utils.indexLastSmallerThan(VALUES, -2), -1);
    strictEqual(utils.indexLastSmallerThan(VALUES, 9), 8);
    strictEqual(utils.indexLastSmallerThan(VALUES, 20), 8);
  });

  test("index of last smaller equal than", function() {
    var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 0), 0);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 1), 1);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 2), 2);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 3), 2);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 4), 3);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 5), 5);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 6), 6);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 7), 7);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 8), 8);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, -1), -1);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, -2), -1);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, -3), -1);
    strictEqual(utils.indexLastSmallerEqualThan(VALUES, 9), 8);
  });

};

});
