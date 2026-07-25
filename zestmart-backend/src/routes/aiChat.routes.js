const express = require('express');
const { sendChatMessage } = require('../controllers/aiChat.controller');
const validate = require('../middlewares/validate');
const { aiChatLimiter } = require('../middlewares/rateLimiter');
const { chatMessageSchema } = require('../validators/aiChat.validator');

const router = express.Router();

// POST /api/v1/ai/chat — open to guests and logged-in users alike.
router.post('/chat', aiChatLimiter, validate(chatMessageSchema), sendChatMessage);

module.exports = router;
