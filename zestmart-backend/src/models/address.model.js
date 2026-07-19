const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Addresses collection — matches the "Addresses" section of the spec.
 * Saved shipping addresses for fast checkout. Orders store their own
 * snapshot of the chosen address, so editing/deleting an address here
 * never changes historical order records.
 */
const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    label: {
      type: String,
      trim: true,
      default: 'Home',
      maxlength: 30,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number'],
    },
    line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: 200,
    },
    line2: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: 80,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: 80,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      match: [/^[0-9]{4,10}$/, 'Invalid postal code'],
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
      maxlength: 60,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
addressSchema.index({ user: 1 });
addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ postalCode: 1 });

/**
 * Ensures only one default address per user. When an address is
 * saved with isDefault: true, every other address of the same
 * user is automatically un-defaulted.
 */
addressSchema.pre('save', async function enforceSingleDefault(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);
