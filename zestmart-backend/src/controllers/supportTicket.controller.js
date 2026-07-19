const { SupportTicket } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { notifyUser } = require('../services/notification.service');
const { logAdminActivity } = require('../services/adminActivity.service');

/**
 * POST /api/v1/support-tickets
 * Opens a new ticket with its first message pre-filled from the body.
 */
const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, message, orderId } = req.body;

  const ticket = await SupportTicket.create({
    user: req.user._id,
    order: orderId || null,
    subject,
    category: category || 'other',
    messages: [{ sender: req.user._id, senderRole: 'user', message }],
  });

  res.status(201).json(new ApiResponse(201, { ticket }, 'Support ticket created successfully'));
});

/**
 * GET /api/v1/support-tickets
 * The caller's own tickets only.
 */
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json(new ApiResponse(200, { tickets }, 'Support tickets fetched successfully'));
});

/**
 * Shared ownership check, same pattern as orders: a regular user only
 * sees their own ticket; an admin sees any ticket.
 */
const findOwnedTicket = async (ticketId, user) => {
  const filter = user.role === 'admin' ? { _id: ticketId } : { _id: ticketId, user: user._id };
  const ticket = await SupportTicket.findOne(filter);
  if (!ticket) {
    throw ApiError.notFound('Support ticket not found', 'TICKET_NOT_FOUND');
  }
  return ticket;
};

/**
 * GET /api/v1/support-tickets/:id
 */
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await findOwnedTicket(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, { ticket }, 'Support ticket fetched successfully'));
});

/**
 * POST /api/v1/support-tickets/:id/messages
 * Either party (the ticket owner, or any admin acting as support) can
 * add a message. A closed ticket automatically reopens to "in_progress"
 * when the customer replies again.
 */
const addMessage = asyncHandler(async (req, res) => {
  const ticket = await findOwnedTicket(req.params.id, req.user);

  const senderRole = req.user.role === 'admin' ? 'admin' : 'user';
  ticket.messages.push({ sender: req.user._id, senderRole, message: req.body.message });

  if (senderRole === 'user' && ['resolved', 'closed'].includes(ticket.status)) {
    ticket.status = 'in_progress';
  }

  await ticket.save();

  if (senderRole === 'admin') {
    await notifyUser({
      userId: ticket.user,
      type: 'system',
      title: `Reply on your ticket: ${ticket.subject}`,
      message: req.body.message.slice(0, 150),
      link: `/support-tickets/${ticket._id}`,
    });
  }

  res.status(200).json(new ApiResponse(200, { ticket }, 'Message added successfully'));
});

// ---------- Admin ----------

/**
 * GET /api/v1/admin/support-tickets
 */
const adminGetAllTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const tickets = await SupportTicket.find(filter)
    .populate('user', 'name email')
    .sort('-createdAt');

  res.status(200).json(new ApiResponse(200, { tickets }, 'Support tickets fetched successfully'));
});

/**
 * PATCH /api/v1/admin/support-tickets/:id
 * Update status/priority/assignment.
 */
const adminUpdateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    throw ApiError.notFound('Support ticket not found', 'TICKET_NOT_FOUND');
  }

  const { status, priority, assignedTo } = req.body;
  if (status) {
    ticket.status = status;
    if (['resolved', 'closed'].includes(status)) ticket.resolvedAt = new Date();
  }
  if (priority) ticket.priority = priority;
  if (assignedTo) ticket.assignedTo = assignedTo;

  await ticket.save();

  await logAdminActivity({
    adminId: req.user._id,
    action: 'supportTicket.update',
    targetType: 'SupportTicket',
    targetId: ticket._id,
    details: { status, priority, assignedTo },
    ip: req.ip,
  });

  res.status(200).json(new ApiResponse(200, { ticket }, 'Support ticket updated successfully'));
});

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
  adminGetAllTickets,
  adminUpdateTicket,
};
