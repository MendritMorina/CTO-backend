// Imports: core node modules.
const path = require('path');

// Imports: third-party packages.
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();

// Imports: local files.
const authRoutes = require('./routes/authentication');
const manufacturerRoutes = require('./routes/manufacturers');
const toolRoutes = require('./routes/tools');
const techniqueRoutes = require('./routes/techniques');
const productRoutes = require('./routes/products');
const { errorHandler } = require('./middlewares');

// Use general middleware.
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(fileUpload());

// Mount routes accordingly.
app.use('/api/authentication', authRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/techniques', techniqueRoutes);
app.use('/api/products', productRoutes);

// Use error handling middleware.
app.use(errorHandler);

// Exports of this file.
module.exports = app;
