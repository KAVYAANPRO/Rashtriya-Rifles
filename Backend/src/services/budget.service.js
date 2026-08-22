const prisma = require('../config/prisma');
const tripService = require('./trip.service');

const num = (v) => (v === null || v === undefined ? null : Number(v));

/** Prisma Decimals serialise as strings — hand the client plain numbers. */
function shapeBudget(budget, extras) {
  return {
    id: budget.id,
    tripId: budget.tripId,
    accommodationBudget: num(budget.accommodationBudget),
    activitiesBudget: num(budget.activitiesBudget),
    foodBudget: num(budget.foodBudget),
    transportationBudget: num(budget.transportationBudget),
    miscellaneousBudget: num(budget.miscellaneousBudget),
    totalBudget: num(budget.totalBudget),
    updatedAt: budget.updatedAt,
    ...extras,
  };
}

async function getTripBudget(userId, tripId) {
  await tripService.getTripById(userId, tripId);

  let budget = await prisma.tripBudget.findUnique({
    where: { tripId },
  });

  if (!budget) {
    budget = await prisma.tripBudget.create({
      data: { tripId },
    });
  }

  // Auto-calculate activity expenses. "Actual" only counts what has actually
  // happened; "planned" covers everything currently on the itinerary.
  const activities = await prisma.tripActivity.findMany({
    where: { tripId, actualCost: { not: null } },
    select: { actualCost: true, status: true },
  });

  let totalActualActivities = 0;
  let totalPlannedActivities = 0;
  for (const act of activities) {
    const cost = parseFloat(act.actualCost || 0);
    if (act.status !== 'cancelled') totalPlannedActivities += cost;
    if (act.status === 'completed') totalActualActivities += cost;
  }

  return shapeBudget(budget, {
    actualActivitiesSpend: totalActualActivities,
    plannedActivitiesSpend: totalPlannedActivities,
  });
}

async function upsertTripBudget(userId, tripId, data) {
  await tripService.getTripById(userId, tripId);

  const parts = [
    'accommodationBudget',
    'activitiesBudget',
    'foodBudget',
    'transportationBudget',
    'miscellaneousBudget',
  ];

  // Merge over whatever is already stored so a partial save doesn't drop
  // categories the form didn't send.
  const existing = await prisma.tripBudget.findUnique({ where: { tripId } });
  const merged = {};
  for (const part of parts) {
    const next = data[part] !== undefined ? data[part] : num(existing?.[part]);
    merged[part] = next ?? null;
  }

  const total = parts.reduce((sum, part) => sum + (merged[part] || 0), 0);

  const budget = await prisma.tripBudget.upsert({
    where: { tripId },
    update: { ...merged, totalBudget: total },
    create: { ...merged, tripId, totalBudget: total },
  });

  // Keep the trip's headline budget in step with the category breakdown.
  if (total > 0) {
    await prisma.trip.update({ where: { id: tripId }, data: { totalBudget: total } });
  }

  return shapeBudget(budget);
}

module.exports = { getTripBudget, upsertTripBudget };
