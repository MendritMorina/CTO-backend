// Imports: third-party packages.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

// Imports: local files.
const Base = require('./Base');

// Password Reset Schema that is used to represent single Password Reset in our API.
const PasswordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  oldPassword: {
    type: String,
    required: true,
  },
  newPassword: {
    type: String,
    required: false,
    default: null,
  },
  ...Base,
});

// Plugins.
PasswordResetSchema.plugin(mongoosePaginate);
PasswordResetSchema.plugin(mongooseAggregatePaginate);

// Exports of this file.
module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
