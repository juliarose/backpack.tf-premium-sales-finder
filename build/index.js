'use strict';

// run this from the main directory

const fs = require('fs');

const config = require('./build.config.json');
const builder = require('./builder');
const {script, meta} = builder(config);

fs.writeFileSync(config.output, script, 'utf8');
fs.writeFileSync(config.output_meta, meta, 'utf8');