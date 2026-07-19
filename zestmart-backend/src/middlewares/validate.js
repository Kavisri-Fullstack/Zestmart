const ApiError = require('../utils/ApiError');

/**
 * Generic request-validation middleware powered by Zod.
 * Usage:
 *   router.post('/register', validate(registerSchema), register);
 *
 * `schema` should be a Zod object with `body`, `query`, and/or `params`
 * keys, matching whichever parts of the request it validates. Only the
 * parts included in the schema are checked and replaced with their
 * parsed (and type-coerced) values.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.slice(1).join('.') || issue.path.join('.'),
      message: issue.message,
    }));
    return next(ApiError.validation('Validation failed', details));
  }

  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

module.exports = validate;
