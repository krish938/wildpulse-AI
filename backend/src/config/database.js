/**
 * config/database.js
 * MongoDB connection using Mongoose.
 * Called once at server startup.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set in environment variables. ' +
      'Please copy .env.example to .env and fill in your MongoDB Atlas connection string.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      // These options suppress Mongoose deprecation warnings
      serverSelectionTimeoutMS: 5000, // timeout after 5s
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// Gracefully close connection on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (SIGINT).');
  process.exit(0);
});

module.exports = connectDB;
