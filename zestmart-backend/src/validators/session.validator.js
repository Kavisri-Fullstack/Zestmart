const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const sessionIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

module.exports = { sessionIdParamSchema };
