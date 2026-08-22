const prisma = require('../config/prisma');
const stopService = require('./stop.service');
const { toDate } = require('../utils/date');

const activityInclude = { activity: { include: { category: true } } };

async function addActivity(userId, tripId, stopId, data) {
  await stopService.getStopOrThrow(userId, tripId, stopId);

  const activity = await prisma.activity.findUnique({ where: { id: data.activityId } });
  if (!activity) {
    const error = new Error('Activity not found in the catalog');
    error.statusCode = 404;
    throw error;
  }

  // Fall back to the catalog price when the caller doesn't override it.
  const actualCost =
    data.actualCost !== undefined
      ? data.actualCost
      : activity.estimatedCost === null
        ? null
        : Number(activity.estimatedCost);

  try {
    return await prisma.tripActivity.create({
      data: {
        activityId: data.activityId,
        scheduledDate: toDate(data.scheduledDate),
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
        actualCost,
        status: data.status || 'planned',
        tripId,
        stopId,
      },
      include: activityInclude,
    });
  } catch (err) {
    // @@unique([tripId, activityId, scheduledDate])
    if (err.code === 'P2002') {
      const error = new Error('That activity is already scheduled on this date');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
}

async function getStopActivities(userId, tripId, stopId) {
  await stopService.getStopOrThrow(userId, tripId, stopId);

  return await prisma.tripActivity.findMany({
    where: { tripId, stopId },
    orderBy: [{ scheduledDate: 'asc' }, { scheduledStartTime: 'asc' }],
    include: activityInclude,
  });
}

async function updateActivity(userId, tripId, stopId, tripActivityId, data) {
  await stopService.getStopOrThrow(userId, tripId, stopId);

  const existing = await prisma.tripActivity.findFirst({
    where: { id: tripActivityId, tripId, stopId },
  });
  if (!existing) {
    const error = new Error('Scheduled activity not found');
    error.statusCode = 404;
    throw error;
  }

  const patch = { ...data };
  if (patch.scheduledDate !== undefined) patch.scheduledDate = toDate(patch.scheduledDate);

  return await prisma.tripActivity.update({
    where: { id: tripActivityId },
    data: patch,
    include: activityInclude,
  });
}

async function removeActivity(userId, tripId, stopId, tripActivityId) {
  await stopService.getStopOrThrow(userId, tripId, stopId);

  const existing = await prisma.tripActivity.findFirst({
    where: { id: tripActivityId, tripId, stopId },
  });
  if (!existing) {
    const error = new Error('Scheduled activity not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.tripActivity.delete({ where: { id: tripActivityId } });
  return { message: 'Activity removed from itinerary' };
}

module.exports = { addActivity, getStopActivities, updateActivity, removeActivity };
