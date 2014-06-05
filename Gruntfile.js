module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      rsyncDist: {
        src: "./rsync.js",
        dest: "./dist/rsync.js",
      },
      rsyncTest: {
        src: "./tests/index.js",
        dest: "./dist/filer-test.js"
      }
    },

    shell: {
      mocha: {
        command: './node_modules/.bin/mocha --reporter list tests/index.js'
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commit: true,
        commitMessage: 'v%VERSION%',
        commitFiles: ['package.json', 'bower.json', './dist/filer.js', './dist/filer.min.js'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'v%VERSION%',
        push: true,
        pushTo: GIT_FULL_REMOTE
      }
    },

    'npm-checkBranch': {
      options: {
        branch: GIT_BRANCH
      }
    },

    'npm-publish': {
      options: {
        abortIfDirty: false
      }
    },

    prompt: {
      confirm: {
        options: {
          questions: [
            {
              config: PROMPT_CONFIRM_CONFIG,
              type: 'confirm',
              message: 'Bump version from ' + (currentVersion).cyan +
                          ' to ' + semver.inc(currentVersion, "patch").yellow + '?',
              default: false
            }
          ],
          then: function(results) {
            if (!results[PROMPT_CONFIRM_CONFIG]) {
              return grunt.fatal('User aborted...');
            }
          }
        }
      }
    },

    gitcheckout: {
      publish: {
        options: {
          branch: 'gh-pages',
          overwrite: true
        }
      },
      revert: {
        options: {
          branch: GIT_BRANCH
        }
      }
    },

    gitpush: {
      publish: {
        options: {
          remote: GIT_REMOTE,
          branch: 'gh-pages',
          force: true
        },
      }
    },
    connect: {
      serverForNode: {
        options: {
          port: 1234,
          base: '.'
        }
      },
      serverForBrowser: {
        options: {
          port: 1234,
          base: '.',
          keepalive: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-npm');
  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-prompt');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('develop', ['clean', 'browserify:filerDist']);
  grunt.registerTask('build-tests', ['clean', 'browserify:filerTest']);
  grunt.registerTask('release', ['test', 'develop', 'uglify']);

  grunt.registerTask('publish', 'Publish filer as a new version to NPM, bower and github.', function(patchLevel) {
    var allLevels = ['patch', 'minor', 'major'];

    // No level specified defaults to 'patch'
    patchLevel = (patchLevel || 'patch').toLowerCase();

    // Fail out if the patch level isn't recognized
    if (allLevels.filter(function(el) { return el == patchLevel; }).length === 0) {
      return grunt.fatal('Patch level not recognized! "Patch", "minor" or "major" only.');
    }

    // Set prompt message
    var promptOpts = grunt.config('prompt.confirm.options');
    promptOpts.questions[0].message =  'Bump version from ' + (currentVersion).cyan +
      ' to ' + semver.inc(currentVersion, patchLevel).yellow + '?';
    grunt.config('prompt.confirm.options', promptOpts);

    grunt.task.run([
      'prompt:confirm',
      'checkBranch',
      'release',
      'bump:' + patchLevel,
      'gitcheckout:publish',
      'gitpush:publish',
      'gitcheckout:revert',
      'npm-publish'
    ]);
  });
  grunt.registerTask('test-node', ['jshint', 'connect:serverForNode', 'shell:mocha']);
  grunt.registerTask('test-browser', ['jshint', 'build-tests', 'connect:serverForBrowser']);
  grunt.registerTask('test', ['test-node']);

  grunt.registerTask('default', ['test']);
};