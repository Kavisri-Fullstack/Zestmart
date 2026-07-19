const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const { Schema } = mongoose;

/**
 * Users collection — matches the "Users" section of the ZestMart spec.
 * Stores customer and admin identities used for login, profile,
 * role access, and ownership of orders/wishlist/addresses/notifications.
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be under 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      // Not required for accounts created via Google sign-in (googleId set instead).
      required: [
        function passwordRequired() {
          return !this.googleId;
        },
        'Password is required',
      ],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default queries
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number'],
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    wishlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cartCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ---------- Indexes (matching spec) ----------
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// ---------- Hooks ----------
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  next();
});

// ---------- Instance methods ----------
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns a plain object safe to send in API responses
 * (no password, no __v). Prefer this over exposing the raw document.
 */
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
