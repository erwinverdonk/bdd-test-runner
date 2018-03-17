#!/usr/bin/env node
const minimist = require('minimist');
const main = require('../lib/main');

main.start(minimist(process.argv.slice(2)));
