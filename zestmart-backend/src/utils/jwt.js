const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Access tokens are short-lived (default 15m) and sent to the client
 * to be attached as "Authorization: Bearer <token>" on every request.
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);

/**
 * Refresh tokens are long-lived (default 7d) and stored in an
 * httpOnly cookie only — never exposed to JS on the frontend.
 * Used solely to mint a new access token via POST /auth/refresh-token.
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

/**
 * Password-reset tokens are issued only after a user proves control of
 * their email via OTP (see POST /auth/verify-otp). Deliberately separate
 * from access/refresh tokens: short-lived (10 minutes), single-purpose
 * (carries `purpose: 'password_reset'` so it can never be reused as an
 * access token even if signed with the same secret), and never set as a
 * cookie — the frontend holds it in memory just long enough to call
 * POST /auth/reset-password.
 */
const signResetToken = (userId) =>
  jwt.sign({ sub: userId, purpose: 'password_reset' }, env.jwt.accessSecret, { expiresIn: '10m' });

const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, env.jwt.accessSecret);
  if (decoded.purpose !== 'password_reset') {
    throw new Error('Token is not a valid password-reset token');
  }
  return decoded;
};

/**
 * Converts a duration string like "7d" / "15m" / "1h" into milliseconds,
 * used to set the correct `maxAge` on the refresh token cookie.
 */
const parseDurationToMs = (duration) => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[unit];
};

/**
 * Sets the refresh token as an httpOnly, secure (in production) cookie.
 * Centralized here so login, register, and refresh-token controllers
 * all set the cookie identically.
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie(env.jwt.cookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: parseDurationToMs(env.jwt.refreshExpiresIn),
    path: '/api/v1/auth',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(env.jwt.cookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
  });
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signResetToken,
  verifyResetToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  parseDurationToMs,
};
