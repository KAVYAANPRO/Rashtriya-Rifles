const prisma = require('../config/prisma');
const tripService = require('./trip.service');
const { slugify } = require('../utils/slugify');

async function createShareLink(userId, tripId, options = {}) {
  // Verify ownership
  const trip = await tripService.getTripById(userId, tripId);

  // Check if a share link already exists
  let share = await prisma.tripShare.findFirst({
    where: { tripId, sharedByUserId: userId },
  });

  if (share) {
    return share;
  }

  // Readable slug from the trip name, with a random suffix for uniqueness.
  let slug = slugify(trip.tripName).slice(0, 100);
  if (await prisma.tripShare.findUnique({ where: { shareUrlSlug: slug } })) {
    slug = slugify(`${trip.tripName}-${trip.id}`).slice(0, 100);
  }

  share = await prisma.tripShare.create({
    data: {
      tripId,
      sharedByUserId: userId,
      shareType: options.shareType || 'public',
      shareUrlSlug: slug,
      allowCopy: options.allowCopy !== undefined ? options.allowCopy : true,
    },
  });

  // Make the trip itself public
  await prisma.trip.update({
    where: { id: tripId },
    data: { isPublic: true, publicUrlSlug: slug },
  });

  return share;
}

/** The existing link for a trip, or null when it has never been shared. */
async function getShareLink(userId, tripId) {
  await tripService.getTripById(userId, tripId);

  return await prisma.tripShare.findFirst({
    where: { tripId, sharedByUserId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function revokeShareLink(userId, tripId) {
  await tripService.getTripById(userId, tripId);

  await prisma.tripShare.deleteMany({ where: { tripId, sharedByUserId: userId } });
  await prisma.trip.update({
    where: { id: tripId },
    data: { isPublic: false, publicUrlSlug: null },
  });

  return { message: 'Share link revoked' };
}

async function getPublicTripBySlug(slug) {
  const share = await prisma.tripShare.findUnique({
    where: { shareUrlSlug: slug },
    include: {
      trip: {
        include: {
          user: {
            select: { firstName: true, lastName: true, profilePictureUrl: true },
          },
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
      },
    },
  });

  if (!share || share.trip.isArchived || share.trip.deletedAt) {
    const error = new Error('Trip not found or is private');
    error.statusCode = 404;
    throw error;
  }

  // Increment view count
  await prisma.tripShare.update({
    where: { id: share.id },
    data: { viewCount: { increment: 1 } },
  });
  await prisma.trip.update({
    where: { id: share.tripId },
    data: { viewCount: { increment: 1 } },
  });

  // Note: the budget is deliberately left out of the public payload.
  return { ...share.trip, allowCopy: share.allowCopy, shareUrlSlug: share.shareUrlSlug };
}

module.exports = { createShareLink, getShareLink, revokeShareLink, getPublicTripBySlug };
