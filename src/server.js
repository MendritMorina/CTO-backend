// Imports: third-party packages.
const dotenv = require('dotenv');

// Imports: local files.
const app = require('./app');
const { db, startup } = require('./utils/functions');

// Load .env variables.
dotenv.config({});

// Connect to DB & spin the server up.
(async () => {
  try {
    const dbResult = await db.connect();
    if (!dbResult.success) process.exit(1);

    // Run startup code. (ORDER MATTERS)
    startup.initPublicFolders();
    await startup.initRoles();
    await startup.initAdmins();

    const port = process.env.NODE_PORT;
    const env = process.env.NODE_ENV;

    app.listen(port, () => console.log(`Server running on PORT ${port}, on ${env} MODE!`));
  } catch (error) {
    console.log(`Failed to start server: ${error.message}!`);
    process.exit(1);
  }
})();
