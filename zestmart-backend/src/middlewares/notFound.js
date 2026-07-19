const ApiError = require('../utils/ApiError');

/**
 * Catches any request that didn't match a defined route and
 * forwards a 404 ApiError to the global error handler.
 * Must be registered AFTER all routes and BEFORE errorHandler.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

module.exports = notFound;
