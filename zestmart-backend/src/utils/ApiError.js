/**
 * Standard application error class.
 * Controllers/services should `throw new ApiError(...)` instead of
 * returning ad-hoc error responses. The global error handler
 * (src/middlewares/errorHandler.js) knows how to format these.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404).
   * @param {string} message - Human-readable message.
   * @param {string} code - Machine-readable error code (e.g. "VALIDATION_ERROR").
   * @param {Array}  details - Optional array of field-level validation errors.
   */
  constructor(statusCode, message, code = 'ERROR', details = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from bugs

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details = []) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static validation(message = 'Validation failed', details = []) {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static tooMany(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code);
  }
}

module.exports = ApiError;
