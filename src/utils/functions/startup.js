// Imports: core node modules.
const fs = require('fs');
const path = require('path');

// Imports: local files.
const { User, Role } = require('../../models');
const { roles } = require('../../config');

// Function that is used to init default Roles in our API.
const initRoles = async () => {
  for (const roleNumber of roles.ARR) {
    const roleExists = (await Role.countDocuments({ number: roleNumber, isDeleted: false })) > 0;
    if (roleExists) continue;

    Role.create({ name: roles[roleNumber], description: roles[roleNumber], number: roles[roles[roleNumber]] });
  }
};

// Function that is used to initalize admins located in a json file inside ./src/utils/data/admins.json.
const initAdmins = async () => {
  const pathToAdmins = path.join(__dirname, '../data/admins.json');
  const admins = JSON.parse(fs.readFileSync(pathToAdmins, { encoding: 'utf-8' }));

  const role = await Role.findOne({ number: roles.ADMIN, isDeleted: false });
  if (!role) return;

  for (const admin of admins) {
    const adminExists =
      (await User.countDocuments({
        email: admin.email,
        role: role._id,
        isDeleted: false,
      })) > 0;
    if (adminExists) continue;

    await User.create({ ...admin, role: role._id });
  }
};

// Function that is used to create public folder and folders inside it if missing.
const initPublicFolders = async () => {
  const pathToPublicFolder = path.join(__dirname, '../../../public');
  const publicFolderExists = fs.existsSync(pathToPublicFolder);

  if (!publicFolderExists) fs.mkdirSync(pathToPublicFolder);

  const folders = ['manufacturers', 'tools', 'techniques', 'products'];
  folders.forEach((folder) => {
    const pathToFolder = path.join(__dirname, `../../../public/${folder}`);
    const folderExists = fs.existsSync(pathToFolder);

    if (!folderExists) fs.mkdirSync(pathToFolder);
  });
};

// Exports of this file.
module.exports = { initRoles, initPublicFolders, initAdmins };
