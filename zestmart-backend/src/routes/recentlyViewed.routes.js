const express = require('express');
const { getRecentlyViewed } = require('../controllers/search.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/recently-viewed
router.get('/', protect, getRecentlyViewed);

module.exports = router;
