const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const isProduction = process.env.NODE_ENV === 'production';

/**
 * App-wide logger.
 * - Console output always (colorized in development).
 * - File output for errors and combined logs, useful once deployed on Render.
 */
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
