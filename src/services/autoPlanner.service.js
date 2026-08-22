const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const budgetService = require('./budget.service');

async function autoPlanItinerary(userId, tripId, stopId, preferences = []) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new Error('Trip not found or unauthorized');

  const stop = await prisma.stop.findFirst({ where: { id: stopId, tripId } });
  if (!stop) throw new Error('Stop not found');

  const budget = await budgetService.getTripBudget(userId, tripId);
  
  const activitiesGoal = budget.activitiesBudget ? parseFloat(budget.activitiesBudget) : 0;
  let remainingBudget = activitiesGoal - (budget.actualActivitiesSpend || 0);
  const hasBudgetLimit = activitiesGoal > 0;

  const start = new Date(stop.startDate);
  const end = new Date(stop.endDate);
  const diffTime = Math.abs(end - start);
  const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 1. Fetch City Data & Categories for dynamic insertion
  const city = await prisma.city.findUnique({ where: { id: stop.cityId } });
  const categories = await prisma.category.findMany();
  
  // Default categories to fallback on
  const foodCategory = categories.find(c => c.categoryName.toLowerCase().includes('food')) || categories[0];
  const adventureCategory = categories.find(c => c.categoryName.toLowerCase().includes('adventure')) || categories[0];
  const cultureCategory = categories.find(c => c.categoryName.toLowerCase().includes('culture')) || categories[0];

  // 2. Build the AI Prompt
  const prompt = `You are a world-class travel agent planning an itinerary for ${city.cityName}.
The user is staying for ${durationDays} days.
Their budget for activities and food is $${remainingBudget}.
Their preferences are: ${preferences.length > 0 ? preferences.join(', ') : 'General tourist attractions'}.

RULES:
1. You MUST schedule 3 meals a day (Breakfast, Lunch, Dinner) plus 1 Snack/Coffee break.
2. Suggest famous, highly-rated restaurants.
3. GEO-CLUSTER: Group activities geographically! If they visit the Eiffel Tower in the morning, their lunch and afternoon activities MUST be very close by to save cab fare and time.
4. Respond ONLY with a valid JSON array representing the itinerary. No markdown.

JSON SCHEMA:
[
  {
    "day": 1,
    "activities": [
      {
        "name": "Café de l'Homme",
        "type": "Food", // Use "Food", "Adventure", or "Culture"
        "cost": 25.00, // Estimated cost in USD
        "durationHours": 1.5,
        "startTime": "08:30" // HH:MM format
      }
    ]
  }
]`;

  const aiKey = process.env.OPENROUTER_API_KEY;
  if (!aiKey || aiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY is not set. Cannot auto-plan without AI.');
  }

  // 3. Ping OpenRouter
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const aiData = await res.json();
  if (!aiData.choices || aiData.choices.length === 0) {
    throw new Error('AI failed to generate itinerary');
  }

  const content = aiData.choices[0].message.content.trim();
  const cleanContent = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
  let aiItinerary;
  try {
    aiItinerary = JSON.parse(cleanContent);
  } catch (e) {
    throw new Error('AI returned invalid JSON');
  }

  // 4. Parse AI Itinerary and Create Missing Activities in DB
  const plannedActivities = [];
  let activitiesScheduledCount = 0;

  for (const dayPlan of aiItinerary) {
    const currentDay = new Date(start);
    currentDay.setDate(currentDay.getDate() + (dayPlan.day - 1));

    for (const act of dayPlan.activities) {
      // Check if activity exists in our DB
      let dbActivity = await prisma.activity.findFirst({
        where: { cityId: stop.cityId, activityName: act.name }
      });

      // Create it if it doesn't exist!
      if (!dbActivity) {
        let catId = cultureCategory.id;
        if (act.type === 'Food') catId = foodCategory.id;
        if (act.type === 'Adventure') catId = adventureCategory.id;

        dbActivity = await prisma.activity.create({
          data: {
            activityName: act.name,
            cityId: stop.cityId,
            categoryId: catId,
            estimatedCost: act.cost,
            estimatedDuration: Math.round(act.durationHours * 60),
            rating: 4.5, // Default AI rating
            isActive: true
          }
        });
      }

      // Schedule it
      plannedActivities.push({
        tripId,
        stopId,
        activityId: dbActivity.id,
        scheduledDate: currentDay,
        scheduledStartTime: act.startTime,
        actualCost: act.cost
      });
      
      activitiesScheduledCount++;
      remainingBudget -= act.cost;
    }
  }

  // 5. Save to TripActivity
  if (plannedActivities.length > 0) {
    await prisma.tripActivity.deleteMany({ where: { tripId, stopId } }); // Clear previous
    await prisma.tripActivity.createMany({ data: plannedActivities });
  }

  return {
    daysPlanned: durationDays,
    activitiesScheduled: activitiesScheduledCount,
    remainingBudget: hasBudgetLimit ? remainingBudget : 'No limit',
    aiSource: true
  };
}

module.exports = { autoPlanItinerary };
