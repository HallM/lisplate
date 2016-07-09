module.exports = function(grunt) {
  //--------------------------------------------------
  //------------Project config------------------------
  //--------------------------------------------------
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Released under the <%= pkg.license %> License */\n',

    peg: {
      parser: {
        src: 'lisplate.pegjs',
        dest: 'lib/parser.js',
        options: {
          wrapper: function(src, parser) {
            var buildMsg = '/* Do not edit this file directly. It is automatically generated. Please edit lisplate.pegjs */\n';
            var wrapper = grunt
              .file
              .read("src/umdParserWrapper.js")
              .split('@@parser');

            return buildMsg + wrapper[0] + parser + wrapper[1];
          }
        }
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      core: {
        src: ['lib/util.js', 'lib/runtime.js', 'lib/index.js'],
        dest: 'dist/lisplate-core.js'
      },
      full: {
        src: ['lib/util.js', 'lib/runtime.js', 'lib/index.js', 'lib/parser.js', 'lib/compiler.js'],
        dest: 'dist/lisplate-full.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>',
        mangle: {
          except: ['require', 'define', 'module', 'Lisplate']
        }
      },
      core: {
        src: '<%= concat.core.dest %>',
        dest: 'dist/lisplate-core.min.js'
      },
      full: {
        src: '<%= concat.full.dest %>',
        dest: 'dist/lisplate-full.min.js'
      }
    },

    clean: {
      dist: ['dist/*']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-peg');

  grunt.registerTask('buildParser', ['peg']);
  grunt.registerTask('build', ['clean', 'concat', 'uglify']);
  grunt.registerTask('default', ['build']);
};