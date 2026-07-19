const express = require('express');
const { getRecommendations } = require('../controllers/search.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/recommendations
router.get('/', protect, getRecommendations);

module.exports = router;
