// Imports: local files.
const asyncHandler = require('./asyncHandler');
const { User } = require('../models');
const { ApiError } = require('../utils/classes');
const { jwt } = require('../utils/functions');
const { httpCodes } = require('../config');

// Middleware that is used to authorize users in our API.
const authorize = asyncHandler(async (request, response, next) => {
  const { authorization } = request.headers;
  if (!authorization) {
    next(new ApiError('Missing auth header', httpCodes.UNAUTHORIZED));
    return;
  }

  const [bearer, token] = authorization.split(' ');
  if (!bearer || bearer !== 'Bearer' || !token) {
    next(new ApiError('Wrong auth header', httpCodes.UNAUTHORIZED));
    return;
  }

  const decodedResult = await jwt.decode(token);
  if (!decodedResult.success) {
    next(new ApiError(decodedResult.error, httpCodes.UNAUTHORIZED));
    return;
  }

  const { decoded } = decodedResult.data;

  const user = await User.findOne({ _id: decoded.id, isDeleted: false }).populate('role');
  if (!user) {
    next(new ApiError('Unauthorized', httpCodes.UNAUTHORIZED));
    return;
  }

  if (!user.accountConfirmed) {
    next(new ApiError('Account not confirmed!', httpCodes.UNAUTHORIZED));
    return;
  }

  const iat = new Date(0);
  iat.setUTCMilliseconds(decoded.iat * 1000);

  const passwordChanged = User.passwordChangedAfter(user.passwordChangedAt, iat);
  if (passwordChanged) {
    next(new ApiError('Unauthorized', httpCodes.UNAUTHORIZED));
    return;
  }

  request.user = user;
  next();
});

// Exports of this file.
module.exports = authorize;
