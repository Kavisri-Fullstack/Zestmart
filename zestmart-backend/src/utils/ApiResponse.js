/**
 * Standard success response wrapper, matching the shape defined in the
 * ZestMart API spec:
 * { success, message, data, meta }
 */
class ApiResponse {
  constructor(statusCode, data = {}, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }
}

module.exports = ApiResponse;
