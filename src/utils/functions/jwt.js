// Imports: third-party packages.
const jwt = require('jsonwebtoken');

// Function that is used to sign tokens in our API.
const sign = (payload) => {
  return new Promise((resolve, reject) => {
    try {
      const { id, email, role, remember } = payload;

      const SECRET = process.env.JWT_SECRET;
      const EXPIRE = process.env.JWT_EXPIRE;

      jwt.sign({ id, email, role }, SECRET, { expiresIn: remember ? '30d' : EXPIRE }, (error, encoded) => {
        if (error) {
          resolve({ success: false, data: null, error: error.message || 'Internal Server Error!' });
        } else {
          resolve({ success: true, data: { encoded }, error: null });
        }
      });
    } catch (error) {
      resolve({ success: false, data: null, error: error.message || 'Internal Server Error!' });
    }
  });
};

// Function that is used to decode tokens in our API.
const decode = (token) => {
  return new Promise((resolve, reject) => {
    try {
      const SECRET = process.env.JWT_SECRET;

      jwt.verify(token, SECRET, (error, decoded) => {
        if (error) {
          resolve({ success: false, data: null, error: error.message || 'Internal Server Error!' });
        } else {
          resolve({ success: true, data: { decoded }, error: null });
        }
      });
    } catch (error) {
      resolve({ success: false, data: null, error: error.message || 'Internal Server Error!' });
    }
  });
};

// Exports of this file.
module.exports = { sign, decode };
