// Imports: third-party packages.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Imports: local files.
const Base = require('./Base');

// Technique Schema that is used to represent single Technique in our API.
const TechniqueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  achronym: {
    type: String,
    required: true,
  },
  informationLinks: {
    type: [Object],
    required: false,
    default: [],
  },
  photo: {
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    type: Object,
    required: false,
    default: null,
  },
  ...Base,
});

// Plugins.
TechniqueSchema.plugin(mongoosePaginate);
TechniqueSchema.plugin(mongooseAggregatePaginate);

// Exports of this file.
module.exports = mongoose.model('Technique', TechniqueSchema);
