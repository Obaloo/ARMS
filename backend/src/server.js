require('dotenv').config();
const app = require('./app');
const { connectDb } = require('./config/db');

const port = process.env.PORT || 5000;

const start = async () => {
  await connectDb();
  app.listen(port, () => {
    console.log(`CoreNova API running on port ${port}`);
  });
};

start();
