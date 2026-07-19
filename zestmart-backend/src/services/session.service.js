const { Session } = require('../models');
const logger = require('../utils/logger');

/**
 * Records a new session whenever a refresh token is issued (login,
 * register, Google sign-in, or refresh-token rotation). Stores only a
 * hash of the token — see session.model.js for why.
 */
const createSession = async ({ userId, refreshToken, userAgent, ipAddress, expiresInMs }) => {
  try {
    await Session.create({
      user: userId,
      refreshTokenHash: Session.hashToken(refreshToken),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + expiresInMs),
    });
  } catch (err) {
    // Session tracking is a nice-to-have for the "manage devices" UI —
    // it should never block an actual login if it fails to write.
    logger.error(`Failed to record session: ${err.message}`);
  }
};

/**
 * Marks the session matching a given refresh token as revoked (used on
 * logout and on refresh-token rotation, since the old token is no
 * longer valid once a new one is issued).
 */
const revokeSessionByToken = async (refreshToken) => {
  const hash = Session.hashToken(refreshToken);
  await Session.updateOne({ refreshTokenHash: hash, revokedAt: null }, { revokedAt: new Date() });
};

/**
 * Lists a user's active (non-revoked, non-expired) sessions — powers a
 * "where you're logged in" screen.
 */
const listActiveSessions = async (userId) => {
  return Session.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort('-lastUsedAt');
};

/**
 * Revokes one specific session by its _id (must belong to the caller —
 * checked by the controller before calling this).
 */
const revokeSessionById = async (sessionId) => {
  await Session.updateOne({ _id: sessionId }, { revokedAt: new Date() });
};

/**
 * Revokes every OTHER active session for a user except the current one
 * — the classic "log out of all other devices" button.
 */
const revokeAllOtherSessions = async (userId, currentRefreshToken) => {
  const currentHash = Session.hashToken(currentRefreshToken);
  await Session.updateMany(
    { user: userId, refreshTokenHash: { $ne: currentHash }, revokedAt: null },
    { revokedAt: new Date() }
  );
};

module.exports = {
  createSession,
  revokeSessionByToken,
  listActiveSessions,
  revokeSessionById,
  revokeAllOtherSessions,
};
