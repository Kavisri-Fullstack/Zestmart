const express = require('express');
const { getSiteSettings } = require('../controllers/siteSettings.controller');

const router = express.Router();

// GET /api/v1/site-settings
router.get('/', getSiteSettings);

module.exports = router;
