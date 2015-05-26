module.exports = function(grunt) {

  grunt.initConfig({
    'jslint'  : {
      all     : {
        src : [ 'src/*.js' ],
        directives : {
          indent : 2
        }
      }
    },
    'uglify'  : {
        target : {
          files : { 'dist/bin-packing-grid.js' : 'src/bin-packing-grid.js' }
      }
    },
    'connect': {
      demo: {
        options: {
          open: true,
          keepalive: true
        }
      }
    },
    'gh-pages': {
      options: {
        clone: 'bower_components/bin-packing-grid'
      },
      src: [
        'bower_components/**/*',
        '!bower_components/bin-packing-grid/**/*',
        'demo/*', 'src/*', 'index.html'
      ]
    },
    'replace': {
      example: {
        src: ['src/*'],
        dest: 'dist/',
        replacements: [{
          from: 'bower_components',
          to: '..'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('lint',  ['jslint']);
  grunt.registerTask('build',  ['jslint', 'replace', 'uglify']);
  grunt.registerTask('deploy', ['gh-pages']);
  grunt.registerTask('server', ['connect']);

};
