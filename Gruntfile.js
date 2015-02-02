SOURCE_FILES = [
  'src/animation.js',
  'src/base-geom.js',
  'src/buffer-allocators.js',
  'src/cam.js',
  'src/chain-data.js',
  'src/color.js',
  'src/core.js',
  'src/custom-mesh.js',
  'src/framebuffer.js',
  'src/geom-builders.js',
  'src/geom.js',
  'src/indexed-vertex-array.js',
  'src/io/pdb.js',
  'src/io.js',
  'src/label.js',
  'src/line-geom.js',
  'src/mesh-geom.js',
  'src/mol/all.js',
  'src/mol/atom.js',
  'src/mol/bond.js',
  'src/mol/chain.js',
  'src/mol/mol.js',
  'src/mol/residue.js',
  'src/mol/select.js',
  'src/pv.js',
  'src/render.js',
  'src/scene-node.js',
  'src/scene.js',
  'src/shaders.js',
  'src/slab.js',
  'src/symmetry.js',
  'src/touch.js',
  'src/trace.js',
  'src/unique-object-id-pool.js',
  'src/vert-assoc.js',
  'src/vertex-array-base.js',
  'src/vertex-array.js',
  'src/viewer.js',
  'src/viewpoint.js'
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
        src: 'js/pv.rel.js',
        dest: 'js/pv.min.js'
      }
    },
    jshint : {
      options: { 
        multistr :true, 
        curly : true, 
        eqeqeq : true,
        forin : true,
        maxlen: 80,
        /*freeze : true, */
        immed : true,
        latedef : true,
        // would love to use, but current project structure does not allow 
        // for it.
        /* undef : true, */
        unused : true
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
