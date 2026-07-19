const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');

const dns = require('dns');
dns.setServers(["1.1.1.1", "8.8.8.8"]);

let server;

/**
 * Boot sequence: connect to MongoDB first, only then start accepting
 * HTTP traffic. This avoids serving requests that would immediately
 * fail because the DB isn't ready yet.
 */
const startServer = async () => {
  await connectDB();

  server = app.listen(env.port, () => {
    logger.info(
      `ZestMart API running in ${env.nodeEnv} mode on ${env.serverUrl} (port ${env.port})`
    );
  });
};

startServer();

/**
 * Graceful shutdown: stop accepting new connections, let in-flight
 * requests finish, then close the DB connection before exiting.
 * Render (and most hosts) send SIGTERM before killing a container.
 */
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force-exit if shutdown hangs for more than 10s.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Catch anything that slips through asyncHandler / express-async-errors.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  gracefulShutdown('uncaughtException');
});
