#!/usr/bin/env node

// This file is intentionally left as ES5.

if (!global._babelPolyfill) {
  require('babel-register')
  require('babel-polyfill')
}

var process = require('process')

var main = require('./index').default

if (process.argv.length < 3 || !process.argv[2]) {
  throw new Error('Provide a directory path')
}
var sourceDirPath = process.argv[2]
main(sourceDirPath)
