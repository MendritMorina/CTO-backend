// Imports: third-party packages.
const express = require('express');
const router = express.Router();

// Imports: local files.
const { getAll, getOne, create, updateOne, deleteOne } = require('../controllers/tools');
const { getAllTools, createTool, updateTool, validateToolId } = require('../validations/tools');
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
    middlewares: [validate(getAllTools), getAll],
  },
  {
    path: '/:toolId',
    method: httpVerbs.GET,
    middlewares: [validate(validateToolId), getOne],
  },
  {
    path: '/',
    method: httpVerbs.POST,
    middlewares: [authorize, protect(ADMIN), validate(createTool), create],
  },
  {
    path: '/:toolId',
    method: httpVerbs.PUT,
    middlewares: [authorize, protect(ADMIN), validate(updateTool), updateOne],
  },
  {
    path: '/:toolId',
    method: httpVerbs.DELETE,
    middlewares: [authorize, protect(ADMIN), validate(validateToolId), deleteOne],
  },
];

// Mount routes accordingly.
for (const route of routes) {
  router.route(route.path)[route.method](route.middlewares);
}

// Exports of this file.
module.exports = router;
