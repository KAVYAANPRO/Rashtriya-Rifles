const prisma = require('../config/prisma');
const tripService = require('./trip.service');
const { toDates } = require('../utils/date');

const DATE_FIELDS = ['startDate', 'endDate'];

const stopInclude = {
  city: true,
  activities: {
    orderBy: [{ scheduledDate: 'asc' }, { scheduledStartTime: 'asc' }],
    include: { activity: { include: { category: true } } },
  },
};

/** Loads a stop and proves it belongs to a trip the user owns. */
async function getStopOrThrow(userId, tripId, stopId) {
  await tripService.getTripById(userId, tripId);

  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId },
    include: stopInclude,
  });
  if (!stop) {
    const error = new Error('Stop not found or does not belong to trip');
    error.statusCode = 404;
    throw error;
  }
  return stop;
}

async function addStop(userId, tripId, data) {
  await tripService.getTripById(userId, tripId);

  // The UI adds stops in order, so the sequence is derived rather than asked for.
  let stopSequence = data.stopSequence;
  if (!stopSequence) {
    const last = await prisma.stop.findFirst({
      where: { tripId },
      orderBy: { stopSequence: 'desc' },
      select: { stopSequence: true },
    });
    stopSequence = (last?.stopSequence || 0) + 1;
  }

  return await prisma.stop.create({
    data: {
      ...toDates(data, DATE_FIELDS),
      stopSequence,
      tripId,
    },
    include: stopInclude,
  });
}

async function getTripStops(userId, tripId) {
  await tripService.getTripById(userId, tripId);

  return await prisma.stop.findMany({
    where: { tripId },
    orderBy: { stopSequence: 'asc' },
    include: stopInclude,
  });
}

async function getStop(userId, tripId, stopId) {
  return await getStopOrThrow(userId, tripId, stopId);
}

async function updateStop(userId, tripId, stopId, data) {
  await getStopOrThrow(userId, tripId, stopId);

  return await prisma.stop.update({
    where: { id: stopId },
    data: toDates(data, DATE_FIELDS),
    include: stopInclude,
  });
}

async function deleteStop(userId, tripId, stopId) {
  await getStopOrThrow(userId, tripId, stopId);

  // trip_activities cascade off the stop, so scheduled items go with it.
  await prisma.stop.delete({ where: { id: stopId } });
  return { message: 'Stop successfully removed' };
}

module.exports = { addStop, getTripStops, getStop, updateStop, deleteStop, getStopOrThrow };
