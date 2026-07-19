const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Protects a route by requiring a valid JWT access token in the
 * "Authorization: Bearer <token>" header. On success, attaches the
 * full (fresh) user document to req.user so downstream handlers
 * always see up-to-date role/status, not a stale token payload.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('You must be logged in to access this resource', 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists', 'USER_NOT_FOUND');
  }

  if (user.status === 'blocked') {
    throw ApiError.forbidden('Your account has been blocked. Contact support.', 'ACCOUNT_BLOCKED');
  }

  req.user = user;
  next();
});

/**
 * Like `protect`, but never blocks the request — used on routes that
 * are public but should personalize/track activity when the caller
 * happens to be logged in (e.g. product detail pages recording
 * "recently viewed" for a logged-in shopper). If the token is
 * missing/invalid/expired, req.user is simply left undefined and the
 * request continues as an anonymous view rather than erroring out.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(authHeader.split(' ')[1]);
    const user = await User.findById(decoded.sub);
    if (user && user.status !== 'blocked') {
      req.user = user;
    }
  } catch (err) {
    // Invalid/expired token on an optional-auth route is not an error —
    // just proceed as an anonymous request.
  }

  next();
});

/**
 * Restricts a route to specific roles. Must be used AFTER `protect`,
 * since it relies on req.user being set.
 *
 * Usage: router.get('/admin/stats', protect, restrictTo('admin'), handler);
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('You must be logged in to access this resource', 'NO_TOKEN'));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden('You do not have permission to perform this action', 'FORBIDDEN_ROLE')
    );
  }
  return next();
};

module.exports = { protect, optionalAuth, restrictTo };
