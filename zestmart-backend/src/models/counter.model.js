const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Generic auto-increment counter collection.
 *
 * MongoDB _ids aren't sequential/human-friendly, but order numbers and
 * invoice numbers need to look like "ZM20260707001". This collection
 * stores one counter document per key (e.g. "orders:20260707") and is
 * incremented atomically via findOneAndUpdate + $inc, which is safe
 * under concurrent requests (no two orders can ever get the same number,
 * even if two people check out at the exact same millisecond).
 */
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
