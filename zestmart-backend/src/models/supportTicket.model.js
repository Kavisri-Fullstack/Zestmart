const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * SupportTickets collection — one of the spec's "Extra Recommended
 * Collections". A basic customer-service ticket system: a user opens a
 * ticket, optionally linked to an order, and messages go back and forth
 * between the user and support staff (admins) until it's resolved.
 */
const ticketMessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      type: String,
      enum: ['order_issue', 'payment_issue', 'product_question', 'account', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    messages: { type: [ticketMessageSchema], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
supportTicketSchema.index({ user: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
