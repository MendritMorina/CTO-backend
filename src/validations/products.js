// Imports: third-party packages.
const { Joi } = require('express-validation');

// Validator object that holds validation related to the controller in ./src/controllers/products.
const validator = {
  getAllProducts: {
    query: Joi.object({
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
      pagination: Joi.boolean().optional().default(true),
      name: Joi.string().optional().default(null),
      active: Joi.number().optional().default(null).allow(null, 0, 1),
      deleted: Joi.number().optional().default(null).allow(null, 0, 1),
      type: Joi.array()
        .optional()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
        )
        .default(null),
      manufacturer: Joi.array()
        .optional()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
        )
        .default(null),
    }),
  },
  createProduct: {
    body: Joi.object({
      name: Joi.string().required(),
      shortDescription: Joi.string().required(),
      longDescription: Joi.string().optional().default(null),
      details: Joi.string().optional().default(''),
      informationLinks: Joi.string().optional().default(''),
      manufacturer: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      type: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      photo: Joi.any().optional(),
      video: Joi.any().optional(),
    }),
  },
  updateProduct: {
    params: Joi.object({
      productId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    body: Joi.object({
      name: Joi.string().required(),
      shortDescription: Joi.string().required(),
      longDescription: Joi.string().optional().default(null),
      details: Joi.string().required(),
      informationLinks: Joi.string().required(),
      manufacturer: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      type: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      photo: Joi.any().optional(),
      video: Joi.any().optional(),
      toBeDeleted: Joi.string().optional(),
    }),
  },
  validateProductId: {
    params: Joi.object({
      productId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
  },
};

// Exports of this file.
module.exports = validator;
