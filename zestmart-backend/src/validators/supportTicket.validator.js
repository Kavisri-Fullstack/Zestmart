const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(3).max(150),
    category: z.enum(['order_issue', 'payment_issue', 'product_question', 'account', 'other']).optional(),
    message: z.string().trim().min(1).max(2000),
    orderId: objectIdRule.optional(),
  }),
});

const ticketIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const addMessageSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    message: z.string().trim().min(1).max(2000),
  }),
});

const updateTicketStatusSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assignedTo: objectIdRule.optional(),
  }),
});

module.exports = {
  createTicketSchema,
  ticketIdParamSchema,
  addMessageSchema,
  updateTicketStatusSchema,
};
