// Imports: third-party packages.
const { Joi } = require('express-validation');

// Imports: local files.
const { roles } = require('../config');

// Validator object that holds validation related to the controller in ./src/controllers/authentication.
const validator = {
  signupUser: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required().min(7),
      passwordConfirm: Joi.string().required().min(7),
      role: Joi.number()
        .optional()
        .default(roles.ADMIN)
        .allow(...roles.ARR),
    }),
  },
  loginUser: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required().min(7),
      remember: Joi.boolean().optional().default(false),
    }),
  },
  forgotPass: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },
  resetPass: {
    params: Joi.object({
      resetToken: Joi.string().required(),
    }),
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required().min(7),
      passwordConfirm: Joi.string().required().min(7),
    }),
  },
  confirmAcc: {
    body: Joi.object({
      email: Joi.string().email().required(),
      code: Joi.number().required(),
      token: Joi.string().required(),
    }),
  },
  resendCode: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },
};

// Exports of this file.
module.exports = validator;
