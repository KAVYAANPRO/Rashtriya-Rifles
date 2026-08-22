const prisma = require('../config/prisma');
const budgetService = require('./budget.service');
const { OPENROUTER_MODEL, AI_TIMEOUT_MS } = require('../config/ai');
const { parseAiJson } = require('../utils/aiJson');
const { buildDaySchedule } = require('../utils/schedule');

async function autoPlanItinerary(userId, tripId, stopId, preferences = [], dietaryPreference = 'Any') {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    const err = new Error('Trip not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  const stop = await prisma.stop.findFirst({ where: { id: stopId, tripId } });
  if (!stop) {
    const err = new Error('Stop not found');
    err.statusCode = 404;
    throw err;
  }

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
Their general preferences are: ${preferences.length > 0 ? preferences.join(', ') : 'General tourist attractions'}.
Their dietary preference is: ${dietaryPreference}.

RULES:
1. Produce EXACTLY ${durationDays} day object(s), numbered 1 to ${durationDays}. Never invent extra days.
2. You MUST schedule 3 meals a day (Breakfast, Lunch, Dinner) plus 1 Snack/Coffee break.
3. Suggest famous, highly-rated restaurants. ALL recommended food and restaurants MUST strictly adhere to their dietary preference (${dietaryPreference}).
4. GEO-CLUSTER: Group activities geographically! If they visit the Eiffel Tower in the morning, their lunch and afternoon activities MUST be very close by to save cab fare and time.
5. TIMING - this matters as much as the choices:
   - Every activity needs "startTime" AND "endTime" in 24-hour HH:MM.
   - List each day in chronological order, earliest first.
   - Activities MUST NOT overlap. Leave at least 15 minutes between one ending and the next starting, for travel.
   - Keep the day between 08:00 and 23:30.
   - Anchor meals realistically: breakfast 08:00-09:30, lunch 12:00-14:00, a coffee or snack mid-afternoon, dinner 19:00-21:00.
   - "durationHours" must agree with startTime and endTime.
6. Respond ONLY with a valid JSON array representing the itinerary. No markdown.

JSON SCHEMA:
[
  {
    "day": 1,
    "activities": [
      {
        "name": "Café de l'Homme",
        "type": "Food",
        "cost": 25.00,
        "durationHours": 1.5,
        "startTime": "08:30",
        "endTime": "10:00"
      }
    ]
  }
]`;

  const aiKey = process.env.OPENROUTER_API_KEY;
  if (!aiKey || aiKey === 'your_openrouter_api_key_here') {
    const err = new Error('Auto-planning needs an AI key. Add OPENROUTER_API_KEY to the backend .env file.');
    err.statusCode = 503;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  // 3. Ping OpenRouter
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiKey}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const aiData = await res.json();
  if (!aiData.choices || aiData.choices.length === 0) {
    const err = new Error(aiData.error?.message || 'AI failed to generate itinerary');
    err.statusCode = 502;
    throw err;
  }

  const content = aiData.choices[0].message.content.trim();
  let aiItinerary;
  try {
    aiItinerary = parseAiJson(content, 'The auto-planner');
  } catch (e) {
    const err = new Error('AI returned an itinerary we could not read. Please try again.');
    err.statusCode = 502;
    throw err;
  }

  // 4. Turn the reply into a real timetable, then create any missing catalog
  //    entries. The model is never trusted for day numbers or clock times.
  const plannedActivities = [];
  let activitiesScheduledCount = 0;
  let droppedCount = 0;
  const dayBreakdown = [];

  // Only keep days that actually fall inside this stop, and merge duplicates.
  const byDay = new Map();
  for (const dayPlan of Array.isArray(aiItinerary) ? aiItinerary : []) {
    const dayNumber = Math.round(Number(dayPlan?.day));
    if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > durationDays) {
      droppedCount += (dayPlan?.activities || []).length;
      continue;
    }
    const list = byDay.get(dayNumber) || [];
    list.push(...(dayPlan.activities || []).filter((a) => a && typeof a.name === 'string' && a.name.trim()));
    byDay.set(dayNumber, list);
  }

  for (const dayNumber of [...byDay.keys()].sort((a, b) => a - b)) {
    const currentDay = new Date(start);
    currentDay.setDate(currentDay.getDate() + (dayNumber - 1));

    const { scheduled, overflow } = buildDaySchedule(byDay.get(dayNumber));
    droppedCount += overflow.length;

    // A venue can only be booked once per day (unique index on trip+activity+date).
    const usedToday = new Set();

    for (const act of scheduled) {
      const cost = Number.isFinite(Number(act.cost)) ? Math.max(0, Number(act.cost)) : 0;

      let dbActivity = await prisma.activity.findFirst({
        where: { cityId: stop.cityId, activityName: act.name }
      });

      if (!dbActivity) {
        let catId = cultureCategory.id;
        if (act.type === 'Food') catId = foodCategory.id;
        if (act.type === 'Adventure') catId = adventureCategory.id;

        dbActivity = await prisma.activity.create({
          data: {
            activityName: act.name,
            cityId: stop.cityId,
            categoryId: catId,
            estimatedCost: cost,
            estimatedDuration: act.durationMinutes,
            rating: 4.5, // Default AI rating
            isActive: true
          }
        });
      }

      if (usedToday.has(dbActivity.id)) {
        droppedCount++;
        continue;
      }
      usedToday.add(dbActivity.id);

      plannedActivities.push({
        tripId,
        stopId,
        activityId: dbActivity.id,
        scheduledDate: currentDay,
        scheduledStartTime: act.startTime,
        scheduledEndTime: act.endTime,
        actualCost: cost
      });

      activitiesScheduledCount++;
      remainingBudget -= cost;
    }

    dayBreakdown.push({
      day: dayNumber,
      date: currentDay.toISOString().slice(0, 10),
      activities: scheduled.length,
      firstStart: scheduled[0]?.startTime || null,
      lastEnd: scheduled[scheduled.length - 1]?.endTime || null,
    });
  }


  // 5. Save to TripActivity
  if (plannedActivities.length > 0) {
    await prisma.tripActivity.deleteMany({ where: { tripId, stopId } }); // Clear previous
    // The AI can propose the same venue twice in a day; the unique index on
    // (tripId, activityId, scheduledDate) would reject the whole batch.
    await prisma.tripActivity.createMany({ data: plannedActivities, skipDuplicates: true });
  }

  return {
    daysPlanned: dayBreakdown.length || durationDays,
    stopDays: durationDays,
    activitiesScheduled: activitiesScheduledCount,
    droppedCount,
    days: dayBreakdown,
    remainingBudget: hasBudgetLimit ? remainingBudget : null,
    hasBudgetLimit,
    aiSource: true
  };
}

module.exports = { autoPlanItinerary };
