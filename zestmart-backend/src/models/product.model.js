const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

/**
 * Products collection — matches the "Products" section of the spec.
 * The main catalog entity: listing, details, gallery, filtering,
 * search, and recommendations all read from this collection.
 */
const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    publicId: { type: String, default: null, select: false },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'compareAtPrice cannot be negative'],
      default: null,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subCategory: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    primaryImage: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      set: (val) => Math.round(val * 10) / 10, // stores one decimal place
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { transform: (_doc, ret) => {
      if (Array.isArray(ret.images)) {
        ret.images = ret.images.map(({ url, alt }) => ({ url, alt }));
      }
      return ret;
    } } }
);

// ---------- Indexes (matching spec) ----------
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ title: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// ---------- Hooks ----------
productSchema.pre('validate', function generateSlug(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Auto-set primaryImage from the first image if not explicitly provided.
productSchema.pre('save', function setPrimaryImage(next) {
  if (!this.primaryImage && this.images && this.images.length > 0) {
    this.primaryImage = this.images[0].url;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
