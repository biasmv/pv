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

};
