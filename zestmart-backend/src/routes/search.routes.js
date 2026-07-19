const express = require('express');
const { getSuggestions, searchProducts } = require('../controllers/search.controller');
const { searchLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// GET /api/v1/search/suggestions — public, strictly rate-limited (autocomplete)
router.get('/suggestions', searchLimiter, getSuggestions);

// GET /api/v1/search/products — public
router.get('/products', searchProducts);

module.exports = router;
