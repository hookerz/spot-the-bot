const vue = require('rollup-plugin-vue');
const string = require('rollup-plugin-string');
const replace = require('rollup-plugin-replace');
const commonjs = require('rollup-plugin-commonjs');
const noderesolve = require('rollup-plugin-node-resolve');

module.exports = {

  context: 'window',
  format: 'iife',
  entry: 'src/index.js',
  dest: 'out/index.js',

  sourceMap: 'inline',
  useStrict: true,
  exports: 'none',
  indent: false,

  external: [
    'firebase',
    'is_js',
    'three',
    'vue',
  ],

  globals: {
    'firebase': 'firebase',
    'is_js': 'is',
    'three': 'THREE',
    'vue': 'Vue',
  },

  plugins: [

    replace({ 'process.env.NODE_ENV': '"development"' }), // https://vuejs.org/v2/guide/deployment.html

    vue({ include: 'src/**/*.vue', compileTemplate: true }), // import vue templates as render functions

    string({ include: 'src/**/*.glsl' }), // import glsl files as strings

    commonjs(), // best-effort translation from CJS module format to ES6 module format

    noderesolve({ jsnext: true, browser: true }), // resolve module paths using the node_modules folder

  ]

};
