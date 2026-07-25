const { z } = require('zod');

const chatMessageSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().max(2000),
        })
      )
      .max(20)
      .optional(),
  }),
});

module.exports = { chatMessageSchema };
