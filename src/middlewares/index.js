// Imports: local files.
const asyncHandler = require('./asyncHandler');
const errorHandler = require('./errorHandler');
const authorize = require('./authorize');
const protect = require('./protect');

// Bundler object that is used to export all middlewares inside ./src/middlewares.
const bundler = { asyncHandler, errorHandler, authorize, protect };

// Exports of this file.
module.exports = bundler;
