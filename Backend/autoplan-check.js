/**
 * Exercises the AI auto-planner against a throwaway account, then removes it.
 * Run with:  node -r dotenv/config autoplan-check.js
 */
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = 5097;
const BASE = `http://localhost:${PORT}/api/v1`;
let token = null;

async function call(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function run() {
  const email = `autoplan_${Date.now()}@example.test`;
  const password = 'autoplan-pass-123';

  await call('POST', '/auth/register', {
    email, password, firstName: 'Auto', lastName: 'Planner',
  });
  const otp = await prisma.otpCode.findFirst({
    where: { user: { email }, type: 'EMAIL_VERIFICATION' },
    orderBy: { createdAt: 'desc' },
  });
  const verified = await call('POST', '/auth/verify-email', { email, code: otp.code });
  token = verified.body.data.token;

  const trip = await call('POST', '/trips', {
    tripName: 'Auto-plan check', startDate: '2027-04-10', endDate: '2027-04-13',
    totalBudget: 900, currency: 'USD',
  });
  const tripId = trip.body.data.id;

  await call('PUT', `/trips/${tripId}/budget`, { activitiesBudget: 600, foodBudget: 300 });

  const cities = await call('GET', '/catalog/cities');
  const kyoto = cities.body.data.find((c) => c.cityName === 'Kyoto');

  const stop = await call('POST', `/trips/${tripId}/stops`, {
    cityId: kyoto.id, startDate: '2027-04-10', endDate: '2027-04-12', notes: 'Kyoto days',
  });
  const stopId = stop.body.data.id;

  console.log('Calling the auto-planner (OpenRouter, gpt-4o-mini)…');
  const started = process.hrtime.bigint();
  const plan = await call('POST', `/trips/${tripId}/stops/${stopId}/auto-plan`, {
    preferences: ['Culture & History', 'Food & Dining'],
    dietaryPreference: 'Vegetarian',
  });
  const seconds = Number(process.hrtime.bigint() - started) / 1e9;

  console.log(`\nstatus ${plan.status} in ${seconds.toFixed(1)}s`);
  console.log('result:', JSON.stringify(plan.body?.data ?? plan.body?.error));

  if (plan.status === 200) {
    const detail = await call('GET', `/trips/${tripId}`);
    const byDay = {};
    for (const a of detail.body.data.stops[0].activities) {
      const day = String(a.scheduledDate).slice(0, 10);
      (byDay[day] = byDay[day] || []).push({
        start: a.scheduledStartTime || '--:--',
        end: a.scheduledEndTime || '--:--',
        label: `${a.activity.activityName} ($${Number(a.actualCost)}) [${a.activity.category.categoryName}]`,
      });
    }

    console.log('\nScheduled itinerary:');
    let overlaps = 0;
    let missingEnd = 0;
    for (const [day, items] of Object.entries(byDay).sort()) {
      console.log(`  ${day}`);
      let prevEnd = -1;
      for (const it of items) {
        if (it.end === '--:--') missingEnd++;
        const [sh, sm] = it.start.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const clash = prevEnd >= 0 && startMin < prevEnd;
        if (clash) overlaps++;
        const [eh, em] = it.end.split(':').map(Number);
        prevEnd = Number.isFinite(eh) ? eh * 60 + em : prevEnd;
        console.log(`    ${it.start}-${it.end}  ${it.label}${clash ? '   <-- OVERLAP' : ''}`);
      }
    }
    console.log(`\noverlapping slots: ${overlaps} | missing end time: ${missingEnd}`);
  }

  await prisma.user.delete({ where: { email } });

  console.log('\nThrowaway account removed.');
  return plan.status === 200 ? 0 : 1;
}

const server = app.listen(PORT, async () => {
  let code = 1;
  try {
    code = await run();
  } catch (err) {
    console.error('ABORTED:', err.message);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(code);
  }
});
