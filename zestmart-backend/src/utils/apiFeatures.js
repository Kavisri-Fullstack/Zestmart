/**
 * Reusable Mongoose query builder implementing the "Pagination Example"
 * and query-parameter conventions from the spec (page, limit, q, category,
 * minPrice, maxPrice, rating, sort, and the merchandising boolean flags).
 *
 * Usage:
 *   const features = new ApiFeatures(Product.find(), req.query)
 *     .search(['title', 'tags'])
 *     .filter()
 *     .sort()
 *     .paginate();
 *   const products = await features.query;
 *   const meta = await features.getMeta(Product);
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filterConditions = {};
  }

  /**
   * Full-text-ish search across the given fields using a case-insensitive
   * regex. `q` is the spec's query parameter for search.
   */
  search(fields = ['title']) {
    if (this.queryString.q) {
      const regex = new RegExp(this.queryString.q.trim(), 'i');
      this.filterConditions.$or = fields.map((field) => ({ [field]: regex }));
    }
    return this;
  }

  /**
   * Applies category, price range, rating, and merchandising flag filters.
   * Unknown/pagination/sort-related keys are excluded so they never leak
   * into the Mongo filter object.
   */
  filter() {
    const {
      category,
      minPrice,
      maxPrice,
      rating,
      featured,
      trending,
      newArrival,
      bestseller,
      isActive,
    } = this.queryString;

    if (category) {
      const ids = category.split(',').map((id) => id.trim()).filter(Boolean);
      this.filterConditions.category = ids.length > 1 ? { $in: ids } : ids[0];
    }

    if (minPrice || maxPrice) {
      this.filterConditions.price = {};
      if (minPrice) this.filterConditions.price.$gte = Number(minPrice);
      if (maxPrice) this.filterConditions.price.$lte = Number(maxPrice);
    }

    if (rating) this.filterConditions.ratingAverage = { $gte: Number(rating) };

    if (featured !== undefined) this.filterConditions.isFeatured = featured === 'true';
    if (trending !== undefined) this.filterConditions.isTrending = trending === 'true';
    if (newArrival !== undefined) this.filterConditions.isNewArrival = newArrival === 'true';
    if (bestseller !== undefined) this.filterConditions.isBestSeller = bestseller === 'true';

    // Public listing endpoints default to isActive: true unless the
    // caller (typically an admin route) explicitly asks otherwise.
    if (isActive !== undefined) {
      this.filterConditions.isActive = isActive === 'true';
    }

    this.query = this.query.find(this.filterConditions);
    return this;
  }

  /**
   * Sorts by the `sort` query param, e.g. "price" (ascending) or
   * "-price" (descending), or a comma-separated list "-createdAt,price".
   * Defaults to newest first.
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Page-based pagination matching the spec's meta shape
   * (page, limit, total, totalPages, hasNextPage, hasPrevPage).
   */
  paginate() {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(this.queryString.limit, 10) || 12, 1), 100);
    const skip = (page - 1) * limit;

    this.page = page;
    this.limit = limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  /**
   * Runs a count query (using the same filter conditions, but without
   * skip/limit) to build the `meta` object for paginated responses.
   */
  async getMeta(Model) {
    const total = await Model.countDocuments(this.filterConditions);
    const page = this.page || 1;
    const limit = this.limit || 12;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

module.exports = ApiFeatures;