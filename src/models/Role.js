// Imports: third-party packages.
const mongoose = require('mongoose');

// Imports: local files.
const Base = require('./Base');

// Role Schema that is used to represent single Role in our API.
const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    default: true,
  },
  number: {
    type: Number,
    required: true,
    unique: true,
  },
  ...Base,
});

// Exports of this file.
module.exports = mongoose.model('Role', RoleSchema);
