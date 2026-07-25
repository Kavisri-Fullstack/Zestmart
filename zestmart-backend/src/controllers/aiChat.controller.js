const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const aiChatService = require('../services/aiChat.service');

/**
 * POST /api/v1/ai/chat
 * Body: { message: string, history?: [{ role: 'user'|'assistant', content: string }] }
 */
const sendChatMessage = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  const { reply, products } = await aiChatService.chat({ message, history });

  res.status(200).json(new ApiResponse(200, { reply, products }, 'AI response generated'));
});

module.exports = { sendChatMessage };
