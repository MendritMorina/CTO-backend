// Imports: third-party packages.
const { Joi } = require('express-validation');

// Validator object that holds validation related to the controller in ./src/controllers/manufacturers.
const validator = {
  getAllManufacturers: {
    query: Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
      pagination: Joi.boolean().optional().default(true),
      name: Joi.string().optional().default(null),
      active: Joi.number().optional().default(null).allow(null, 0, 1),
      deleted: Joi.number().optional().default(null).allow(null, 0, 1),
      tools: Joi.array()
        .optional()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
        )
        .default(null),
    }),
  },
  createManufacturer: {
    body: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      tools: Joi.string().optional(),
      logo: Joi.any().optional(),
    }),
  },
  updateManufacturer: {
    params: Joi.object({
      manufacturerId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    body: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      tools: Joi.string().required(),
      logo: Joi.any().optional(),
    }),
  },
  validateManufacturerId: {
    params: Joi.object({
      manufacturerId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
  },
};

// Exports of this file.
module.exports = validator;
