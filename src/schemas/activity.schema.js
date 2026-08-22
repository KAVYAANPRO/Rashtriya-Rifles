const { z } = require('zod');
const { dateLike } = require('./stop.schema');

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'must be HH:MM');

const addActivitySchema = z.object({
  activityId: z.number().int().positive(),
  scheduledDate: dateLike,
  scheduledStartTime: timeOfDay.optional(),
  scheduledEndTime: timeOfDay.optional(),
  actualCost: z.number().nonnegative().optional(),
  status: z.enum(['planned', 'completed', 'cancelled']).optional(),
});

const updateActivitySchema = z.object({
  scheduledDate: dateLike.optional(),
  scheduledStartTime: timeOfDay.nullable().optional(),
  scheduledEndTime: timeOfDay.nullable().optional(),
  actualCost: z.number().nonnegative().nullable().optional(),
  status: z.enum(['planned', 'completed', 'cancelled']).optional(),
});

module.exports = { addActivitySchema, updateActivitySchema };
