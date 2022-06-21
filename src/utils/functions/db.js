// Imports: third-party packages.
const mongoose = require('mongoose');

// Imports: local files.
const { httpCodes } = require('../../config');

// Function that is used to connect to the database.
const connect = () => {
  return new Promise((resolve, reject) => {
    try {
      const host = process.env.MONGO_HOST;
      const port = process.env.MONGO_PORT;
      const name = process.env.MONGO_NAME;

      const uri = `mongodb://${host}:${port}/${name}`;

      mongoose.connect(uri, {}, (error) => {
        if (error) {
          console.log(`Failed to connect to the database: ${error.message}!`);
          resolve({ success: false, data: null, error: error });
        } else {
          console.log(`Successfully connected to the database: ${uri}!`);
          resolve({ success: true, data: null, error: null });
        }
      });
    } catch (error) {
      console.log(`Failed to connect to the database: ${error.message}!`);
      resolve({ success: false, data: null, error: error });
    }
  });
};

// Exports of this file.
module.exports = { connect };
