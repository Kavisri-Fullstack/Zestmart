const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const {
  listActiveSessions,
  revokeSessionById,
  revokeAllOtherSessions,
} = require('../services/session.service');
const { Session } = require('../models');

/**
 * GET /api/v1/sessions
 * Lists the caller's own active sessions — "where you're logged in".
 * Flags which one is the CURRENT request's session so the frontend can
 * show "(this device)" next to it.
 */
const getMySessions = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.[env.jwt.cookieName];
  const currentHash = currentToken ? Session.hashToken(currentToken) : null;

  const sessions = await listActiveSessions(req.user._id);

  const shaped = sessions.map((s) => ({
    id: s._id,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    lastUsedAt: s.lastUsedAt,
    createdAt: s.createdAt,
    isCurrent: s.refreshTokenHash === currentHash,
  }));

  res.status(200).json(new ApiResponse(200, { sessions: shaped }, 'Sessions fetched successfully'));
});

/**
 * DELETE /api/v1/sessions/:id
 * Revokes one specific session — must belong to the caller.
 */
const revokeSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    throw ApiError.notFound('Session not found', 'SESSION_NOT_FOUND');
  }

  await revokeSessionById(session._id);

  res.status(200).json(new ApiResponse(200, null, 'Session revoked successfully'));
});

/**
 * DELETE /api/v1/sessions
 * "Log out of all other devices" — revokes every session except the
 * one making this very request.
 */
const revokeOtherSessions = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.[env.jwt.cookieName];
  if (!currentToken) {
    throw ApiError.unauthorized('No active session found for this request', 'NO_REFRESH_TOKEN');
  }

  await revokeAllOtherSessions(req.user._id, currentToken);

  res.status(200).json(new ApiResponse(200, null, 'All other sessions revoked successfully'));
});

module.exports = { getMySessions, revokeSession, revokeOtherSessions };
