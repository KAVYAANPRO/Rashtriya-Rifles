const { z } = require('zod');

const addActivitySchema = z.object({
  activityId: z.number().int().positive(),
  scheduledDate: z.string().datetime(),
  scheduledStartTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(), // HH:MM
  scheduledEndTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),
  actualCost: z.number().positive().optional(),
});

module.exports = { addActivitySchema };
