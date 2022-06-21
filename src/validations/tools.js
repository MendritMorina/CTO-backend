// Imports: third-party packages.
const { Joi } = require('express-validation');

// Validator object that holds validation related to the controller in ./src/controllers/tools.
const validator = {
  getAllTools: {
    query: Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
      pagination: Joi.boolean().optional().default(true),
      name: Joi.string().optional().default(null),
      active: Joi.number().optional().default(null).allow(null, 0, 1),
      deleted: Joi.number().optional().default(null).allow(null, 0, 1),
    }),
  },
  createTool: {
    body: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      informationLinks: Joi.string().optional().default(''),
      photo: Joi.any().optional(),
    }),
  },
  updateTool: {
    params: Joi.object({
      toolId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    body: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      informationLinks: Joi.string().required(),
      photo: Joi.any().optional(),
    }),
  },
  validateToolId: {
    params: Joi.object({
      toolId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
  },
};

// Exports of this file.
module.exports = validator;
