const slugify = require('slugify');
const { Product, Category } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const { uploadImages, deleteImage } = require('../services/cloudinary.service');
const { trackProductView } = require('../services/recommendation.service');
const { logAdminActivity } = require('../services/adminActivity.service');

const CLOUDINARY_FOLDER = 'zestmart/products';

/**
 * Shared helper: validates that `category` refers to a real, existing
 * Category document. Used by both create and update.
 */
const assertCategoryExists = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw ApiError.badRequest('category does not reference an existing category', 'INVALID_CATEGORY');
  }
};

/**
 * POST /api/v1/admin/products
 * Creates a new product. Admin only. Accepts up to 10 "images" files
 * (multipart/form-data), uploaded to Cloudinary.
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    shortDescription,
    price,
    compareAtPrice,
    discountPercent,
    stock,
    sku,
    category,
    subCategory,
    brand,
    tags,
    features,
    isFeatured,
    isTrending,
    isBestSeller,
    isNewArrival,
    isActive,
    metaTitle,
    metaDescription,
  } = req.body;

  await assertCategoryExists(category);

  const slug = slugify(title, { lower: true, strict: true });
  const existing = await Product.findOne({ slug });
  if (existing) {
    throw ApiError.conflict('A product with this title already exists', 'PRODUCT_EXISTS');
  }

  if (sku) {
    const skuClash = await Product.findOne({ sku: sku.toUpperCase() });
    if (skuClash) {
      throw ApiError.conflict('A product with this SKU already exists', 'SKU_TAKEN');
    }
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploaded = await uploadImages(req.files, CLOUDINARY_FOLDER);
    images = uploaded.map((img) => ({ url: img.url, publicId: img.publicId, alt: title }));
  }

  const product = await Product.create({
    title,
    description,
    shortDescription,
    price,
    compareAtPrice,
    discountPercent,
    stock,
    sku,
    category,
    subCategory,
    brand,
    images,
    tags,
    features,
    isFeatured,
    isTrending,
    isBestSeller,
    isNewArrival,
    isActive,
    metaTitle,
    metaDescription,
  });

  await logAdminActivity({
    adminId: req.user._id,
    action: 'product.create',
    targetType: 'Product',
    targetId: product._id,
    details: { title: product.title },
    ip: req.ip,
  });

  res.status(201).json(new ApiResponse(201, { product }, 'Product created successfully'));
});

/**
 * GET /api/v1/products
 * Public. Supports search (q), filtering (category, minPrice, maxPrice,
 * rating, featured/trending/newArrival/bestseller), sorting, and pagination.
 * Public callers only ever see isActive products; admins may override via
 * ?isActive=false on the admin listing route.
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const isAdmin = !!req.isAdminRoute;

  // Products are only ever attached to leaf (sub-)categories. If the
  // caller filtered by a top-level category (one that has children),
  // expand the filter to include those children too — otherwise a
  // parent-category link would always show 0 products.
  if (req.query.category) {
    const children = await Category.find({ parentCategory: req.query.category }).select('_id');
    if (children.length > 0) {
      const ids = [req.query.category, ...children.map((c) => c._id.toString())];
      req.query = { ...req.query, category: ids.join(',') };
    }
  }

  const features = new ApiFeatures(
    Product.find().populate('category', 'name slug'),
    req.query
  )
    .search(['title', 'tags', 'brand'])
    .filter()
    .sort()
    .paginate();

  if (!isAdmin) {
    // Public callers must never see inactive products, no matter what
    // they pass as ?isActive=. This re-applies isActive:true LAST so it
    // always wins over anything set during .filter(), both for the
    // actual query and for the count used to build pagination meta.
    features.filterConditions.isActive = true;
    features.query = features.query.find({ isActive: true });
  }

  const [products, meta] = await Promise.all([features.query, features.getMeta(Product)]);

  res
    .status(200)
    .json(new ApiResponse(200, products, 'Products fetched successfully', meta));
});

/**
 * GET /api/v1/products/:slug
 * Public. Fetches full product details by slug.
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const filter = { slug: req.params.slug };
  if (!req.isAdminRoute) filter.isActive = true;

  const product = await Product.findOne(filter).populate('category', 'name slug');

  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  // Best-effort "recently viewed" tracking for logged-in shoppers (see
  // optionalAuth in product.routes.js). Never blocks or fails the
  // response — an anonymous visitor or a tracking hiccup should never
  // prevent the product page itself from loading.
  if (req.user) {
    trackProductView(req.user._id, product._id).catch(() => {});
  }

  res.status(200).json(new ApiResponse(200, { product }, 'Product fetched successfully'));
});

/**
 * GET /api/v1/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const products = await Product.find({ isFeatured: true, isActive: true })
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json(new ApiResponse(200, products, 'Featured products fetched successfully'));
});

/**
 * GET /api/v1/products/trending
 */
const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const products = await Product.find({ isTrending: true, isActive: true })
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json(new ApiResponse(200, products, 'Trending products fetched successfully'));
});

/**
 * GET /api/v1/products/bestsellers
 */
const getBestSellers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const products = await Product.find({ isBestSeller: true, isActive: true })
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json(new ApiResponse(200, products, 'Best sellers fetched successfully'));
});

/**
 * GET /api/v1/products/new-arrivals
 */
const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json(new ApiResponse(200, products, 'New arrivals fetched successfully'));
});

/**
 * GET /api/v1/products/:id/related
 * Related products: same category, excluding the product itself,
 * highest-rated first. Falls back gracefully if fewer than `limit` exist.
 */
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 30);

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .sort('-ratingAverage -createdAt')
    .limit(limit);

  res.status(200).json(new ApiResponse(200, related, 'Related products fetched successfully'));
});

/**
 * GET /api/v1/admin/products/:id
 * Admin only. Fetches full product details by ID (spec's Admin API uses
 * :id here, unlike the public detail route which uses :slug).
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');

  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { product }, 'Product fetched successfully'));
});

/**
 * PATCH /api/v1/admin/products/:id
 * Admin only. Partial update; re-slugifies if title changes;
 * appends newly-uploaded images to the gallery if files are sent.
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const updatableFields = [
    'description',
    'shortDescription',
    'price',
    'compareAtPrice',
    'discountPercent',
    'stock',
    'sku',
    'subCategory',
    'brand',
    'tags',
    'features',
    'isFeatured',
    'isTrending',
    'isBestSeller',
    'isNewArrival',
    'isActive',
    'metaTitle',
    'metaDescription',
  ];

  if (req.body.category) {
    await assertCategoryExists(req.body.category);
    product.category = req.body.category;
  }

  if (req.body.title && req.body.title !== product.title) {
    const newSlug = slugify(req.body.title, { lower: true, strict: true });
    const clash = await Product.findOne({ _id: { $ne: product._id }, slug: newSlug });
    if (clash) {
      throw ApiError.conflict('A product with this title already exists', 'PRODUCT_EXISTS');
    }
    product.title = req.body.title;
    product.slug = newSlug;
  }

  if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
    const skuClash = await Product.findOne({
      _id: { $ne: product._id },
      sku: req.body.sku.toUpperCase(),
    });
    if (skuClash) {
      throw ApiError.conflict('A product with this SKU already exists', 'SKU_TAKEN');
    }
  }

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  if (req.files && req.files.length > 0) {
    const uploaded = await uploadImages(req.files, CLOUDINARY_FOLDER);
    const newImages = uploaded.map((img) => ({
      url: img.url,
      publicId: img.publicId,
      alt: product.title,
    }));
    product.images = [...product.images, ...newImages];
  }

  await product.save();

  res.status(200).json(new ApiResponse(200, { product }, 'Product updated successfully'));
});

/**
 * DELETE /api/v1/admin/products/:id
 * Admin only. Deletes the product and cleans up its Cloudinary images.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const publicIds = (product.images || []).map((img) => img.publicId).filter(Boolean);
  await Promise.allSettled(publicIds.map((id) => deleteImage(id)));

  await product.deleteOne();

  await logAdminActivity({
    adminId: req.user._id,
    action: 'product.delete',
    targetType: 'Product',
    targetId: product._id,
    details: { title: product.title },
    ip: req.ip,
  });

  res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
});

/**
 * PATCH /api/v1/admin/products/:id/stock
 * Admin only. Dedicated endpoint for quick stock updates from the spec's
 * Admin APIs section, separate from the general update endpoint.
 */
const updateProductStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { product }, 'Stock updated successfully'));
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getTrendingProducts,
  getBestSellers,
  getNewArrivals,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
  updateProductStock,
};