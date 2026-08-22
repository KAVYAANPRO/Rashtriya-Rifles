const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const tripService = require('./trip.service');

async function addActivity(userId, tripId, stopId, data) {
  await tripService.getTripById(userId, tripId);
  
  const stop = await prisma.stop.findFirst({ where: { id: stopId, tripId } });
  if (!stop) throw new Error('Stop not found or does not belong to trip');

  return await prisma.tripActivity.create({
    data: {
      ...data,
      tripId,
      stopId,
    }
  });
}

module.exports = { addActivity };
