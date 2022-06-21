// Imports: third-party packages.
const express = require('express');
const router = express.Router();

// Imports: local files.
const { signup, login, forgot, reset, confirm, resend } = require('../controllers/authentication');
const {
  signupUser,
  loginUser,
  forgotPass,
  resetPass,
  confirmAcc,
  resendCode,
} = require('../validations/authentication');
const { validate } = require('../utils/functions');
const { httpVerbs } = require('../config');

// Define routes here.
const routes = [
  {
    path: '/signup',
    method: httpVerbs.POST,
    middlewares: [validate(signupUser), signup],
  },
  {
    path: '/login',
    method: httpVerbs.POST,
    middlewares: [validate(loginUser), login],
  },
  {
    path: '/forgot',
    method: httpVerbs.POST,
    middlewares: [validate(forgotPass), forgot],
  },
  {
    path: '/reset/:resetToken',
    method: httpVerbs.POST,
    middlewares: [validate(resetPass), reset],
  },
  {
    path: '/confirm',
    method: httpVerbs.POST,
    middlewares: [validate(confirmAcc), confirm],
  },
  {
    path: '/resend',
    method: httpVerbs.POST,
    middlewares: [validate(resendCode), resend],
  },
];

// Mount routes accordingly.
for (const route of routes) {
  router.route(route.path)[route.method](route.middlewares);
}

// Exports of this file.
module.exports = router;
