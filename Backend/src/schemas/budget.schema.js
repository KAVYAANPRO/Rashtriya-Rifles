const { z } = require('zod');

const upsertBudgetSchema = z.object({
  accommodationBudget: z.number().nonnegative().optional(),
  activitiesBudget: z.number().nonnegative().optional(),
  foodBudget: z.number().nonnegative().optional(),
  transportationBudget: z.number().nonnegative().optional(),
  miscellaneousBudget: z.number().nonnegative().optional(),
});

module.exports = { upsertBudgetSchema };
