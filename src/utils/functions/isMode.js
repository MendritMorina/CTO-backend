// Function that is used to check if process.env.NODE_ENV is of certain value.
const isMode = (mode) => {
  if (!['development', 'staging', 'production'].includes(mode)) return false;

  return process.env.NODE_ENV === mode;
};

// Exports of this file.
module.exports = isMode;
