const { z } = require('zod');
const { dateLike } = require('./stop.schema');

const createTripSchema = z.object({
  tripName: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  startDate: dateLike, // "YYYY-MM-DD" from the date picker, or full ISO
  endDate: dateLike,
  coverImageUrl: z.string().url().max(255).optional().or(z.literal('')),
  totalBudget: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const updateTripSchema = createTripSchema.partial();

module.exports = { createTripSchema, updateTripSchema };
