// Imports: local files.
const httpCodes = require('./httpCodes');
const httpVerbs = require('./httpVerbs');
const roles = require('./roles');

// Bundler object that is used to export all configurations inside ./src/config.
const bundler = { httpCodes, httpVerbs, roles };

// Exports of this file.
module.exports = bundler;
