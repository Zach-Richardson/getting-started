const fs = require('fs');
const path = require('path');

function assert_exists(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
    }
    return file;
}

function add_prefix(left, right) {
    return assert_exists(path.join(left, right));
}


module.exports = function(grunt) {
  'use strict';

  const dist = 'dist';
  const static_dist = `${dist}/static`;

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  try {
    grunt.loadNpmTasks('grunt-contrib-watch');
  } catch(e) {
    console.warn("Grunt 'watch' is not available");
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    env : {
      options : {
      },
      dev : {
        NODE_ENV : 'development',
      },
      prod : {
        NODE_ENV : 'production',
      },
    },

    browserify: {
      dist: {
        files: {
          'dist/static/js/main.js': ['client/scripts/main.js']
        }
      }
    },

    uglify: {
      my_target: {
        files: {
          'dist/static/js/main.js': ['dist/static/js/main.js'],
          'dist/static/js/deps.js': ['dist/static/js/deps.js']
        }
      }
    },

    concat: {
      client_deps: {
        src: [
          "jquery/dist/jquery.slim.js",
          "lodash/core.js",
        ].map(x => add_prefix('node_modules', x)),
        dest: `${static_dist}/js/deps.js`
      },
    },

    copy: {
      static: {
        nonull: true,
        files: [{
          expand: true,
          src: [
            'client/html/**',
            'client/images/**',
            'client/stylesheets/**',
          ],
          dest: static_dist
        }]
      }
    },

    watch: {
      stylesheets: {
        files: [
          'client/stylesheets/*.css',
        ],
        tasks: ['copy']
      },
      scripts: {
        files: [
          'client/scripts/**',
          'Gruntfile.js'
        ],
        tasks: ['development', 'copy']
      },
      html: {
        files: [
          'client/images/**',
          'client/html/**'
        ],
        tasks: ['copy']
      }
    }
  });

  grunt.registerTask('default', ['env:prod', 'browserify', 'concat', 'copy', 'uglify']);
  grunt.registerTask('development', ['env:dev', 'browserify', 'concat', 'copy']);
};
