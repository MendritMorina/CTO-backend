// Imports: third-party packages.
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
const bcrypt = require('bcryptjs');

// Imports: local files.
const Base = require('./Base');

// User Schema that is used to represent single User in our API.
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    required: false,
    default: null,
  },
  accountConfirmed: {
    type: Boolean,
    required: false,
    default: false,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  ...Base,
});

// Plugins.
UserSchema.plugin(mongoosePaginate);
UserSchema.plugin(mongooseAggregatePaginate);

// Statics & instance methods.
UserSchema.statics.passwordChangedAfter = function (passwordChangedAt, tokenIat) {
  if (!passwordChangedAt) return false;

  return new Date(passwordChangedAt) > new Date(tokenIat);
};

UserSchema.statics.comparePasswords = async function (candidatePassword, hashedPassword) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Hooks & middlewares.
UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(this.password, salt);

    this.password = hash;
  }

  next();
});

// Exports of this file.
module.exports = mongoose.model('User', UserSchema);
