const prisma = require('../src/config/prisma');

async function main() {
  // Categories
  const categories = ['Adventure', 'Food & Dining', 'Culture & History', 'Shopping', 'Nightlife', 'Nature & Parks'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { categoryName: name },
      update: {},
      create: { categoryName: name },
    });
  }

  // Cities
  const paris = await prisma.city.upsert({
    where: { cityName_countryCode: { cityName: 'Paris', countryCode: 'FR' } },
    update: {},
    create: {
      cityName: 'Paris',
      country: 'France',
      countryCode: 'FR',
      costIndex: 'High',
      popularityScore: 950,
      latitude: 48.8566,
      longitude: 2.3522,
    },
  });

  const cultureCategory = await prisma.category.findUnique({ where: { categoryName: 'Culture & History' } });

  await prisma.activity.create({
    data: {
      activityName: 'Eiffel Tower Tour',
      cityId: paris.id,
      categoryId: cultureCategory.id,
      estimatedCost: 25,
      estimatedDuration: 120,
      rating: 4.8,
      isPopular: true,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
