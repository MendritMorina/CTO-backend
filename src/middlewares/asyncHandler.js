// Middleware that is used to avoid excessive try/catch blocks in our express handlers.
const asyncHandler = (fn) => {
  return (request, response, next) => {
    fn(request, response, next).catch(next);
  };
};

// Exports of this file.
module.exports = asyncHandler;
