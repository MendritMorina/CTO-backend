// Imports: third-party packages.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Imports: local files.
const Base = require('./Base');

// Tool Schema that is used to represent single Tool in our API.
const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
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
  informationLinks: {
    type: [Object],
    required: false,
    defualt: [],
  },
  ...Base,
});

// Plugins.
ToolSchema.plugin(mongoosePaginate);
ToolSchema.plugin(mongooseAggregatePaginate);

// Exports of this file.
module.exports = mongoose.model('Tool', ToolSchema);
