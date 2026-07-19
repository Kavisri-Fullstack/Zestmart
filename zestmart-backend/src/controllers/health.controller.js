const mongoose = require('mongoose');
const ApiResponse = require('../utils/ApiResponse');

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * GET /api/v1/health
 * Lightweight endpoint for uptime monitors (Render, UptimeRobot, etc.)
 * and for quickly confirming the DB connection is alive.
 */
const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;

  const payload = {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: READY_STATES[dbState] || 'unknown',
  };

  const statusCode = dbState === 1 ? 200 : 503;

  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, payload, 'ZestMart API health check'));
};

module.exports = { getHealth };
