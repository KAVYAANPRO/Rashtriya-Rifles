const prisma = require('../config/prisma');
const { toDates } = require('../utils/date');

const DATE_FIELDS = ['startDate', 'endDate'];

async function createTrip(userId, data) {
  const trip = await prisma.trip.create({
    data: {
      ...toDates(data, DATE_FIELDS),
      userId,
    },
  });
  return trip;
}

async function getUserTrips(userId) {
  return await prisma.trip.findMany({
    where: { userId, deletedAt: null },
    orderBy: { startDate: 'asc' },
    include: {
      budget: true,
      stops: {
        orderBy: { stopSequence: 'asc' },
        include: {
          city: true,
          activities: {
            orderBy: [{ scheduledDate: 'asc' }, { scheduledStartTime: 'asc' }],
            include: { activity: { include: { category: true } } },
          },
        },
      },
    },
  });
}

/** Ownership check — throws 404 when the trip isn't this user's. */
async function getTripById(userId, tripId) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
  });
  if (!trip) {
    const error = new Error('Trip not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  return trip;
}

/** The whole trip: stops, their city, their scheduled activities and the budget. */
async function getTripDetail(userId, tripId) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      budget: true,
      shares: { orderBy: { createdAt: 'desc' }, take: 1 },
      stops: {
        orderBy: { stopSequence: 'asc' },
        include: {
          city: true,
          activities: {
            orderBy: [{ scheduledDate: 'asc' }, { scheduledStartTime: 'asc' }],
            include: { activity: { include: { category: true } } },
          },
        },
      },
    },
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
    data: toDates(data, DATE_FIELDS),
  });
}

async function deleteTrip(userId, tripId) {
  await getTripById(userId, tripId);

  await prisma.trip.delete({
    where: { id: tripId },
  });
  return { message: 'Trip successfully deleted' };
}

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  getTripDetail,
  updateTrip,
  deleteTrip,
};
