const { z } = require('zod');

const createTripSchema = z.object({
  tripName: z.string().min(1).max(150),
  description: z.string().optional(),
  startDate: z.string().min(1), // accepts YYYY-MM-DD or full ISO
  endDate: z.string().min(1),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  totalBudget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  isPublic: z.boolean().optional(),
});

const updateTripSchema = createTripSchema.partial();

module.exports = { createTripSchema, updateTripSchema };
