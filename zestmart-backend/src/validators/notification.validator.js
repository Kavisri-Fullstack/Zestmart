const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const notificationIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const listNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.enum(['true', 'false']).optional(),
  }),
});

module.exports = { notificationIdParamSchema, listNotificationsQuerySchema };
