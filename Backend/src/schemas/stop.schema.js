const { z } = require('zod');

// <input type="date"> sends "2026-04-02"; API clients may send full ISO.
// Both are accepted here and normalised in src/utils/date.js.
const dateLike = z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: 'must be a valid date' });

const addStopSchema = z.object({
  cityId: z.number().int().positive(),
  stopSequence: z.number().int().positive().optional(),
  startDate: dateLike,
  endDate: dateLike,
  accommodationBudget: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

const updateStopSchema = z.object({
  cityId: z.number().int().positive().optional(),
  stopSequence: z.number().int().positive().optional(),
  startDate: dateLike.optional(),
  endDate: dateLike.optional(),
  accommodationBudget: z.number().nonnegative().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

module.exports = { addStopSchema, updateStopSchema, dateLike };
