/**
 * End-to-end smoke test over real HTTP against the real database.
 * Run with:  node -r dotenv/config e2e-check.js
 *
 * Exercises the full journey a user takes through the UI: register -> OTP ->
 * login -> catalog -> trip -> stops -> activities -> budget -> share -> public
 * page -> premium. Cleans up the account it creates.
 */
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = 5098;
const BASE = `http://localhost:${PORT}/api/v1`;

let token = null;
let passed = 0;
let failed = 0;

async function call(method, path, body, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}${detail ? '  — ' + detail : ''}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? '  — ' + detail : ''}`);
  }
}

function step(title) {
  console.log(`\n${title}`);
}

async function run() {
  const stamp = Date.now();
  const email = `e2e_${stamp}@example.test`;
  const password = 'e2e-password-123';

  step('1. Registration and OTP verification');
  const reg = await call('POST', '/auth/register', {
    email, password, firstName: 'Eve', lastName: 'Tester',
    phone: '+1 555 000 1234', city: 'Austin', country: 'United States',
    bio: 'Created by the e2e check.',
  }, { auth: false });
  check('register returns 201', reg.status === 201, `status ${reg.status}`);
  check('register asks for verification', reg.body?.data?.requiresVerification === true);

  const blocked = await call('POST', '/auth/login', { email, password }, { auth: false });
  check('login blocked before verifying', blocked.status === 403, `code ${blocked.body?.error?.code}`);

  const otp = await prisma.otpCode.findFirst({
    where: { user: { email }, type: 'EMAIL_VERIFICATION', isUsed: false },
    orderBy: { createdAt: 'desc' },
  });
  check('OTP row was created', Boolean(otp), otp ? `code length ${otp.code.length}` : 'none');

  const verified = await call('POST', '/auth/verify-email', { email, code: otp.code }, { auth: false });
  check('verify-email returns a token', verified.status === 200 && Boolean(verified.body?.data?.token));

  step('2. Login and profile');
  const login = await call('POST', '/auth/login', { email, password }, { auth: false });
  check('login succeeds after verification', login.status === 200, `status ${login.status}`);
  token = login.body?.data?.token;
  check('token issued', Boolean(token));

  const me = await call('GET', '/auth/me');
  check('GET /auth/me works', me.status === 200);
  check('extra registration fields persisted',
    me.body?.data?.phone === '+1 555 000 1234' && me.body?.data?.city === 'Austin',
    `phone=${me.body?.data?.phone} city=${me.body?.data?.city}`);
  check('free tier limit reported', me.body?.data?.tripLimit === 3, `limit ${me.body?.data?.tripLimit}`);

  const patched = await call('PATCH', '/auth/me', { city: 'Lisbon', preferredCurrency: 'EUR' });
  check('PATCH /auth/me updates profile',
    patched.status === 200 && patched.body?.data?.city === 'Lisbon' && patched.body?.data?.preferredCurrency === 'EUR');

  step('3. Catalog');
  const cities = await call('GET', '/catalog/cities', undefined, { auth: false });
  check('cities load', cities.status === 200 && cities.body.data.length === 8, `${cities.body?.data?.length} cities`);
  const kyoto = cities.body.data.find((c) => c.cityName === 'Kyoto');
  check('city carries derived tag + stay', Boolean(kyoto?.topCategory && kyoto?.suggestedStay),
    `Kyoto -> ${kyoto?.topCategory}, ${kyoto?.suggestedStay}`);

  const cats = await call('GET', '/catalog/categories', undefined, { auth: false });
  check('categories load', cats.status === 200 && cats.body.data.length === 9, `${cats.body?.data?.length} categories`);

  const acts = await call('GET', '/catalog/activities', undefined, { auth: false });
  // Not an exact count: the auto-planner adds AI-invented activities to the
  // shared catalog, so this only checks the 21 seeded ones are all present.
  const seededPresent = ['Fushimi Inari Hike', 'Blue Lagoon Soak', 'Shark Cage Diving']
    .every((name) => acts.body.data.some((a) => a.activityName === name));
  check('activities load', acts.status === 200 && acts.body.data.length >= 21 && seededPresent,
    `${acts.body?.data?.length} activities (21 seeded + ${acts.body.data.length - 21} AI-added)`);

  const filtered = await call('GET', `/catalog/activities?cityId=${kyoto.id}&search=Fushimi`, undefined, { auth: false });
  check('activity search + city filter works',
    filtered.body?.data?.length >= 1
      && filtered.body.data.every((a) => a.cityId === kyoto.id && /fushimi/i.test(a.activityName)),
    `${filtered.body?.data?.length} match(es), e.g. ${filtered.body?.data?.[0]?.activityName}`);

  step('4. Create a trip (dates as YYYY-MM-DD, like the date picker sends)');
  const trip = await call('POST', '/trips', {
    tripName: 'E2E Iceland Loop',
    startDate: '2027-03-02',
    endDate: '2027-03-12',
    totalBudget: 3000,
    currency: 'USD',
  });
  check('trip created', trip.status === 201, `status ${trip.status}`);
  const tripId = trip.body?.data?.id;
  check('start date stored as the same calendar day',
    String(trip.body?.data?.startDate).slice(0, 10) === '2027-03-02',
    String(trip.body?.data?.startDate).slice(0, 10));

  const reykjavik = cities.body.data.find((c) => c.cityName === 'Reykjavik');

  step('5. Stops');
  const stop = await call('POST', `/trips/${tripId}/stops`, {
    cityId: reykjavik.id,
    startDate: '2027-03-02',
    endDate: '2027-03-07',
    notes: 'Reykjavik base',
  });
  check('stop created', stop.status === 201, `status ${stop.status}`);
  const stopId = stop.body?.data?.id;
  check('stop sequence auto-assigned', stop.body?.data?.stopSequence === 1,
    `sequence ${stop.body?.data?.stopSequence}`);

  const stop2 = await call('POST', `/trips/${tripId}/stops`, {
    cityId: reykjavik.id, startDate: '2027-03-08', endDate: '2027-03-12', notes: 'Golden circle',
  });
  check('second stop gets sequence 2', stop2.body?.data?.stopSequence === 2,
    `sequence ${stop2.body?.data?.stopSequence}`);

  const renamed = await call('PATCH', `/trips/${tripId}/stops/${stopId}`, { notes: 'Reykjavik arrival' });
  check('stop can be renamed', renamed.body?.data?.notes === 'Reykjavik arrival');

  step('6. Budget');
  const budgetSaved = await call('PUT', `/trips/${tripId}/budget`, {
    accommodationBudget: 1200, activitiesBudget: 800, foodBudget: 600,
    transportationBudget: 300, miscellaneousBudget: 100,
  });
  check('budget saved', budgetSaved.status === 200);
  check('total computed from the parts', budgetSaved.body?.data?.totalBudget === 3000,
    `total ${budgetSaved.body?.data?.totalBudget}`);

  const partial = await call('PUT', `/trips/${tripId}/budget`, { foodBudget: 700 });
  check('partial save keeps other categories',
    partial.body?.data?.accommodationBudget === 1200 && partial.body?.data?.foodBudget === 700,
    `accommodation ${partial.body?.data?.accommodationBudget}, food ${partial.body?.data?.foodBudget}`);

  step('7. Scheduling activities');
  const blueLagoon = acts.body.data.find((a) => a.activityName === 'Blue Lagoon Soak');
  const scheduled = await call('POST', `/trips/${tripId}/stops/${stopId}/activities`, {
    activityId: blueLagoon.id,
    scheduledDate: '2027-03-03',
    scheduledStartTime: '10:00',
  });
  check('activity scheduled', scheduled.status === 201, `status ${scheduled.status}`);
  const rowId = scheduled.body?.data?.id;
  check('cost defaulted from the catalog', Number(scheduled.body?.data?.actualCost) === 90,
    `cost ${scheduled.body?.data?.actualCost}`);

  const dupe = await call('POST', `/trips/${tripId}/stops/${stopId}/activities`, {
    activityId: blueLagoon.id, scheduledDate: '2027-03-03',
  });
  check('duplicate on same day rejected with 409', dupe.status === 409, `status ${dupe.status}`);

  const completed = await call('PATCH', `/trips/${tripId}/stops/${stopId}/activities/${rowId}`, {
    status: 'completed', actualCost: 95,
  });
  check('activity can be marked completed', completed.body?.data?.status === 'completed');

  const budgetAfter = await call('GET', `/trips/${tripId}/budget`);
  check('completed spend feeds the budget', budgetAfter.body?.data?.actualActivitiesSpend === 95,
    `actual ${budgetAfter.body?.data?.actualActivitiesSpend}`);

  step('8. Budget-aware recommendations');
  const recs = await call('GET', `/trips/${tripId}/stops/${stopId}/recommendations/activities`);
  check('recommendations return', recs.status === 200, `${recs.body?.data?.recommendations?.length} options`);
  check('remaining budget computed', recs.body?.data?.remainingBudget === 705,
    `remaining ${recs.body?.data?.remainingBudget}`);

  step('9. Trip detail shape the UI renders');
  const detail = await call('GET', `/trips/${tripId}`);
  check('detail includes stops', detail.body?.data?.stops?.length === 2);
  check('detail includes nested activity + category',
    Boolean(detail.body?.data?.stops?.[0]?.activities?.[0]?.activity?.category?.categoryName),
    detail.body?.data?.stops?.[0]?.activities?.[0]?.activity?.category?.categoryName);
  check('detail includes budget', Boolean(detail.body?.data?.budget));

  step('10. Sharing');
  const shared = await call('POST', `/trips/${tripId}/share`, { shareType: 'public', allowCopy: true });
  check('share link created', shared.status === 201, shared.body?.data?.shareUrlSlug);
  const slug = shared.body?.data?.shareUrlSlug;
  check('slug is readable', /^e2e-iceland-loop-[0-9a-f]+$/.test(slug || ''), slug);

  const pub = await call('GET', `/public/trips/${slug}`, undefined, { auth: false });
  check('public page loads without a token', pub.status === 200);
  check('public payload hides the budget', pub.body?.data?.budget === undefined);
  check('public payload includes the owner', Boolean(pub.body?.data?.user?.firstName));

  const revoked = await call('DELETE', `/trips/${tripId}/share`);
  check('share can be revoked', revoked.status === 200);
  const gone = await call('GET', `/public/trips/${slug}`, undefined, { auth: false });
  check('revoked link 404s', gone.status === 404, `status ${gone.status}`);

  step('11. Free-tier trip limit');
  for (let i = 2; i <= 3; i++) {
    await call('POST', '/trips', {
      tripName: `E2E filler ${i}`, startDate: '2027-05-01', endDate: '2027-05-05', totalBudget: 100,
    });
  }
  const overLimit = await call('POST', '/trips', {
    tripName: 'E2E fourth trip', startDate: '2027-06-01', endDate: '2027-06-05', totalBudget: 100,
  });
  check('4th trip blocked on free tier', overLimit.status === 403, `status ${overLimit.status}`);
  check('upgrade flag returned', overLimit.body?.requiresUpgrade === true);

  step('12. Payments (Razorpay test mode)');
  const order = await call('POST', '/payment/create-order', {});
  check('order created', order.status === 200, order.body?.data?.orderId);
  check('amount is 99900 paise', order.body?.data?.amount === 99900);
  const badVerify = await call('POST', '/payment/verify', {
    razorpay_order_id: order.body?.data?.orderId,
    razorpay_payment_id: 'pay_fake',
    razorpay_signature: 'deadbeef',
  });
  check('forged signature rejected', badVerify.status >= 400, `status ${badVerify.status}`);
  const history = await call('GET', '/payment/history');
  check('payment history lists the order', history.body?.data?.length >= 1, `${history.body?.data?.length} rows`);

  step('13. Live events (Ticketmaster)');
  const events = await call('GET', `/trips/${tripId}/stops/${stopId}/events`);
  check('events endpoint responds', events.status === 200, `${Array.isArray(events.body?.data) ? events.body.data.length : '?'} events`);

  step('14. Currency conversion');
  const conv = await call('GET', '/currency/convert?amount=100&from=USD&to=INR', undefined, { auth: false });
  check('convert responds', conv.status === 200,
    conv.body?.data?.converted ? `100 USD = ${conv.body.data.result} INR` : 'key invalid — degrades to 1:1, UI hides the line');

  step('15. Authorisation boundaries');
  const noToken = await fetch(`${BASE}/trips/${tripId}`);
  check('other requests need a token', noToken.status === 401, `status ${noToken.status}`);
  const foreign = await call('GET', '/trips/1');
  check("cannot read another user's trip", foreign.status === 404, `status ${foreign.status}`);

  step('16. Cleanup');
  await prisma.user.delete({ where: { email } });
  check('test account removed', true);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  return failed;
}

const server = app.listen(PORT, async () => {
  let code = 1;
  try {
    code = await run();
  } catch (err) {
    console.error('\nE2E ABORTED:', err.message);
    console.error(err.stack);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(code === 0 ? 0 : 1);
  }
});
