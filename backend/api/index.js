require('dotenv').config();
const app = require('../src/app');
const { connectDb } = require('../src/config/db');

// Initialize database connection
connectDb().catch(console.error);

module.exports = app;
