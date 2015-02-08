SOURCE_FILES = [
  'src/buffer-allocators.js',
  'src/color.js',
  'src/geom.js',
  'src/gfx/animation.js',
  'src/gfx/base-geom.js',
  'src/gfx/cam.js',
  'src/gfx/chain-data.js',
  'src/gfx/custom-mesh.js',
  'src/gfx/framebuffer.js',
  'src/gfx/geom-builders.js',
  'src/gfx/indexed-vertex-array.js',
  'src/gfx/label.js',
  'src/gfx/line-geom.js',
  'src/gfx/mesh-geom.js',
  'src/gfx/render.js',
  'src/gfx/scene-node.js',
  'src/gfx/shaders.js',
  'src/gfx/vert-assoc.js',
  'src/gfx/vertex-array-base.js',
  'src/gfx/vertex-array.js',
  'src/io.js',
  'src/mol/all.js',
  'src/mol/atom.js',
  'src/mol/bond.js',
  'src/mol/chain.js',
  'src/mol/mol.js',
  'src/mol/residue.js',
  'src/mol/select.js',
  'src/mol/trace.js',
  'src/mol/symmetry.js',
  'src/pv.js',
  'src/slab.js',
  'src/touch.js',
  'src/unique-object-id-pool.js',
  'src/utils.js',
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
        var pv = factory();\n\
        root.pv = pv;\n\
        root.io = pv.io;\n\
        root.mol = pv.mol;\n\
        root.color = pv.color;\n\
        root.rgb = pv.rgb;\n\
        root.viewpoint = pv.viewpoint;\n\
        root.vec3 = pv.vec3;\n\
        root.vec4 = pv.vec4;\n\
        root.mat3 = pv.mat3;\n\
        root.mat4 = pv.mat4;\n\
        root.quat = pv.quat;\n\
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
        undef : true,
        browser : true,
        devel : true,
        predef : [ 'define' ],
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
            filePath: outputFile, 
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
