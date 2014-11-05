SOURCE_FILES = [
  'src/core.js', 
  'src/geom.js', 
  'src/shade.js', 
  'src/vert-assoc.js',
  'src/vertex-array-base.js',
  'src/indexed-vertex-array.js',
  'src/vertex-array.js',
  'src/chain-data.js',
  'src/geom-builders.js',
  'src/scene.js',
  'src/symmetry.js', 
  'src/mol.js', 
  'src/io.js', 
  'src/trace.js',
  'src/render.js', 
  'src/cam.js',
  'src/buffer-allocators.js',
  'src/framebuffer.js',
  'src/shaders.js',
  'src/animation.js',
  'src/slab.js',
  'src/viewer.js'
];

ALL_FILES = ['src/gl-matrix.js'];
Array.prototype.push.apply(ALL_FILES, SOURCE_FILES);

var browserify = require("browserify");
var fs = require("fs");
var mkdirp = require("mkdirp");

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '',
        preserveComments : false,
        report : 'min'
      },
      build: {
        src: 'js/<%= pkg.name %>.rel.js',
        dest: 'js/<%= pkg.name %>.min.js'
      }
    },
    jshint : {
      options: { 
        multistr :true, 
        curly : true, 
        eqeqeq : true
      },
      all : SOURCE_FILES
    },

    concat: {
      dist: {
        src: ALL_FILES,
        dest: 'js/pv.dbg.js'
      }
    },
    removelogging : {
      dist :  {
        src : 'js/pv.dbg.js',
        dest : 'js/pv.rel.js',
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-remove-logging');

  // Default task(s).
  grunt.registerTask('default', [
    'concat', 'jshint', 'removelogging', 'uglify', 
  ]);


  grunt.registerTask('browserify', 'Browserifies the source', function(){
    // task is async
    var done = this.async();

    // create tmp dir
    mkdirp("build");

    var ws = fs.createWriteStream('build/pv.js');
    ws.on('finish', function () {
      done();
    });

    // expose the pv viewer
    var b = browserify({debug: true,hasExports: true});
    exposeBundles(b);
    b.bundle().pipe(ws);
  });

  // exposes the main package
  // + checks the config whether it should expose other packages
  function exposeBundles(b){
    var packageConfig = require("./package.json");

    b.add('./index.js', {expose: packageConfig.name });

    // check for addition exposed packages (not needed here)
    if(packageConfig.sniper !== undefined && packageConfig.sniper.exposed !== undefined){
      for(var i=0; i<packageConfig.sniper.exposed.length; i++){
        b.require(packageConfig.sniper.exposed[i]);
      }
    }
  }
};
