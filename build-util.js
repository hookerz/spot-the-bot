const fs = require('fs');

/**
 * Watch the src directory for changes and schedule builds when they happen.
 */
exports.watch = function (dir, opts, cb) {

  let timeout = null;

  if (cb === undefined) {

    cb = opts;
    opts = {};

  }

  fs.watch(dir, {

    persistent: true,
    recursive: true,
    encoding: 'utf8'

  }, (event, filename) => {

    const match = (opts.include === undefined) || opts.include.test(filename);

    if (match) {

      clearTimeout(timeout);
      timeout = setTimeout(cb, 100); // debounce by 100ms

    }

  });

};

exports.args = require('yargs').argv;
