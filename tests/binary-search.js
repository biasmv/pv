test("binary search", function() {
  var VALUES = [1,2,4,6,10,20,21,22,23];
  strictEqual(0, binarySearch(VALUES, 1));
  strictEqual(1, binarySearch(VALUES, 2));
  strictEqual(2, binarySearch(VALUES, 4));
  strictEqual(3, binarySearch(VALUES, 6));
  strictEqual(4, binarySearch(VALUES, 10));
  strictEqual(5, binarySearch(VALUES, 20));
  strictEqual(6, binarySearch(VALUES, 21));
  strictEqual(7, binarySearch(VALUES, 22));
  strictEqual(8, binarySearch(VALUES, 23));
  strictEqual(-1, binarySearch(VALUES, 25));
  strictEqual(-1, binarySearch(VALUES, 0));
  strictEqual(-1, binarySearch(VALUES, 3));
});

test("index of first larger equal than", function() {
  var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
  strictEqual(indexFirstLargerEqualThan(VALUES, 0), 0);
  strictEqual(indexFirstLargerEqualThan(VALUES, 1), 1);
  strictEqual(indexFirstLargerEqualThan(VALUES, 2), 2);
  strictEqual(indexFirstLargerEqualThan(VALUES, 3), 2);
  strictEqual(indexFirstLargerEqualThan(VALUES, 4), 3);
  strictEqual(indexFirstLargerEqualThan(VALUES, 5), 4);
  strictEqual(indexFirstLargerEqualThan(VALUES, 6), 6);
  strictEqual(indexFirstLargerEqualThan(VALUES, 7), 7);
  strictEqual(indexFirstLargerEqualThan(VALUES, 8), 8);
  strictEqual(indexFirstLargerEqualThan(VALUES, -1), -1);
  strictEqual(indexFirstLargerEqualThan(VALUES, 9), 8);
});

test("index of last smaller than", function() {
  var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
  strictEqual(indexLastSmallerThan(VALUES, 0), -1);
  strictEqual(indexLastSmallerThan(VALUES, 1), 0);
  strictEqual(indexLastSmallerThan(VALUES, 2), 1);
  strictEqual(indexLastSmallerThan(VALUES, 3), 1);
  strictEqual(indexLastSmallerThan(VALUES, 4), 2);
  strictEqual(indexLastSmallerThan(VALUES, 5), 4);
  strictEqual(indexLastSmallerThan(VALUES, 6), 5);
  strictEqual(indexLastSmallerThan(VALUES, 7), 6);
  strictEqual(indexLastSmallerThan(VALUES, 8), 7);
  strictEqual(indexLastSmallerThan(VALUES, -1), -1);
  strictEqual(indexLastSmallerThan(VALUES, -2), -1);
  strictEqual(indexLastSmallerThan(VALUES, 9), 8);
  strictEqual(indexLastSmallerThan(VALUES, 20), 8);
});

test("index of last smaller equal than", function() {
  var VALUES = [0, 1, 2, 4, 5, 5, 6, 7, 8];
  strictEqual(indexLastSmallerEqualThan(VALUES, 0), 0);
  strictEqual(indexLastSmallerEqualThan(VALUES, 1), 1);
  strictEqual(indexLastSmallerEqualThan(VALUES, 2), 2);
  strictEqual(indexLastSmallerEqualThan(VALUES, 3), 2);
  strictEqual(indexLastSmallerEqualThan(VALUES, 4), 3);
  strictEqual(indexLastSmallerEqualThan(VALUES, 5), 5);
  strictEqual(indexLastSmallerEqualThan(VALUES, 6), 6);
  strictEqual(indexLastSmallerEqualThan(VALUES, 7), 7);
  strictEqual(indexLastSmallerEqualThan(VALUES, 8), 8);
  strictEqual(indexLastSmallerEqualThan(VALUES, -1), -1);
  strictEqual(indexLastSmallerEqualThan(VALUES, -2), -1);
  strictEqual(indexLastSmallerEqualThan(VALUES, -3), -1);
  strictEqual(indexLastSmallerEqualThan(VALUES, 9), 8);
});
