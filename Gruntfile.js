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

var START_SNIPPET="\n\
(function (root, factory) {\n\
    if (typeof define === 'function' && define.amd) {\n\
        define([], factory);\n\
    } else {\n\
        root.pv = factory();\n\
        root.io = root.pv.io;\n\
        root.mol = root.pv.mol;\n\
        root.color = root.pv.color;\n\
        root.viewpoint = root.pv.viewpoint;\n\
    }\n\
}(this, function () {\n\
    // modules will be inlined here\n\
";

var END_SNIPPET='return pv; }));';

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

    removelogging : {
      dist :  {
        src : 'js/pv.dbg.js',
        dest : 'js/pv.rel.js',
      }
    },
    requirejs: {
      js : { options : {
        findNestedDependencies : true,
        baseUrl : 'src',
        optimize: 'none',
        skipModuleInsertion : true,
        include: ['pv'],
        out : 'js/pv.dbg.js',
        onModuleBundleComplete : function(data) {
          var fs = require('fs'),
          amdclean = require('amdclean'),
          outputFile = data.path;
          fs.writeFileSync(outputFile, amdclean.clean({
            'filePath': outputFile, 
            transformAMDChecks : false,
            aggressiveOptimizations : true,
            createAnonymousAMDModule : true,
            wrap : {
              start : START_SNIPPET,
              end : END_SNIPPET
            }

          }));
        },
      }}
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-remove-logging');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  // Default task(s).
  grunt.registerTask('default', [
    'jshint', 'requirejs:js', 'removelogging', 'uglify'
  ]);

};
