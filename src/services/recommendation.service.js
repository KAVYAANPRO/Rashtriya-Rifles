const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const budgetService = require('./budget.service');

async function getAffordableActivities(userId, tripId, stopId) {
  const budget = await budgetService.getTripBudget(userId, tripId);
  
  const activitiesGoal = budget.activitiesBudget ? parseFloat(budget.activitiesBudget) : 0;
  const actualSpend = budget.actualActivitiesSpend || 0;
  let remainingBudget = activitiesGoal - actualSpend;
  
  const hasBudgetLimit = activitiesGoal > 0;

  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId }
  });
  if (!stop) throw new Error('Stop not found or does not belong to trip');

  let query = {
    where: {
      cityId: stop.cityId,
      isActive: true,
    },
    include: { category: true }
  };

  if (hasBudgetLimit) {
    query.where.estimatedCost = {
      lte: remainingBudget
    };
  }

  const recommendations = await prisma.activity.findMany(query);
  
  return {
    remainingBudget: hasBudgetLimit ? remainingBudget : 'No limit set',
    recommendations
  };
}

module.exports = { getAffordableActivities };
