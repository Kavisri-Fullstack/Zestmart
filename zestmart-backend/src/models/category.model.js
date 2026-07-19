const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

/**
 * Categories collection — matches the "Categories" section of the spec.
 * Organizes curated product groups for navigation, homepage tiles,
 * filters, and category pages. Supports nested categories via parentCategory.
 */
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    icon: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
      select: false,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { transform: (_doc, ret) => { delete ret.imagePublicId; return ret; } } }
);

// ---------- Indexes (matching spec) ----------
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ sortOrder: 1 });

// ---------- Hooks ----------
categorySchema.pre('validate', function generateSlug(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
