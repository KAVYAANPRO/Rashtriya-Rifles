# GlobeTrotter Backend — Build Instructions

> Follow these steps **in order**. Each step produces a working, testable piece of the backend before moving to the next. Stack: **Node.js + Express + Prisma + MySQL + Redis**.

---

## Step 0: Prerequisites

Confirm these are installed before starting:

```bash
node -v      # v18+ required
npm -v
docker -v    # for local MySQL + Redis
```

If Docker isn't available, install MySQL 8 locally instead and adjust `DATABASE_URL` accordingly in Step 2.

---

## Step 1: Project Scaffold

```bash
mkdir globetrotter-backend && cd globetrotter-backend
npm init -y

npm install express prisma @prisma/client mysql2 bcryptjs jsonwebtoken zod dotenv cors ioredis express-rate-limit rate-limit-redis morgan winston
npm install --save-dev nodemon jest supertest

npx prisma init --datasource-provider mysql
```

Create this folder structure:

```
globetrotter-backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── config/
│   │   ├── prisma.js
│   │   └── redis.js
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── validate.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── slugify.js
│   └── app.js
├── tests/
├── .env
├── .env.example
├── docker-compose.yml
├── package.json
└── server.js
```

**Checkpoint**: `npm install` completes with no errors.

---

## Step 2: Local Infrastructure (Docker)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: globetrotter_db
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7
    ports:
      - '6379:6379'

volumes:
  mysql_data:
```

Start it:

```bash
docker compose up -d
docker compose ps   # confirm both containers show "Up"
```

Create `.env.example` and copy it to `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/globetrotter_db"
PORT=5000
NODE_ENV=development
JWT_SECRET=replace_with_a_32plus_character_random_secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

```bash
cp .env.example .env
```

**Checkpoint**: `docker compose ps` shows `mysql` and `redis` both running and healthy.

---

## Step 3: Database Schema

Replace the contents of `prisma/schema.prisma` with the full schema (10 models: User, UserPreference, Trip, Stop, City, Category, Activity, TripActivity, TripBudget, TripShare) — copy this from `GlobeTrotter_Backend_PRD_Prisma.md` Section 2.2 exactly as written there. Do not hand-write your own tables; this file is the source of truth.

Run the first migration:

```bash
npx prisma migrate dev --name init
```

This will:
1. Create all tables in MySQL
2. Generate Prisma Client (typed query functions)

Verify visually:

```bash
npx prisma studio
```

Open the browser window it opens and confirm all 10 tables exist with the correct columns.

**Checkpoint**: `npx prisma studio` shows all 10 tables, empty but structured correctly.

---

## Step 4: Seed Data

Create `prisma/seed.js` (copy from PRD Section 4) with:
- 6+ categories (Adventure, Food & Dining, Culture & History, Shopping, Nightlife, Nature & Parks)
- At least 20 cities across different countries
- At least 100 activities spread across those cities

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

Run it:

```bash
npx prisma db seed
```

**Checkpoint**: Reopen `npx prisma studio` — `cities`, `categories`, and `activities` tables have rows.

---

## Step 5: Core Config Files

**`src/config/prisma.js`**:
```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
```

**`src/config/redis.js`**:
```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => console.error('Redis error:', err));

module.exports = redis;
```

**Checkpoint**: These files export without throwing when required from a test script.

---

## Step 6: Utilities

**`src/utils/password.js`**:
```javascript
const bcrypt = require('bcryptjs');

exports.hashPassword = (plain) => bcrypt.hash(plain, 10);
exports.comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
```

**`src/utils/jwt.js`**:
```javascript
const jwt = require('jsonwebtoken');

exports.signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
```

**`src/utils/slugify.js`**:
```javascript
const crypto = require('crypto');

exports.slugify = (text) => {
  const base = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
};
```

---

## Step 7: Middleware

**`src/middleware/errorHandler.js`**:
```javascript
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong',
      statusCode,
    },
  });
};
```

**`src/middleware/authenticate.js`**:
```javascript
const { verifyToken } = require('../utils/jwt');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  try {
    const payload = verifyToken(header.split(' ')[1]);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};
```

**`src/middleware/validate.js`**:
```javascript
module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message, statusCode: 422 },
    });
  }
  req.body = result.data;
  next();
};
```

**`src/middleware/rateLimiter.js`**:
```javascript
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Checkpoint**: No syntax errors when the app imports all middleware.

---

## Step 8: Auth Module (Feature Slice 1)

Build in this order and test each with `curl` or Postman before moving on:

1. **`src/services/auth.service.js`** — `registerUser`, `loginUser`, `refreshToken`
2. **`src/controllers/auth.controller.js`** — thin wrappers calling the service, catching errors with `next(err)`
3. **`src/routes/auth.routes.js`**:
   ```javascript
   const router = require('express').Router();
   const ctrl = require('../controllers/auth.controller');
   const validate = require('../middleware/validate');
   const { registerSchema, loginSchema } = require('../schemas/auth.schema');

   router.post('/register', validate(registerSchema), ctrl.register);
   router.post('/login', validate(loginSchema), ctrl.login);
   router.post('/refresh-token', ctrl.refresh);

   module.exports = router;
   ```
4. Create `src/schemas/auth.schema.js` with Zod schemas for register/login (email format, password min 8 chars).

**Test manually**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","firstName":"Test","lastName":"User"}'

curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

**Checkpoint**: Register returns 201 with `userId`. Login returns 200 with a JWT `accessToken`. Save that token — you'll use it for every step below.

---

## Step 9: Trips Module (Feature Slice 2)

Build:
1. `src/schemas/trip.schema.js` — Zod schema validating `tripName`, `startDate`, `endDate` (endDate > startDate), `totalBudget`
2. `src/services/trips.service.js` — `createTrip`, `listTrips`, `getTripDetails`, `updateTrip`, `deleteTrip`, `duplicateTrip`
3. `src/controllers/trips.controller.js`
4. `src/routes/trips.routes.js` — mount under `authenticate` middleware

Register the route in `src/app.js`:
```javascript
app.use('/api/v1/trips', require('./routes/trips.routes'));
```

**Test manually** (replace `$TOKEN` with your saved token):
```bash
curl -X POST http://localhost:5000/api/v1/trips \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tripName":"Europe 2024","startDate":"2026-07-01","endDate":"2026-07-20","totalBudget":5000}'

curl http://localhost:5000/api/v1/trips -H "Authorization: Bearer $TOKEN"
```

**Checkpoint**: Trip creation returns 201. Listing trips returns the trip you just created. Verify in Prisma Studio that a matching `trip_budgets` row was also created.

---

## Step 10: Stops Module (Feature Slice 3)

Build:
1. `src/schemas/stop.schema.js` — validate `cityId`, `startDate`, `endDate`
2. `src/services/stops.service.js`:
   - `addStop` — **must validate**: stop dates fall within parent trip's dates, and no overlap with existing stops for that trip
   - `updateStop`, `deleteStop`, `reorderStops`
3. `src/controllers/stops.controller.js`
4. `src/routes/stops.routes.js` — nested under trips: `/api/v1/trips/:tripId/stops`

**Test manually**:
```bash
curl -X POST http://localhost:5000/api/v1/trips/1/stops \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"cityId":1,"startDate":"2026-07-01","endDate":"2026-07-07"}'
```

**Checkpoint**: Stop is created and linked to the trip. Attempting a stop with dates outside the trip range returns a 422 validation error.

---

## Step 11: Activities Module (Feature Slice 4)

Build:
1. `src/services/activities.service.js`:
   - `searchActivities` (filter by cityId, category, cost range) — **no auth required**
   - `addActivityToStop`, `updateTripActivity`, `removeTripActivity`
2. `src/controllers/activities.controller.js`
3. `src/routes/activities.routes.js`:
   - `GET /api/v1/activities/search` — public
   - `POST /api/v1/trips/:tripId/stops/:stopId/activities` — authenticated
   - `PUT|DELETE /api/v1/trips/:tripId/activities/:tripActivityId` — authenticated

**Checkpoint**: Searching activities by `cityId=1` returns seeded activities. Adding one to a stop creates a `trip_activities` row.

---

## Step 12: Cities Module (Feature Slice 5)

Build:
1. `src/services/cities.service.js` — `searchCities`, `getPopularCities`, `getCityDetails` (all public, no auth)
2. `src/controllers/cities.controller.js`
3. `src/routes/cities.routes.js`

Add Redis caching here (first place it matters):
```javascript
async function getPopularCities() {
  const cached = await redis.get('cities:popular');
  if (cached) return JSON.parse(cached);

  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { popularityScore: 'desc' },
    take: 10,
  });

  await redis.set('cities:popular', JSON.stringify(cities), 'EX', 60 * 60 * 24);
  return cities;
}
```

**Checkpoint**: `GET /api/v1/cities/popular` returns seeded cities, second call is served from cache (add a temporary `console.log` to confirm cache hit).

---

## Step 13: Budget Module (Feature Slice 6)

Build:
1. `src/services/budget.service.js` — `getBudgetSummary` (aggregate `trip_activities.actualCost`, fall back to `activity.estimatedCost`), `updateBudget`
2. `src/controllers/budget.controller.js`
3. `src/routes/budget.routes.js` — `/api/v1/trips/:tripId/budget`

**Checkpoint**: Budget summary returns `totalBudget`, `estimatedTotal`, and `remaining`, matching manual math from the activities you added in Step 11.

---

## Step 14: Sharing Module (Feature Slice 7)

Build:
1. `src/services/sharing.service.js`:
   - `createShare` — generate slug via `slugify()`, ensure uniqueness
   - `getPublicTrip` — **no auth**, only returns trip if `isPublic` or a valid, non-expired share exists
   - `copyPublicTrip` — deep-copies trip + stops + activities to the requesting user's account
2. `src/controllers/sharing.controller.js`
3. `src/routes/sharing.routes.js`

**Checkpoint**: Sharing a trip returns a URL slug. Fetching `/api/v1/trips/public/:slug` works **without** an Authorization header. Copying it as a different user creates a fully independent new trip.

---

## Step 15: Wire Up `app.js` and `server.js`

**`src/app.js`**:
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/trips', require('./routes/trips.routes'));
app.use('/api/v1/trips/:tripId/stops', require('./routes/stops.routes'));
app.use('/api/v1/trips/:tripId/activities', require('./routes/activities.routes'));
app.use('/api/v1/activities', require('./routes/activities.routes'));
app.use('/api/v1/cities', require('./routes/cities.routes'));
app.use('/api/v1/trips/:tripId/budget', require('./routes/budget.routes'));
app.use('/api/v1/trips', require('./routes/sharing.routes'));

app.use(errorHandler);

module.exports = app;
```

> Note: Express doesn't merge params across separately-mounted routers by default — use `mergeParams: true` on any `express.Router()` that needs `:tripId` from a parent path (stops, activities, budget, sharing routers all need this).

**`server.js`**:
```javascript
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`GlobeTrotter API running on port ${PORT}`));
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "postinstall": "prisma generate",
    "migrate": "prisma migrate deploy",
    "test": "jest --runInBand"
  }
}
```

**Checkpoint**: `npm run dev` starts without errors. `curl http://localhost:5000/health` returns `{"status":"ok"}`.

---

## Step 16: End-to-End Smoke Test

Run this full sequence manually (or script it) to confirm every module works together:

1. Register → Login → save token
2. Create a trip
3. Add 2 stops to it
4. Search activities for one stop's city
5. Add 2 activities to a stop
6. Get full trip details (`GET /trips/:tripId`) — confirm stops + activities appear nested
7. Get budget summary — confirm it reflects the added activities
8. Create a share link
9. Fetch the public trip **without** auth
10. Delete the trip — confirm cascading delete removed stops/activities/budget (check Prisma Studio)

**Checkpoint**: All 10 steps succeed without manual database fixes.

---

## Step 17: Automated Tests

Create a **separate test database**:
```env
# .env.test
DATABASE_URL="mysql://root:password@localhost:3306/globetrotter_test_db"
```

Write at least one integration test per module in `tests/` (auth, trips, stops, activities, cities, budget, sharing) using Jest + Supertest, following the pattern in the PRD Section 12.

```bash
NODE_ENV=test npx prisma migrate deploy
NODE_ENV=test npm test
```

**Checkpoint**: All tests pass locally.

---

## Step 18: Final Checklist Before Handing to Frontend

- [ ] `npm run dev` boots cleanly from a fresh clone (`docker compose up -d && npm install && npx prisma migrate dev && npx prisma db seed && npm run dev`)
- [ ] Every endpoint from the API spec returns the standard `{ success, data }` / `{ success, error }` shape
- [ ] All write endpoints validate input with Zod and return 422 on bad input
- [ ] All protected endpoints return 401 without a valid token
- [ ] `.env.example` is up to date and `.env` is git-ignored
- [ ] README (or this file) documents the exact setup commands for a new teammate
- [ ] Postman collection or a simple `requests.http` file exists so the frontend team can test endpoints without reading code

---

## Reference

Full schema, business rules, and detailed API contracts live in `GlobeTrotter_Backend_PRD_Prisma.md` — treat that as the spec, and this file as the execution order.
