const { z } = require('zod');

const addStopSchema = z.object({
  cityId: z.number().int().positive(),
  stopSequence: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  accommodationBudget: z.number().positive().optional(),
  notes: z.string().optional(),
});

module.exports = { addStopSchema };
