const { z } = require('zod');

const createTripSchema = z.object({
  tripName: z.string().min(1).max(150),
  description: z.string().optional(),
  startDate: z.string().datetime(), // ISO-8601 string
  endDate: z.string().datetime(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  totalBudget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  isPublic: z.boolean().optional(),
});

const updateTripSchema = createTripSchema.partial();

module.exports = { createTripSchema, updateTripSchema };
