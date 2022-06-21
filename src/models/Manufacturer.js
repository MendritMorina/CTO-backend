// Imports: third-party pacakges.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Imports: local files.
const Base = require('./Base');

// Manufacturer Schema that is used to represent single Manufacturer in our API.
const ManufacturerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logo: {
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
  tools: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
    required: false,
    default: [],
  },
  // techniques: {
  //   type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technique' }],
  //   required: false,
  //   default: [],
  // },
  ...Base,
});

// Plugins.
ManufacturerSchema.plugin(mongoosePaginate);
ManufacturerSchema.plugin(mongooseAggregatePaginate);

// Exports of this file.
module.exports = mongoose.model('Manufacturer', ManufacturerSchema);
