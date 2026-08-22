/**
 * Boots the API on a spare port and pings every route so you can confirm the
 * whole surface is mounted. Run with:  node -r dotenv/config probe-routes.js
 *
 * 200/401/404/422 mean the route exists and behaved. 500 on a DB-backed route
 * usually means DATABASE_URL is wrong.
 */
const app = require('./src/app');

const PROBES = [
  ['GET', '/health'],
  ['GET', '/api/v1/health'],
  ['GET', '/api/v1/catalog/cities'],
  ['GET', '/api/v1/catalog/cities/1'],
  ['GET', '/api/v1/catalog/categories'],
  ['GET', '/api/v1/catalog/activities'],
  ['GET', '/api/v1/currency/supported'],
  ['GET', '/api/v1/currency/convert?amount=100&from=USD&to=INR'],
  ['POST', '/api/v1/auth/register'],
  ['POST', '/api/v1/auth/login'],
  ['POST', '/api/v1/auth/verify-email'],
  ['POST', '/api/v1/auth/resend-otp'],
  ['POST', '/api/v1/auth/google-login'],
  ['POST', '/api/v1/auth/forgot-password'],
  ['POST', '/api/v1/auth/reset-password'],
  ['POST', '/api/v1/auth/refresh-token'],
  ['GET', '/api/v1/auth/me'],
  ['PATCH', '/api/v1/auth/me'],
  ['GET', '/api/v1/trips'],
  ['POST', '/api/v1/trips'],
  ['GET', '/api/v1/trips/1'],
  ['PATCH', '/api/v1/trips/1'],
  ['DELETE', '/api/v1/trips/1'],
  ['GET', '/api/v1/trips/1/stops'],
  ['POST', '/api/v1/trips/1/stops'],
  ['GET', '/api/v1/trips/1/stops/1'],
  ['PATCH', '/api/v1/trips/1/stops/1'],
  ['DELETE', '/api/v1/trips/1/stops/1'],
  ['GET', '/api/v1/trips/1/stops/1/activities'],
  ['POST', '/api/v1/trips/1/stops/1/activities'],
  ['PATCH', '/api/v1/trips/1/stops/1/activities/1'],
  ['DELETE', '/api/v1/trips/1/stops/1/activities/1'],
  ['GET', '/api/v1/trips/1/stops/1/recommendations/activities'],
  ['GET', '/api/v1/trips/1/stops/1/events'],
  ['POST', '/api/v1/trips/1/stops/1/auto-plan'],
  ['GET', '/api/v1/trips/1/budget'],
  ['PUT', '/api/v1/trips/1/budget'],
  ['GET', '/api/v1/trips/1/share'],
  ['POST', '/api/v1/trips/1/share'],
  ['DELETE', '/api/v1/trips/1/share'],
  ['GET', '/api/v1/public/trips/some-slug'],
  ['GET', '/api/v1/flights/search?origin=JFK&destination=CDG&date=2026-10-01'],
  ['GET', '/api/v1/hotels/search?city=Paris&checkIn=2026-10-01&checkOut=2026-10-05'],
  ['GET', '/api/v1/transport/search?city=Paris'],
  ['POST', '/api/v1/payment/create-order'],
  ['POST', '/api/v1/payment/verify'],
  ['GET', '/api/v1/payment/history'],
  ['GET', '/api/v1/definitely-not-a-route'],
];

const PORT = Number(process.env.PROBE_PORT) || 5099;

const server = app.listen(PORT, async () => {
  const base = `http://localhost:${PORT}`;
  let mounted = 0;

  for (const [method, path] of PROBES) {
    try {
      const res = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: ['POST', 'PATCH', 'PUT'].includes(method) ? '{}' : undefined,
      });
      const body = (await res.text()).slice(0, 70).replace(/\s+/g, ' ');
      const routed = res.status !== 404 || path.includes('definitely-not');
      if (routed) mounted++;
      console.log(
        `${routed ? 'OK ' : 'MISS'} ${String(res.status).padEnd(4)}${method.padEnd(7)}${path.padEnd(60)}${body}`,
      );
    } catch (err) {
      console.log(`ERR      ${method.padEnd(7)}${path.padEnd(60)}${err.message}`);
    }
  }

  console.log(`\n${mounted}/${PROBES.length} routes resolved.`);
  server.close();
  process.exit(0);
});
