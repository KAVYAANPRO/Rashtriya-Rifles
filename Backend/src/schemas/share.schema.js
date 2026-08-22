const { z } = require('zod');

const createShareSchema = z.object({
  shareType: z.enum(['public', 'private']).default('public'),
  allowCopy: z.boolean().default(true)
});

module.exports = { createShareSchema };
