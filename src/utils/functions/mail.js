// Imports: third-party packages.
const nodemailer = require('nodemailer');

// Imports: local files.
const isMode = require('./isMode');

// Function that is used to send mail around the API.
const mail = (options) => {
  return new Promise(async (resolve, reject) => {
    try {
      let host = null;
      let port = null;
      let user = null;
      let pass = null;

      if (isMode('production')) {
        host = process.env.MAIL_PROD_HOST;
        port = process.env.MAIL_PROD_PORT;
        user = process.env.MAIL_PROD_USER;
        pass = process.env.MAIL_PROD_PASS;
      } else {
        host = process.env.MAIL_DEV_HOST;
        port = process.env.MAIL_DEV_PORT;
        user = process.env.MAIL_DEV_USER;
        pass = process.env.MAIL_DEV_PASS;
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail(options);
      resolve({ success: true, data: null, error: null });
    } catch (error) {
      resolve({ success: false, data: null, error: error.message || 'Internal Server Error!' });
    }
  });
};

// Exports of this file.
module.exports = mail;
