// Imports: third-party packages.
const express = require('express');
const router = express.Router();

// Imports: local files.
const { getAll, getOne, create, updateOne, deleteOne } = require('../controllers/techniques');
const {
  getAllTechniques,
  createTechnique,
  updateTechnique,
  validateTechniqueId,
} = require('../validations/techniques');
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
    middlewares: [validate(getAllTechniques), getAll],
  },
  {
    path: '/:techniqueId',
    method: httpVerbs.GET,
    middlewares: [validate(validateTechniqueId), getOne],
  },
  {
    path: '/',
    method: httpVerbs.POST,
    middlewares: [authorize, protect(ADMIN), validate(createTechnique), create],
  },
  {
    path: '/:techniqueId',
    method: httpVerbs.PUT,
    middlewares: [authorize, protect(ADMIN), validate(updateTechnique), updateOne],
  },
  {
    path: '/:techniqueId',
    method: httpVerbs.DELETE,
    middlewares: [authorize, protect(ADMIN), validate(validateTechniqueId), deleteOne],
  },
];

// Mount routes accordingly.
for (const route of routes) {
  router.route(route.path)[route.method](route.middlewares);
}

// Exports of this file.
module.exports = router;
