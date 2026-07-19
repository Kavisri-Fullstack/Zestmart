const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * General-purpose limiter applied to the whole /api/v1 tree.
 * Generous limits since it covers all public browsing traffic.
 */
const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: { code: 'RATE_LIMITED', details: [] },
  },
});

/**
 * Strict limiter for auth endpoints (login, register, password reset)
 * to slow down brute-force and credential-stuffing attempts.
 */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.',
    error: { code: 'AUTH_RATE_LIMITED', details: [] },
  },
});

/**
 * Very strict limiter for OTP send/verify endpoints, since these
 * are prime targets for abuse (SMS/email bombing, brute-forcing codes).
 */
const otpLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.otpMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.',
    error: { code: 'OTP_RATE_LIMITED', details: [] },
  },
});

/**
 * Strict limiter for the search-suggestions (autocomplete) endpoint,
 * matching the spec's note under Search APIs. Autocomplete fires on
 * every keystroke from every visitor, so it's both a common abuse
 * target and a good candidate for its own tighter budget separate
 * from general browsing traffic.
 */
const searchLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: Math.max(env.rateLimit.max * 2, 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many search requests, please slow down.',
    error: { code: 'SEARCH_RATE_LIMITED', details: [] },
  },
});

module.exports = { globalLimiter, authLimiter, otpLimiter, searchLimiter };
