// Imports: local files.
const { ApiError } = require('../utils/classes');
const { httpCodes } = require('../config');

// Middleware that is used to protect routes from certain roles in our API.
const protect = (...roles) => {
  return (request, response, next) => {
    const role = request.user ? request.user.role : {};

    if (!roles.includes(role.number)) {
      next(new ApiError('Forbidden', httpCodes.FORBIDDEN));
      return;
    }

    next();
  };
};

// Exports of this file.
module.exports = protect;
