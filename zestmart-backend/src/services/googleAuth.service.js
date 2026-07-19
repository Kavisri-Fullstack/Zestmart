const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

let client = null;

if (env.google.clientId) {
  client = new OAuth2Client(env.google.clientId);
} else {
  logger.warn('GOOGLE_CLIENT_ID is not set. Google sign-in will be unavailable until configured.');
}

/**
 * Verifies a Google ID token (sent by the frontend after Google's own
 * sign-in popup/redirect completes) and returns the verified profile.
 *
 * Critically, this does NOT trust anything the frontend claims about
 * who the user is — verifyIdToken() cryptographically checks the
 * token's signature against Google's public keys and confirms it was
 * issued for OUR app (matching GOOGLE_CLIENT_ID), so a forged token
 * from a malicious client can never impersonate another Google account.
 */
const verifyGoogleToken = async (idToken) => {
  if (!client) {
    throw ApiError.internal(
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in .env',
      'GOOGLE_AUTH_NOT_CONFIGURED'
    );
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.google.clientId });
  } catch (err) {
    throw ApiError.unauthorized('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw ApiError.unauthorized('Google token did not include an email address', 'INVALID_GOOGLE_TOKEN');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || null,
    emailVerified: Boolean(payload.email_verified),
  };
};

module.exports = { verifyGoogleToken };
