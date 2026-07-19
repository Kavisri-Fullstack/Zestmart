const express = require('express');
const {
  adminGetAllTickets,
  adminUpdateTicket,
  addMessage,
} = require('../controllers/supportTicket.controller');
const validate = require('../middlewares/validate');
const {
  updateTicketStatusSchema,
  addMessageSchema,
} = require('../validators/supportTicket.validator');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

// GET /api/v1/admin/support-tickets
router.get('/', adminGetAllTickets);

// PATCH /api/v1/admin/support-tickets/:id
router.patch('/:id', validate(updateTicketStatusSchema), adminUpdateTicket);

// POST /api/v1/admin/support-tickets/:id/messages — admin replying as support
router.post('/:id/messages', validate(addMessageSchema), addMessage);

module.exports = router;
