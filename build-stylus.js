// Hack: npm run has poor cross-platform env var support.
if (process.env.DEBUG === undefined) process.env.DEBUG = 'build:*';

const fs = require('fs');
const debug = require('debug')('build:stylus');
const stylus = require('stylus');
const { watch, args } = require('./build-util');

let building = false;

function build() {

  if (building) return; // block builds until they finish

  debug('bundling');

  building = true;

  fs.readFile('src/index.styl', 'utf8', renderBundle);

}

function renderBundle(err, data) {

  if (err) return error(err);

  stylus.render(data, {
    paths: [ 'src' ],
    compress: (args.prod === true),
  }, writeBundle)

}

function writeBundle(err, data) {

  if (err) return error(err);

  fs.writeFile(__dirname + '/out/index.css', data, done);

}

function done(err) {

  if (err) return error(err);

  debug(`bundled`);
  building = false;

}

function error(err) {

  debug('error while bundling:\n' + (err.stack || err.message));
  building = false;

}

if (args.watch) {

  watch('src', { include: /styl$/gi }, build);

}

build();
