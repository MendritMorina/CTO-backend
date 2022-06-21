// Imports: third-party packages.
const { ValidationError } = require('express-validation');

// Imports: local files.
const { ApiError } = require('../utils/classes');
const { isMode } = require('../utils/functions');
const { httpCodes } = require('../config');

// Middleware that is used to handle errors in our API.
const errorHandler = (error, request, response, next) => {
  const err = new ApiError();
  err.statusCode = error.statusCode || httpCodes.INTERNAL_ERROR;
  err.message = error.message || 'Internal Server Error!';
  err.stack = error.stack || {};

  switch (true) {
    case error instanceof ValidationError:
      err.statusCode = httpCodes.BAD_REQUEST;
      err.message = Object.keys(error.details[0])
        .map((key) => error.details[0][key])
        .join(',');
      err.stack = error.stack || {};
      break;
    case !(error instanceof ApiError):
      err.statusCode = error.statusCode || httpCodes.INTERNAL_ERROR;
      err.message = error.message || 'Internal Server Error!';
      err.stack = error.stack || {};
      break;
    default:
      break;
  }

  const payload = { success: false, data: null, error: err.message };
  if (isMode('development')) payload['errorStack'] = err.stack;

  return response.status(err.statusCode).json(payload);
};

// Exports of this file.
module.exports = errorHandler;
