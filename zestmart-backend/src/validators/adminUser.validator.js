const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const userIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const updateUserStatusSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    status: z.enum(['active', 'blocked'], {
      errorMap: () => ({ message: 'status must be "active" or "blocked"' }),
    }),
  }),
});

const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'blocked']).optional(),
    q: z.string().trim().optional(),
  }),
});

module.exports = { userIdParamSchema, updateUserStatusSchema, listUsersQuerySchema };
