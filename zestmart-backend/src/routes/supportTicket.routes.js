const express = require('express');
const {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
} = require('../controllers/supportTicket.controller');
const validate = require('../middlewares/validate');
const {
  createTicketSchema,
  ticketIdParamSchema,
  addMessageSchema,
} = require('../validators/supportTicket.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

// POST /api/v1/support-tickets
router.post('/', validate(createTicketSchema), createTicket);

// GET /api/v1/support-tickets
router.get('/', getMyTickets);

// GET /api/v1/support-tickets/:id
router.get('/:id', validate(ticketIdParamSchema), getTicketById);

// POST /api/v1/support-tickets/:id/messages
router.post('/:id/messages', validate(addMessageSchema), addMessage);

module.exports = router;
