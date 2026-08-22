const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

/**
 * Seeds the catalog the planner UI browses (cities, categories, activities)
 * plus a demo account with two example trips.
 *
 * Safe to re-run: everything is an upsert or is keyed off the demo account.
 */

const CATEGORIES = [
  'Adventure',
  'Food & Dining',
  'Culture & History',
  'Shopping',
  'Nightlife',
  'Nature & Parks',
  'Photography',
  'Sports',
  'Wellness',
];

const CITIES = [
  { key: 'kyoto', cityName: 'Kyoto', country: 'Japan', countryCode: 'JP', costIndex: 'Medium', popularityScore: 880, latitude: 35.0116, longitude: 135.7681, description: 'Temples, tea houses and the quietest side of Japan.' },
  { key: 'osaka', cityName: 'Osaka', country: 'Japan', countryCode: 'JP', costIndex: 'Medium', popularityScore: 820, latitude: 34.6937, longitude: 135.5023, description: "Japan's kitchen — street food, neon and castle grounds." },
  { key: 'lisbon', cityName: 'Lisbon', country: 'Portugal', countryCode: 'PT', costIndex: 'Low', popularityScore: 790, latitude: 38.7223, longitude: -9.1393, description: 'Tiled hills, trams and Atlantic light.' },
  { key: 'reykjavik', cityName: 'Reykjavik', country: 'Iceland', countryCode: 'IS', costIndex: 'High', popularityScore: 700, latitude: 64.1466, longitude: -21.9426, description: 'Base camp for lagoons, lava fields and the aurora.' },
  { key: 'paris', cityName: 'Paris', country: 'France', countryCode: 'FR', costIndex: 'High', popularityScore: 950, latitude: 48.8566, longitude: 2.3522, description: 'Museums, boulevards and long lunches.' },
  { key: 'loire', cityName: 'Loire Valley', country: 'France', countryCode: 'FR', costIndex: 'Medium', popularityScore: 610, latitude: 47.396, longitude: 0.6848, description: 'Chateaux, vineyards and slow river roads.' },
  { key: 'bangkok', cityName: 'Bangkok', country: 'Thailand', countryCode: 'TH', costIndex: 'Low', popularityScore: 860, latitude: 13.7563, longitude: 100.5018, description: 'Temples, markets and the best street food on earth.' },
  { key: 'capetown', cityName: 'Cape Town', country: 'South Africa', countryCode: 'ZA', costIndex: 'Medium', popularityScore: 760, latitude: -33.9249, longitude: 18.4241, description: 'Mountain, ocean and winelands within an hour of each other.' },
];

const ACTIVITIES = [
  { city: 'kyoto', activityName: 'Fushimi Inari Hike', category: 'Adventure', estimatedCost: 0, estimatedDuration: 150, rating: 4.8, reviewCount: 2140, isPopular: true },
  { city: 'kyoto', activityName: 'Kaiseki Tasting Menu', category: 'Food & Dining', estimatedCost: 85, estimatedDuration: 120, rating: 4.9, reviewCount: 860, isPopular: true },
  { city: 'kyoto', activityName: 'Gion District Walking Tour', category: 'Culture & History', estimatedCost: 32, estimatedDuration: 90, rating: 4.6, reviewCount: 540 },
  { city: 'osaka', activityName: 'Dotonbori Street Food Crawl', category: 'Food & Dining', estimatedCost: 45, estimatedDuration: 150, rating: 4.7, reviewCount: 1320, isPopular: true },
  { city: 'osaka', activityName: 'Osaka Castle Tour', category: 'Culture & History', estimatedCost: 20, estimatedDuration: 100, rating: 4.5, reviewCount: 980 },
  { city: 'osaka', activityName: 'Paragliding over Kansai Coast', category: 'Sports', estimatedCost: 126, estimatedDuration: 60, rating: 4.9, reviewCount: 210 },
  { city: 'lisbon', activityName: 'Belem Tower & Tram 28', category: 'Culture & History', estimatedCost: 15, estimatedDuration: 180, rating: 4.6, reviewCount: 1500, isPopular: true },
  { city: 'lisbon', activityName: 'Sintra Day Trip', category: 'Nature & Parks', estimatedCost: 60, estimatedDuration: 480, rating: 4.8, reviewCount: 2200, isPopular: true },
  { city: 'lisbon', activityName: 'Fado Night & Dinner', category: 'Nightlife', estimatedCost: 55, estimatedDuration: 150, rating: 4.7, reviewCount: 640 },
  { city: 'reykjavik', activityName: 'Blue Lagoon Soak', category: 'Wellness', estimatedCost: 90, estimatedDuration: 180, rating: 4.7, reviewCount: 3100, isPopular: true },
  { city: 'reykjavik', activityName: 'Northern Lights Tour', category: 'Nature & Parks', estimatedCost: 110, estimatedDuration: 240, rating: 4.9, reviewCount: 1890, isPopular: true },
  { city: 'reykjavik', activityName: 'Golden Circle Photography Tour', category: 'Photography', estimatedCost: 130, estimatedDuration: 480, rating: 4.8, reviewCount: 760 },
  { city: 'paris', activityName: 'Eiffel Tower Summit', category: 'Culture & History', estimatedCost: 28, estimatedDuration: 120, rating: 4.6, reviewCount: 5200, isPopular: true },
  { city: 'paris', activityName: 'Louvre Skip-the-Line', category: 'Culture & History', estimatedCost: 22, estimatedDuration: 180, rating: 4.7, reviewCount: 4400, isPopular: true },
  { city: 'paris', activityName: 'Le Marais Shopping Walk', category: 'Shopping', estimatedCost: 0, estimatedDuration: 120, rating: 4.4, reviewCount: 380 },
  { city: 'loire', activityName: 'Chateau de Chambord Tour', category: 'Culture & History', estimatedCost: 40, estimatedDuration: 240, rating: 4.8, reviewCount: 620, isPopular: true },
  { city: 'loire', activityName: 'Loire Valley Wine Tasting', category: 'Food & Dining', estimatedCost: 65, estimatedDuration: 180, rating: 4.9, reviewCount: 410 },
  { city: 'bangkok', activityName: 'Grand Palace & Wat Pho', category: 'Culture & History', estimatedCost: 18, estimatedDuration: 150, rating: 4.6, reviewCount: 3300, isPopular: true },
  { city: 'bangkok', activityName: 'Chatuchak Market Crawl', category: 'Shopping', estimatedCost: 0, estimatedDuration: 200, rating: 4.5, reviewCount: 1900 },
  { city: 'capetown', activityName: 'Table Mountain Cable Car', category: 'Nature & Parks', estimatedCost: 34, estimatedDuration: 150, rating: 4.8, reviewCount: 2600, isPopular: true },
  { city: 'capetown', activityName: 'Shark Cage Diving', category: 'Adventure', estimatedCost: 175, estimatedDuration: 300, rating: 4.7, reviewCount: 890 },
];

const DEMO_EMAIL = 'ananya.rao@example.com';
const DEMO_PASSWORD = 'travel2026';

/** A calendar date `days` from today, as a UTC midnight Date. */
function dayOffset(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

async function seedCatalog() {
  const categoryByName = {};
  for (const [index, categoryName] of CATEGORIES.entries()) {
    categoryByName[categoryName] = await prisma.category.upsert({
      where: { categoryName },
      update: { sortOrder: index },
      create: { categoryName, sortOrder: index },
    });
  }

  const cityByKey = {};
  for (const { key, ...city } of CITIES) {
    cityByKey[key] = await prisma.city.upsert({
      where: { cityName_countryCode: { cityName: city.cityName, countryCode: city.countryCode } },
      update: city,
      create: city,
    });
  }

  for (const { city, category, ...activity } of ACTIVITIES) {
    const cityId = cityByKey[city].id;
    const categoryId = categoryByName[category].id;

    const existing = await prisma.activity.findFirst({
      where: { cityId, activityName: activity.activityName },
    });

    if (existing) {
      await prisma.activity.update({
        where: { id: existing.id },
        data: { ...activity, cityId, categoryId, isActive: true },
      });
    } else {
      await prisma.activity.create({
        data: { ...activity, cityId, categoryId, isActive: true },
      });
    }
  }

  return { cityByKey, categoryByName };
}

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  return await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, isVerified: true, emailVerifiedAt: new Date() },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      firstName: 'Ananya',
      lastName: 'Rao',
      phone: '+91 98450 11234',
      city: 'Bengaluru',
      country: 'India',
      bio: 'Slow travel, faster itineraries.',
      preferredCurrency: 'USD',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
}

async function seedDemoTrips(user, cityByKey) {
  const existing = await prisma.trip.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log('Demo trips already exist — skipping.');
    return;
  }

  const findActivity = async (cityKey, name) =>
    await prisma.activity.findFirst({ where: { cityId: cityByKey[cityKey].id, activityName: name } });

  // ── Upcoming: Kansai Spring Loop ──────────────────────────────
  const kansai = await prisma.trip.create({
    data: {
      userId: user.id,
      tripName: 'Kansai Spring Loop',
      description: 'Kyoto temples, then eat our way through Osaka.',
      startDate: dayOffset(40),
      endDate: dayOffset(52),
      totalBudget: 4850,
      currency: 'USD',
    },
  });

  await prisma.tripBudget.create({
    data: {
      tripId: kansai.id,
      accommodationBudget: 2000,
      activitiesBudget: 1200,
      foodBudget: 900,
      transportationBudget: 550,
      miscellaneousBudget: 200,
      totalBudget: 4850,
    },
  });

  const kyotoStop = await prisma.stop.create({
    data: {
      tripId: kansai.id,
      cityId: cityByKey.kyoto.id,
      stopSequence: 1,
      startDate: dayOffset(40),
      endDate: dayOffset(44),
      notes: 'Kyoto arrival',
    },
  });

  const osakaStop = await prisma.stop.create({
    data: {
      tripId: kansai.id,
      cityId: cityByKey.osaka.id,
      stopSequence: 2,
      startDate: dayOffset(45),
      endDate: dayOffset(48),
      notes: 'Osaka food loop',
    },
  });

  const fushimi = await findActivity('kyoto', 'Fushimi Inari Hike');
  const kaiseki = await findActivity('kyoto', 'Kaiseki Tasting Menu');
  const dotonbori = await findActivity('osaka', 'Dotonbori Street Food Crawl');

  await prisma.tripActivity.createMany({
    data: [
      { tripId: kansai.id, stopId: kyotoStop.id, activityId: fushimi.id, scheduledDate: dayOffset(41), scheduledStartTime: '09:00', actualCost: 0 },
      { tripId: kansai.id, stopId: kyotoStop.id, activityId: kaiseki.id, scheduledDate: dayOffset(42), scheduledStartTime: '19:00', actualCost: 85 },
      { tripId: kansai.id, stopId: osakaStop.id, activityId: dotonbori.id, scheduledDate: dayOffset(46), scheduledStartTime: '18:30', actualCost: 45 },
    ],
    skipDuplicates: true,
  });

  // ── Past: Paris & the Loire Valley ────────────────────────────
  const paris = await prisma.trip.create({
    data: {
      userId: user.id,
      tripName: 'Paris & the Loire Valley',
      description: 'City days, then chateaux by the river.',
      startDate: dayOffset(-210),
      endDate: dayOffset(-200),
      totalBudget: 3200,
      currency: 'USD',
    },
  });

  const parisStop = await prisma.stop.create({
    data: {
      tripId: paris.id,
      cityId: cityByKey.paris.id,
      stopSequence: 1,
      startDate: dayOffset(-210),
      endDate: dayOffset(-205),
      notes: 'Paris city days',
    },
  });

  const eiffel = await findActivity('paris', 'Eiffel Tower Summit');

  await prisma.tripActivity.create({
    data: {
      tripId: paris.id,
      stopId: parisStop.id,
      activityId: eiffel.id,
      scheduledDate: dayOffset(-209),
      scheduledStartTime: '10:00',
      actualCost: 28,
      status: 'completed',
    },
  });
}

async function main() {
  const { cityByKey } = await seedCatalog();
  console.log(`Seeded ${CATEGORIES.length} categories, ${CITIES.length} cities, ${ACTIVITIES.length} activities.`);

  const user = await seedDemoUser();
  await seedDemoTrips(user, cityByKey);

  console.log(`Demo account ready — ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
