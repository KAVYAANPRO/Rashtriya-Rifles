const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const tripService = require('./trip.service');
const currencyService = require('./currency.service');

async function getTripBudget(userId, tripId) {
  const trip = await tripService.getTripById(userId, tripId);
  
  let budget = await prisma.tripBudget.findUnique({
    where: { tripId }
  });
  
  if (!budget) {
    budget = await prisma.tripBudget.create({
      data: { tripId }
    });
  }

  // Auto-calculate actual activity expenses
  const activities = await prisma.tripActivity.findMany({
    where: { tripId, status: 'completed', actualCost: { not: null } }
  });
  
  let totalActualActivities = 0;
  for (const act of activities) {
    totalActualActivities += parseFloat(act.actualCost || 0);
  }

  return {
    ...budget,
    actualActivitiesSpend: totalActualActivities,
  };
}

async function upsertTripBudget(userId, tripId, data) {
  await tripService.getTripById(userId, tripId);
  
  let total = 0;
  if (data.accommodationBudget) total += data.accommodationBudget;
  if (data.activitiesBudget) total += data.activitiesBudget;
  if (data.foodBudget) total += data.foodBudget;
  if (data.transportationBudget) total += data.transportationBudget;
  if (data.miscellaneousBudget) total += data.miscellaneousBudget;

  const budget = await prisma.tripBudget.upsert({
    where: { tripId },
    update: {
      ...data,
      totalBudget: total > 0 ? total : undefined
    },
    create: {
      ...data,
      tripId,
      totalBudget: total > 0 ? total : 0
    }
  });

  return budget;
}

module.exports = { getTripBudget, upsertTripBudget };
