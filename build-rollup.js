// Hack: npm run has poor cross-platform env var support.
if (process.env.DEBUG === undefined) process.env.DEBUG = 'build:*';

const fs = require('fs');
const debug = require('debug')('build:rollup');
const rollup = require('rollup');
const { watch, args } = require('./build-util');

if (args.prod) debug('using prod config');

const config = args.prod
  ? require('./rollup.config-prod')
  : require('./rollup.config-dev');

let cache;
let building = false;

function build() {

  if (building) return; // block builds until they finish

  debug('bundling');

  building = true;

  config.cache = cache;

  return rollup.rollup(config).then(writeBundle).then(done, error);

}

function writeBundle(bundle) {

  cache = bundle;
  return bundle.write(config);

}

function done() {

  debug(`bundled`);
  building = false;

}

function error(err) {

  debug('error while bundling:\n' + (err.message || err.stack));
  cache = undefined;
  building = false;

}

if (args.watch) {

  watch('src', { include: /(glsl|js|vue)$/gi }, build);

}

build();
