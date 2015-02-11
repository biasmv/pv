require(['color'], function(color) { 

function compareColor(lhs, rhs) {
  strictEqual(lhs[0], rhs[0]);
  strictEqual(lhs[1], rhs[1]);
  strictEqual(lhs[2], rhs[2]);
}

test("force rgb from hex triplet", function() {
  var red = [1.0, 0.0, 0.0];
  compareColor([1.0, 0.0, 0.0], color.forceRGB('#f00'));
  compareColor([1.0, 0.0, 0.0], color.forceRGB('#ff0000'));
  compareColor([1.0, 1.0, 0.0], color.forceRGB('#ff0'));
  compareColor([1.0, 1.0, 0.0], color.forceRGB('#ffff00'));
});

test("force rgb from hex quadruplet", function() {
  compareColor([1.0, 0.0, 0.0, 1.0], color.forceRGB('#f00f'));
  compareColor([1.0, 0.0, 0.0, 0.0], color.forceRGB('#f000'));
  compareColor([1.0, 0.0, 0.0, 1.0], color.forceRGB('#ff0000ff'));
  compareColor([1.0, 0.0, 0.0, 0.0], color.forceRGB('#ff000000'));
});

test("force rgb from rgb", function() {
  var red = [1.0, 0.0, 0.0];
  compareColor([1.0, 0.0, 0.0], color.forceRGB([1.0, 0.0, 0.0]));
  compareColor([1.0, 1.0, 0.0], color.forceRGB([1.0, 1.0, 0.0]));
});

test("force rgb from color names", function() {
  var red = [1.0, 0.0, 0.0];
  compareColor([1.0, 0.0, 0.0], color.forceRGB('red'));
  compareColor([1.0, 1.0, 0.0], color.forceRGB('yellow'));
});

});
