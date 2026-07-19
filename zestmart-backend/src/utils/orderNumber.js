const Counter = require('../models/counter.model');

/**
 * Formats today's date as YYYYMMDD for use in order/invoice numbers.
 */
const todayStamp = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

/**
 * Atomically increments (and returns) the next sequence number for a
 * given key, e.g. "orders:20260707" -> 1, 2, 3, ... resets naturally
 * each day since the key changes with the date.
 */
const nextSequence = async (key) => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

/**
 * Generates a matching pair of order/invoice numbers for a single
 * checkout, e.g. { orderNumber: "ZM20260707001", invoiceNumber: "INV20260707001" }.
 * Both share the same daily sequence number so they're easy to
 * cross-reference, matching the examples in the spec.
 */
const generateOrderAndInvoiceNumbers = async () => {
  const stamp = todayStamp();
  const seq = await nextSequence(`orders:${stamp}`);
  const seqStr = String(seq).padStart(3, '0');
  return {
    orderNumber: `ZM${stamp}${seqStr}`,
    invoiceNumber: `INV${stamp}${seqStr}`,
  };
};

module.exports = { generateOrderAndInvoiceNumbers };
