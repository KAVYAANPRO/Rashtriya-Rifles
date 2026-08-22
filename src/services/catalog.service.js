const prisma = require('../config/prisma');

/**
 * Read-only catalog of cities, categories and bookable activities.
 * These power the "Plan a trip", "Build itinerary" and "Browse activities"
 * screens, so they are public — no token needed to look at the catalog.
 */

/** Rough "how long do people stay" hint, derived from how much there is to do. */
function suggestedStay(activityCount) {
  if (activityCount >= 12) return '4-6 days';
  if (activityCount >= 6) return '3-5 days';
  if (activityCount >= 3) return '2-4 days';
  return '2-3 days';
}

function shapeCity(city) {
  const activities = city.activities || [];
  const counts = new Map();
  for (const a of activities) {
    const name = a.category?.categoryName;
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  }
  const topCategory = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    id: city.id,
    cityName: city.cityName,
    country: city.country,
    countryCode: city.countryCode,
    costIndex: city.costIndex,
    popularityScore: city.popularityScore,
    imageUrl: city.imageUrl,
    description: city.description,
    latitude: city.latitude,
    longitude: city.longitude,
    activityCount: activities.length,
    topCategory,
    suggestedStay: suggestedStay(activities.length),
  };
}

function shapeActivity(activity) {
  return {
    id: activity.id,
    activityName: activity.activityName,
    cityId: activity.cityId,
    cityName: activity.city?.cityName ?? null,
    country: activity.city?.country ?? null,
    categoryId: activity.categoryId,
    categoryName: activity.category?.categoryName ?? null,
    description: activity.description,
    estimatedCost: activity.estimatedCost === null ? null : Number(activity.estimatedCost),
    estimatedDuration: activity.estimatedDuration,
    rating: activity.rating === null ? null : Number(activity.rating),
    reviewCount: activity.reviewCount,
    imageUrl: activity.imageUrl,
    bookingUrl: activity.bookingUrl,
    isPopular: activity.isPopular,
  };
}

async function listCities({ search } = {}) {
  const cities = await prisma.city.findMany({
    where: {
      isActive: true,
      ...(search
        ? { OR: [{ cityName: { contains: search } }, { country: { contains: search } }] }
        : {}),
    },
    orderBy: [{ popularityScore: 'desc' }, { cityName: 'asc' }],
    include: {
      activities: {
        where: { isActive: true },
        select: { id: true, category: { select: { categoryName: true } } },
      },
    },
  });

  return cities.map(shapeCity);
}

async function getCity(cityId) {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: {
      activities: {
        where: { isActive: true },
        select: { id: true, category: { select: { categoryName: true } } },
      },
    },
  });
  if (!city) {
    const err = new Error('City not found');
    err.statusCode = 404;
    throw err;
  }
  return shapeCity(city);
}

async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { categoryName: 'asc' }],
  });
  return categories.map((c) => ({
    id: c.id,
    categoryName: c.categoryName,
    description: c.description,
    iconUrl: c.iconUrl,
  }));
}

async function listActivities({ cityId, categoryId, categoryName, search, maxCost, popularOnly } = {}) {
  const where = { isActive: true };

  if (cityId) where.cityId = cityId;
  if (categoryId) where.categoryId = categoryId;
  if (categoryName) where.category = { categoryName };
  if (popularOnly) where.isPopular = true;
  if (maxCost !== undefined && maxCost !== null) where.estimatedCost = { lte: maxCost };
  if (search) {
    where.OR = [
      { activityName: { contains: search } },
      { city: { cityName: { contains: search } } },
      { city: { country: { contains: search } } },
    ];
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: [{ isPopular: 'desc' }, { rating: 'desc' }, { activityName: 'asc' }],
    include: { city: true, category: true },
  });

  return activities.map(shapeActivity);
}

module.exports = { listCities, getCity, listCategories, listActivities, shapeActivity, shapeCity };
