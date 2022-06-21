// Imports: third-party packages.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Imports: local files.
const Base = require('./Base');

// Product Schema that is used to represent single Product in our API.
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  longDescription: {
    type: String,
    required: false,
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
  video: {
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
  details: {
    type: [Object],
    required: false,
    default: [],
  },
  informationLinks: {
    type: [Object],
    required: false,
    default: [],
  },
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true,
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true,
  },
  ...Base,
});

// Plugins.
ProductSchema.plugin(mongoosePaginate);
ProductSchema.plugin(mongooseAggregatePaginate);

// Exports of this file.
module.exports = mongoose.model('Product', ProductSchema);
