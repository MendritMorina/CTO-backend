// Imports: local files.
const db = require('./db');
const isMode = require('./isMode');
const validate = require('./validate');
const jwt = require('./jwt');
const startup = require('./startup');
const mail = require('./mail');

// Bundler object that is used to export all functions inside ./src/utils/functions.
const bundler = { db, isMode, validate, jwt, startup, mail };

// Exports of this file.
module.exports = bundler;
