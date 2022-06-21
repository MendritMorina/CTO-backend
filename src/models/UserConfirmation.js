// Imports: third-party packages.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Imports: local files.
const Base = require('./Base');

// User Confirmation Schema that is used to represent single User Confiramtion in our API.
const UserConfirmationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  isUsed: {
    type: Boolean,
    required: false,
    default: false,
  },
  expireDate: {
    type: Date,
    required: true,
  },
  ...Base,
});

// Plugins.
UserConfirmationSchema.plugin(mongoosePaginate);
UserConfirmationSchema.plugin(mongooseAggregatePaginate);

// Exports of this file.
module.exports = mongoose.model('UserConfirmation', UserConfirmationSchema);
