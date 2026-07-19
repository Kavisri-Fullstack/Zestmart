const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Exits the process on failure since the API cannot function without a DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      // Mongoose 8 no longer needs useNewUrlParser / useUnifiedTopology,
      // but maxPoolSize is worth tuning for production load.
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect is handled by the driver.');
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully closes the MongoDB connection.
 * Used during server shutdown (SIGINT/SIGTERM).
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed gracefully.');
};

module.exports = { connectDB, disconnectDB };
