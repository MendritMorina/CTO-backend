// Imports: third-party packages.
const express = require('express');
const router = express.Router();

// Imports: local files.
const { getAll, getOne, create, updateOne, deleteOne } = require('../controllers/products');
const { getAllProducts, createProduct, updateProduct, validateProductId } = require('../validations/products');
const { validate } = require('../utils/functions');
const { authorize, protect } = require('../middlewares');
const {
  httpVerbs,
  roles: { ADMIN },
} = require('../config');

// Define routes here.
const routes = [
  {
    path: '/',
    method: httpVerbs.GET,
    middlewares: [validate(getAllProducts), getAll],
  },
  {
    path: '/:productId',
    method: httpVerbs.GET,
    middlewares: [validate(validateProductId), getOne],
  },
  {
    path: '/',
    method: httpVerbs.POST,
    middlewares: [authorize, protect(ADMIN), validate(createProduct), create],
  },
  {
    path: '/:productId',
    method: httpVerbs.PUT,
    middlewares: [authorize, protect(ADMIN), validate(updateProduct), updateOne],
  },
  {
    path: '/:productId',
    method: httpVerbs.DELETE,
    middlewares: [authorize, protect(ADMIN), validate(validateProductId), deleteOne],
  },
];

// Mount routes accordingly.
for (const route of routes) {
  router.route(route.path)[route.method](route.middlewares);
}

// Exports of this file.
module.exports = router;
