const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signResetToken,
  verifyResetToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  parseDurationToMs,
} = require('../utils/jwt');
const env = require('../config/env');
const { verifyGoogleToken } = require('../services/googleAuth.service');
const { createAndSendOtp, verifyOtp: verifyOtpCode } = require('../services/otp.service');
const { createSession, revokeSessionByToken } = require('../services/session.service');
const logger = require('../utils/logger');

/**
 * Issues a fresh access + refresh token pair for a given user, sets the
 * refresh token as an httpOnly cookie, records a Session document for
 * this device/browser (see session.service.js — powers "manage my
 * devices" and lets a user or admin revoke one specific login), and
 * returns the access token to be sent back in the response body.
 */
const issueTokens = async (req, res, user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshTokenCookie(res, refreshToken);

  await createSession({
    userId: user._id,
    refreshToken,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    expiresInMs: parseDurationToMs(env.jwt.refreshExpiresIn),
  });

  return accessToken;
};

/**
 * POST /api/v1/auth/register
 * Creates a new user account and immediately logs them in
 * (matches spec: 201 on success, 400 on validation, 409 on duplicate email).
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const user = await User.create({ name, email, password, phone });

  const accessToken = await issueTokens(req, res, user);

  // Best-effort: send a verification code so the user can confirm their
  // email later via POST /auth/verify-otp. Never blocks or fails
  // registration itself — a mail hiccup shouldn't stop someone from
  // creating an account.
  createAndSendOtp({ userId: user._id, email: user.email, purpose: 'signup_verification' }).catch((err) =>
    logger.error(`Failed to send signup verification OTP to ${user.email}: ${err.message}`)
  );

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: user.toSafeObject(), accessToken },
        'Account created successfully'
      )
    );
});

/**
 * POST /api/v1/auth/login
 * Verifies credentials and issues a new token pair
 * (matches spec: 200 on success, 401 on bad credentials, 404 if no such user).
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.notFound('No account found with this email', 'USER_NOT_FOUND');
  }

  if (user.status === 'blocked') {
    throw ApiError.forbidden('Your account has been blocked. Contact support.', 'ACCOUNT_BLOCKED');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(req, res, user);

  res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, 'Login successful'));
});

/**
 * POST /api/v1/auth/refresh-token
 * Reads the refresh token from the httpOnly cookie and, if valid,
 * issues a brand new access + refresh token pair (token rotation).
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.jwt.cookieName];

  if (!token) {
    throw ApiError.unauthorized('No refresh token provided', 'NO_REFRESH_TOKEN');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshTokenCookie(res);
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired, please log in again', 'REFRESH_TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    clearRefreshTokenCookie(res);
    throw ApiError.unauthorized('User belonging to this token no longer exists', 'USER_NOT_FOUND');
  }

  if (user.status === 'blocked') {
    clearRefreshTokenCookie(res);
    throw ApiError.forbidden('Your account has been blocked. Contact support.', 'ACCOUNT_BLOCKED');
  }

  // Token rotation: the old refresh token's session is retired the
  // moment a new one is issued, so a stolen-but-not-yet-used old token
  // can't be replayed to mint further access tokens after this point.
  await revokeSessionByToken(token);

  const accessToken = await issueTokens(req, res, user);

  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, 'Access token refreshed successfully'));
});

/**
 * POST /api/v1/auth/logout
 * Clears the refresh token cookie and revokes its Session record, so
 * this specific device is removed from the user's "active sessions"
 * list immediately (not just left to expire naturally).
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.jwt.cookieName];
  if (token) {
    await revokeSessionByToken(token);
  }
  clearRefreshTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 * Requires the `protect` middleware to have run first.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }, 'Current user fetched'));
});

/**
 * POST /api/v1/auth/google
 * Verifies a Google ID token (see googleAuth.service.js for the
 * cryptographic details) and either logs in an existing account or
 * creates a new one. Google-created accounts have no password and are
 * marked email-verified immediately, since Google already verified it.
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  const profile = await verifyGoogleToken(idToken);

  let user = await User.findOne({ $or: [{ googleId: profile.googleId }, { email: profile.email }] });

  if (user) {
    // Existing email/password account signing in with Google for the
    // first time — link the accounts rather than creating a duplicate.
    if (!user.googleId) {
      user.googleId = profile.googleId;
      if (!user.avatar) user.avatar = profile.avatar;
      if (profile.emailVerified) user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }
  } else {
    user = await User.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      avatar: profile.avatar,
      isEmailVerified: profile.emailVerified,
    });
  }

  if (user.status === 'blocked') {
    throw ApiError.forbidden('Your account has been blocked. Contact support.', 'ACCOUNT_BLOCKED');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(req, res, user);

  res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, 'Google sign-in successful'));
});

/**
 * POST /api/v1/auth/forgot-password
 * Sends a password-reset OTP to the given email. Always returns the
 * same success message whether or not an account exists for that
 * email — this prevents attackers from using this endpoint to discover
 * which email addresses have accounts (user enumeration).
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    await createAndSendOtp({ userId: user._id, email, purpose: 'password_reset' });
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        'If an account exists for this email, a verification code has been sent.'
      )
    );
});

/**
 * POST /api/v1/auth/verify-otp
 * Verifies a 6-digit code for either signup email verification or
 * password reset. For signup_verification, marks the user's email
 * verified immediately. For password_reset, returns a short-lived
 * resetToken the frontend must pass to POST /auth/reset-password next
 * — this proves the OTP step happened without letting the same code
 * be replayed indefinitely to reset the password multiple times.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code, purpose } = req.body;

  await verifyOtpCode({ email, code, purpose });

  if (purpose === 'signup_verification') {
    await User.findOneAndUpdate({ email }, { isEmailVerified: true });
    return res.status(200).json(new ApiResponse(200, { verified: true }, 'Email verified successfully'));
  }

  // purpose === 'password_reset'
  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.notFound('No account found with this email', 'USER_NOT_FOUND');
  }

  const resetToken = signResetToken(user._id.toString());

  res
    .status(200)
    .json(new ApiResponse(200, { verified: true, resetToken }, 'Code verified successfully'));
});

/**
 * POST /api/v1/auth/reset-password
 * Sets a new password, given a valid resetToken from verify-otp above.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired reset token. Please verify your code again.', 'INVALID_RESET_TOKEN');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  user.password = newPassword; // pre-save hook hashes it
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully. Please log in.'));
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  googleAuth,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
