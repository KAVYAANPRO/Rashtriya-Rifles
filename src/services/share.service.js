const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const tripService = require('./trip.service');

async function createShareLink(userId, tripId, options = {}) {
  // Verify ownership
  await tripService.getTripById(userId, tripId);

  // Check if a share link already exists
  let share = await prisma.tripShare.findFirst({
    where: { tripId, sharedByUserId: userId }
  });

  if (share) {
    return share;
  }

  // Generate unique slug
  const randomStr = crypto.randomBytes(4).toString('hex');
  const slug = `gt-${randomStr}`;

  share = await prisma.tripShare.create({
    data: {
      tripId,
      sharedByUserId: userId,
      shareType: options.shareType || 'public',
      shareUrlSlug: slug,
      allowCopy: options.allowCopy !== undefined ? options.allowCopy : true
    }
  });

  // Make the trip itself public
  await prisma.trip.update({
    where: { id: tripId },
    data: { isPublic: true, publicUrlSlug: slug }
  });

  return share;
}

async function getPublicTripBySlug(slug) {
  const share = await prisma.tripShare.findUnique({
    where: { shareUrlSlug: slug },
    include: {
      trip: {
        include: {
          user: {
            select: { firstName: true, lastName: true, profilePictureUrl: true }
          },
          stops: {
            include: {
              city: true,
              activities: {
                include: { activity: true }
              }
            }
          }
        }
      }
    }
  });

  if (!share || share.trip.isArchived || share.trip.deletedAt) {
    throw new Error('Trip not found or is private');
  }

  // Increment view count
  await prisma.tripShare.update({
    where: { id: share.id },
    data: { viewCount: { increment: 1 } }
  });

  return share.trip; // Note: Does not include budget!
}

module.exports = { createShareLink, getPublicTripBySlug };
