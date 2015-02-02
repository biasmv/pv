({
  baseUrl: "../src",
  name: "../deploy/almond",
  include : ['main'],
  out: "../pv.min.js",
  optimize : "uglify2",
  wrap: {
    startFile: 'start.frag',
    endFile: 'end.frag'
  }
})
