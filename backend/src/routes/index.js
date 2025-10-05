const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// This will automatically register all route files in this directory.
// It assumes the file name matches the base path (e.g., 'auth.routes.js' -> '/auth').
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .forEach(file => {
    const route = require(path.join(__dirname, file));
    const routeName = file.split('.')[0];
    router.use(`/${routeName}`, route);
  });

module.exports = router;