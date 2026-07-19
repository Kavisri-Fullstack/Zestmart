const express = require('express');
const { getActiveBanners } = require('../controllers/banner.controller');

const router = express.Router();

// GET /api/v1/banners
router.get('/', getActiveBanners);

module.exports = router;
