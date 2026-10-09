const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is required but not found in environment variables');
    throw new Error('MONGO_URI is required');
  }

  console.log('Attempting to connect to MongoDB...');

  const maxRetries = Math.max(Number(process.env.MONGO_CONNECT_RETRIES) || 5, 1);
  const baseDelayMs = Math.max(Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS) || 1500, 250);

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, {
        family: 4,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        },
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (error) {
      lastError = error;
      const dnsError = error?.code === 'EAI_AGAIN' || error?.cause?.code === 'EAI_AGAIN';
      const delayMs = baseDelayMs * attempt;

      console.error(
        `MongoDB connection attempt ${attempt}/${maxRetries} failed${dnsError ? ' (DNS lookup temporary failure)' : ''}:`,
        error?.message || error
      );

      if (attempt < maxRetries) {
        console.log(`Retrying MongoDB connection in ${delayMs}ms...`);
        await wait(delayMs);
      }
    }
  }

  console.error('Failed to connect to MongoDB after all retries');
  throw lastError;
};

module.exports = { connectDb };
