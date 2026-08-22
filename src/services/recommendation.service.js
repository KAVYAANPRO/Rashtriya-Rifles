const prisma = require('../config/prisma');
const budgetService = require('./budget.service');
const { shapeActivity } = require('./catalog.service');

async function getAffordableActivities(userId, tripId, stopId) {
  const budget = await budgetService.getTripBudget(userId, tripId);

  const activitiesGoal = budget.activitiesBudget ? parseFloat(budget.activitiesBudget) : 0;
  const actualSpend = budget.actualActivitiesSpend || 0;
  const remainingBudget = activitiesGoal - actualSpend;

  const hasBudgetLimit = activitiesGoal > 0;

  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId },
  });
  if (!stop) {
    const err = new Error('Stop not found or does not belong to trip');
    err.statusCode = 404;
    throw err;
  }

  const query = {
    where: {
      cityId: stop.cityId,
      isActive: true,
    },
    orderBy: [{ isPopular: 'desc' }, { rating: 'desc' }],
    include: { category: true, city: true },
  };

  if (hasBudgetLimit) {
    query.where.estimatedCost = {
      lte: remainingBudget,
    };
  }

  const recommendations = await prisma.activity.findMany(query);

  return {
    hasBudgetLimit,
    remainingBudget: hasBudgetLimit ? remainingBudget : null,
    activitiesBudget: activitiesGoal || null,
    recommendations: recommendations.map(shapeActivity),
  };
}

module.exports = { getAffordableActivities };
