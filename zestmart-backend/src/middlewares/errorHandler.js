const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Converts known third-party errors (Mongoose, JWT, Multer) into ApiError
 * so the response shape stays consistent no matter where the error came from.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.validation('Validation failed', details);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`, 'DUPLICATE_KEY');
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for ${err.path}`, 'INVALID_ID');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid authentication token', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Authentication token expired', 'TOKEN_EXPIRED');
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    return ApiError.badRequest(err.message, 'UPLOAD_ERROR');
  }

  // Fallback: unknown/unexpected error
  return ApiError.internal(
    env.isProduction ? 'Internal server error' : err.message || 'Internal server error'
  );
};

/**
 * Express requires exactly 4 arguments for an error-handling middleware
 * to be recognized as such — do not remove `next` even though it's unused.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500 || !normalized.isOperational) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${normalized.message}`);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    error: {
      code: normalized.code,
      details: normalized.details || [],
      ...(env.isProduction ? {} : { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
