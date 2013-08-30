module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '',
        preserveComments : false,
        report : 'gzip'
      },
      build: {
        src: 'js/<%= pkg.name %>.js',
        dest: 'js/<%= pkg.name %>.min.js'
      }
    },
    jshint : {
      options: { multistr :true },
      all : ['src/geom.js', 'src/viewer.js', 'src/color.js', 'src/mol.js'],
    },

    concat: {
      dist: {
        src: ['src/geom.js', 'src/color.js', 'src/mol.js', 'src/render.js', 'src/viewer.js'],
        dest: 'js/pv.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'jshint']);

};
