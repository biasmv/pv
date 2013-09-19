(function(exports) {
  if (window.console === 'undefined') {
    window.console = {};
    window.console.log = function() {};
    window.console.error = function() {};
    window.console.time = function() {};
    window.console.timeEnd = function() {};
    window.console.info = function() {};
  }

  return true;

})(this);
