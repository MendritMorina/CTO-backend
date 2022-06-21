// Imports: third-party packages.
const express = require('express');
const router = express.Router();

// Imports: local files.
const { getAll, getOne, create, updateOne, deleteOne } = require('../controllers/manufacturers');
const {
  getAllManufacturers,
  createManufacturer,
  updateManufacturer,
  validateManufacturerId,
} = require('../validations/manufacturers');
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
    middlewares: [validate(getAllManufacturers), getAll],
  },
  {
    path: '/:manufacturerId',
    method: httpVerbs.GET,
    middlewares: [validate(validateManufacturerId), getOne],
  },
  {
    path: '/',
    method: httpVerbs.POST,
    middlewares: [authorize, protect(ADMIN), validate(createManufacturer), create],
  },
  {
    path: '/:manufacturerId',
    method: httpVerbs.PUT,
    middlewares: [authorize, protect(ADMIN), validate(updateManufacturer), updateOne],
  },
  {
    path: '/:manufacturerId',
    method: httpVerbs.DELETE,
    middlewares: [authorize, protect(ADMIN), validate(validateManufacturerId), deleteOne],
  },
];

// Mount routes accordingly.
for (const route of routes) {
  router.route(route.path)[route.method](route.middlewares);
}

// Exports of this file.
module.exports = router;
