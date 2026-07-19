const slugify = require('slugify');
const { Category, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadImage, deleteImage } = require('../services/cloudinary.service');

const CLOUDINARY_FOLDER = 'zestmart/categories';

/**
 * POST /api/v1/admin/categories
 * Creates a new category. Admin only. Accepts an optional "image"
 * file (multipart/form-data) uploaded to Cloudinary.
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, parentCategory, isActive, sortOrder } = req.body;

  const slug = slugify(name, { lower: true, strict: true });
  const existing = await Category.findOne({ $or: [{ name }, { slug }] });
  if (existing) {
    throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
  }

  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      throw ApiError.badRequest('parentCategory does not reference an existing category', 'INVALID_PARENT');
    }
  }

  let image = null;
  let imagePublicId = null;
  if (req.file) {
    const uploaded = await uploadImage(req.file, CLOUDINARY_FOLDER);
    image = uploaded.url;
    imagePublicId = uploaded.publicId;
  }

  const category = await Category.create({
    name,
    description,
    icon,
    image,
    imagePublicId,
    parentCategory: parentCategory || null,
    isActive,
    sortOrder,
  });

  res.status(201).json(new ApiResponse(201, { category }, 'Category created successfully'));
});

/**
 * GET /api/v1/categories
 * Public. Lists all active categories, sorted by sortOrder.
 * Admins can pass ?isActive=false to see inactive ones too via the admin route.
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.isAdminRoute) {
    // Only admin callers may explicitly request inactive categories.
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
  } else {
    // Public callers always see active categories only — the isActive
    // query param is intentionally ignored here so it can't be used to
    // peek at disabled categories.
    filter.isActive = true;
  }

  const categories = await Category.find(filter).sort('sortOrder name');

  res
    .status(200)
    .json(new ApiResponse(200, { categories }, 'Categories fetched successfully'));
});

/**
 * GET /api/v1/categories/:slug
 * Public. Fetches a single category by slug.
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category || (!category.isActive && !req.isAdminRoute)) {
    throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { category }, 'Category fetched successfully'));
});

/**
 * GET /api/v1/categories/:slug/products
 * Public. Lists active products belonging to a category.
 */
const getCategoryProducts = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });

  if (!category) {
    throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  }

  const products = await Product.find({ category: category._id, isActive: true }).sort('-createdAt');

  res
    .status(200)
    .json(new ApiResponse(200, { category, products }, 'Category products fetched successfully'));
});

/**
 * PATCH /api/v1/admin/categories/:id
 * Admin only. Partial update; re-slugifies if name changes;
 * replaces the Cloudinary image if a new one is uploaded.
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).select('+imagePublicId');
  if (!category) {
    throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  }

  const { name, description, icon, parentCategory, isActive, sortOrder } = req.body;

  if (parentCategory) {
    if (parentCategory === req.params.id) {
      throw ApiError.badRequest('A category cannot be its own parent', 'INVALID_PARENT');
    }
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      throw ApiError.badRequest('parentCategory does not reference an existing category', 'INVALID_PARENT');
    }
  }

  if (name && name !== category.name) {
    const newSlug = slugify(name, { lower: true, strict: true });
    const clash = await Category.findOne({
      _id: { $ne: category._id },
      $or: [{ name }, { slug: newSlug }],
    });
    if (clash) {
      throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
    }
    category.name = name;
    category.slug = newSlug;
  }

  if (description !== undefined) category.description = description;
  if (icon !== undefined) category.icon = icon;
  if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
  if (isActive !== undefined) category.isActive = isActive;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;

  if (req.file) {
    const oldPublicId = category.imagePublicId;
    const uploaded = await uploadImage(req.file, CLOUDINARY_FOLDER);
    category.image = uploaded.url;
    category.imagePublicId = uploaded.publicId;
    // Best-effort cleanup of the old image; failure here shouldn't block
    // the update from succeeding, so it's deliberately not awaited-and-thrown.
    if (oldPublicId) {
      deleteImage(oldPublicId).catch(() => {});
    }
  }

  await category.save();

  res.status(200).json(new ApiResponse(200, { category }, 'Category updated successfully'));
});

/**
 * DELETE /api/v1/admin/categories/:id
 * Admin only. Blocks deletion if products still reference this category,
 * so the catalog never ends up with orphaned/dangling product records.
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).select('+imagePublicId');
  if (!category) {
    throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  }

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw ApiError.conflict(
      `Cannot delete category: ${productCount} product(s) still belong to it`,
      'CATEGORY_IN_USE'
    );
  }

  const childCount = await Category.countDocuments({ parentCategory: category._id });
  if (childCount > 0) {
    throw ApiError.conflict(
      `Cannot delete category: it has ${childCount} child categor${childCount === 1 ? 'y' : 'ies'}`,
      'CATEGORY_HAS_CHILDREN'
    );
  }

  if (category.imagePublicId) {
    deleteImage(category.imagePublicId).catch(() => {});
  }

  await category.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully'));
});

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  getCategoryProducts,
  updateCategory,
  deleteCategory,
};
