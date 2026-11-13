module.exports = function(grunt) {

  grunt.initConfig({
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
        'demo/*', 'src/*', 'img/*', 'index.html'
      ]
    },
    vulcanize: {
      default: {
        options: {
          inline: true,
          'strip-excludes' : false
        },
        files: {
          'dist/bin-packing-grid.html' : 'dist/bin-packing-grid.html'
        }
      }
    },
    clean : [ 'dist/bin-packing-grid.js' ],
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

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-vulcanize');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('build',  ['replace', 'uglify', 'vulcanize', 'clean']);
  grunt.registerTask('deploy', ['gh-pages']);
  grunt.registerTask('server', ['connect']);

};
