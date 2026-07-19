const express = require('express');
const { getActivityLogs } = require('../controllers/adminActivity.controller');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/admin/activity-logs
router.get('/', protect, restrictTo('admin'), getActivityLogs);

module.exports = router;
