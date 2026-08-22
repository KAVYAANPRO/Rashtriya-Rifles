const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const tripService = require('./trip.service');

async function addStop(userId, tripId, data) {
  await tripService.getTripById(userId, tripId);
  
  return await prisma.stop.create({
    data: {
      ...data,
      tripId,
    }
  });
}

async function getTripStops(userId, tripId) {
  await tripService.getTripById(userId, tripId);
  
  return await prisma.stop.findMany({
    where: { tripId },
    orderBy: { stopSequence: 'asc' },
    include: { city: true, activities: { include: { activity: true } } }
  });
}

module.exports = { addStop, getTripStops };
