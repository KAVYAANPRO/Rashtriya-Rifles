const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTrip(userId, data) {
  const trip = await prisma.trip.create({
    data: {
      ...data,
      userId,
    }
  });
  return trip;
}

async function getUserTrips(userId) {
  return await prisma.trip.findMany({
    where: { userId },
    orderBy: { startDate: 'asc' }
  });
}

async function getTripById(userId, tripId) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId }
  });
  if (!trip) {
    const error = new Error('Trip not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  return trip;
}

async function updateTrip(userId, tripId, data) {
  await getTripById(userId, tripId);
  
  return await prisma.trip.update({
    where: { id: tripId },
    data
  });
}

async function deleteTrip(userId, tripId) {
  await getTripById(userId, tripId);
  
  await prisma.trip.delete({
    where: { id: tripId }
  });
  return { message: 'Trip successfully deleted' };
}

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip
};
