// Imports: local files.
const User = require('./User');
const PasswordReset = require('./PasswordReset');
const UserConfirmation = require('./UserConfirmation');
const Role = require('./Role');
const Manufacturer = require('./Manufacturer');
const Tool = require('./Tool');
const Technique = require('./Technique');
const Product = require('./Product');

// Bundler object that is used to export all models inside ./src/models.
const bundler = { User, PasswordReset, UserConfirmation, Role, Manufacturer, Tool, Technique, Product };

// Exports of this file.
module.exports = bundler;
