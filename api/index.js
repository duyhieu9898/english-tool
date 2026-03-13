const express = require('express');
const serverApp = require('../backend/server.js');

const app = express();
app.use('/api', serverApp);

module.exports = app;
