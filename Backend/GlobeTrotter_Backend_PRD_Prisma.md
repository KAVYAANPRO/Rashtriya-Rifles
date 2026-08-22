# GlobeTrotter - Backend-First PRD (Node.js + Prisma + MySQL)

## Executive Summary

This document is the backend engineering source of truth for GlobeTrotter, built with **Node.js**, **Prisma ORM**, and **MySQL**. It covers architecture, the complete Prisma schema, API specifications, business logic, and operational requirements.

---

## 1. Backend Architecture Overview

### 1.1 Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Runtime** | Node.js 18+ (LTS) | Async I/O, huge ecosystem, fast to build with |
| **Framework** | Express.js | Lightweight, flexible, minimal boilerplate |
| **ORM** | **Prisma** | Type-safe queries, auto-migrations, no raw SQL needed, great DX for MySQL beginners |
| **Database** | MySQL 8.0+ | Relational, ACID compliant, widely supported |
| **Validation** | Zod / Joi | Schema validation for request bodies |
| **Caching** | Redis (ioredis) | Session/rate-limit/query caching |
| **Auth** | JWT (jsonwebtoken) + bcrypt | Stateless, industry standard |
| **File Storage** | AWS S3 / Cloudinary | Scalable image/file storage |
| **API Style** | RESTful (JSON) | Simple, well understood, easy for frontend team |
| **Logging** | Winston + Morgan | Structured logs, request tracing |
| **Testing** | Jest + Supertest | Unit + integration + API testing |
| **Containerization** | Docker + docker-compose | Local MySQL + Redis + app in one command |

### 1.2 Why Prisma (for a team new to MySQL)

Prisma removes the need to hand-write SQL for day-to-day work:

- **`schema.prisma`** is a single readable file that defines your entire database — no separate `CREATE TABLE` scripts to maintain by hand.
- **`npx prisma migrate dev`** auto-generates and runs SQL migrations from schema changes.
- **Prisma Client** gives you fully-typed JS functions (`prisma.trip.findMany(...)`) instead of writing SQL strings — this prevents most SQL injection risk automatically.
- **Prisma Studio** (`npx prisma studio`) gives you a visual GUI to browse/edit MySQL data without needing to know SQL.
- Relations (`Trip.stops`, `Stop.activities`) are just JS object properties — Prisma handles the JOINs internally.

You still get real MySQL underneath (for performance, hosting, backups), you just don't have to write raw SQL to use it.

### 1.3 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React / Vite)                  │
└────────────────┬──────────────────────────────────────��─┘
                 │ HTTPS/JSON
                 ▼
┌─────────────────────────────────────────────────────────┐
│          Node.js + Express API (REST, /api/v1)           │
│   Controllers → Services → Prisma Client → MySQL         │
└────────────────┬───────────────────────┬──────────────��─┘
                 │                       │
                 ▼                       ▼
          ┌─────────────┐         ┌─────────────┐
          │   MySQL 8    │         │    Redis     │
          │ (via Prisma) │         │  (caching)   │
          └─────────────┘         └─────────────┘
                 │
                 ▼
          ┌─────────────┐
          │  AWS S3 /    │
          │  Cloudinary  │
          └─────────────┘
```

### 1.4 Project Folder Structure

```
globetrotter-backend/
├── prisma/
│   ├── schema.prisma        # Full DB schema (source of truth)
│   ├── migrations/          # Auto-generated SQL migration history
│   └── seed.js              # Seed script (cities, categories, activities)
├── src/
│   ├── config/
│   │   ├── prisma.js        # Prisma Client singleton
│   │   └── redis.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── trips.controller.js
│   │   ├── stops.controller.js
│   │   ├── activities.controller.js
│   │   ├── cities.controller.js
│   │   └── budget.controller.js
│   ├── services/            # Business logic (calls Prisma)
│   │   ├── auth.service.js
│   │   ├── trips.service.js
│   │   └── budget.service.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── trips.routes.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── authenticate.js  # JWT verification
│   │   ├── validate.js      # Zod schema validation
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

---

## 2. Database Schema (Prisma)

### 2.1 Setup Commands

```bash
# 1. Install dependencies
npm install express prisma @prisma/client mysql2 bcryptjs jsonwebtoken zod dotenv cors ioredis
npm install --save-dev nodemon

# 2. Initialize Prisma
npx prisma init --datasource-provider mysql

# 3. Set DATABASE_URL in .env
# DATABASE_URL="mysql://root:password@localhost:3306/globetrotter_db"

# 4. After writing schema.prisma, run migration
npx prisma migrate dev --name init

# 5. Generate Prisma Client (auto-runs after migrate, but can run manually)
npx prisma generate

# 6. Seed the database
npx prisma db seed

# 7. Open visual DB browser (optional but great for beginners)
npx prisma studio
```

### 2.2 Complete `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────
// USERS & AUTH
// ──────────────────────────────

model User {
  id                  Int       @id @default(autoincrement()) @map("user_id")
  email               String    @unique @db.VarChar(100)
  passwordHash        String    @map("password_hash") @db.VarChar(255)
  firstName           String    @map("first_name") @db.VarChar(50)
  lastName            String    @map("last_name") @db.VarChar(50)
  profilePictureUrl   String?   @map("profile_picture_url") @db.VarChar(255)
  bio                 String?   @db.Text
  preferredCurrency   String    @default("USD") @map("preferred_currency") @db.VarChar(3)
  languagePreference  String    @default("en") @map("language_preference") @db.VarChar(10)
  isActive            Boolean   @default(true) @map("is_active")
  isVerified          Boolean   @default(false) @map("is_verified")
  emailVerifiedAt     DateTime? @map("email_verified_at")
  lastLoginAt         DateTime? @map("last_login_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  trips               Trip[]
  preferences         UserPreference?
  sharedByMe          TripShare[] @relation("SharedBy")
  sharedWithMe        TripShare[] @relation("SharedWith")

  @@index([email])
  @@index([isActive])
  @@index([createdAt])
  @@map("users")
}

model UserPreference {
  id                          Int      @id @default(autoincrement()) @map("preference_id")
  userId                      Int      @unique @map("user_id")
  emailNotificationsEnabled   Boolean  @default(true) @map("email_notifications_enabled")
  newsletterSubscribed        Boolean  @default(false) @map("newsletter_subscribed")
  theme                       String   @default("auto") @db.VarChar(10)
  privacyLevel                String   @default("private") @map("privacy_level") @db.VarChar(20)
  createdAt                   DateTime @default(now()) @map("created_at")
  updatedAt                   DateTime @updatedAt @map("updated_at")

  user                        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

// ──────────────────────────────
// TRIPS
// ──────────────────────────────

model Trip {
  id               Int       @id @default(autoincrement()) @map("trip_id")
  userId           Int       @map("user_id")
  tripName         String    @map("trip_name") @db.VarChar(150)
  description      String?   @db.Text
  startDate        DateTime  @map("start_date") @db.Date
  endDate          DateTime  @map("end_date") @db.Date
  coverImageUrl    String?   @map("cover_image_url") @db.VarChar(255)
  totalBudget      Decimal?  @map("total_budget") @db.Decimal(12, 2)
  currency         String    @default("USD") @db.VarChar(3)
  isPublic         Boolean   @default(false) @map("is_public")
  isArchived       Boolean   @default(false) @map("is_archived")
  publicUrlSlug    String?   @unique @map("public_url_slug") @db.VarChar(100)
  viewCount        Int       @default(0) @map("view_count")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  stops            Stop[]
  budget           TripBudget?
  shares           TripShare[]

  @@index([userId])
  @@index([startDate])
  @@index([isPublic])
  @@index([publicUrlSlug])
  @@map("trips")
}

model Stop {
  id                    Int      @id @default(autoincrement()) @map("stop_id")
  tripId                Int      @map("trip_id")
  cityId                Int      @map("city_id")
  stopSequence          Int      @map("stop_sequence")
  startDate             DateTime @map("start_date") @db.Date
  endDate               DateTime @map("end_date") @db.Date
  accommodationBudget   Decimal? @map("accommodation_budget") @db.Decimal(10, 2)
  notes                 String?  @db.Text
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  trip                  Trip           @relation(fields: [tripId], references: [id], onDelete: Cascade)
  city                  City           @relation(fields: [cityId], references: [id])
  activities            TripActivity[]

  @@unique([tripId, stopSequence])
  @@index([tripId])
  @@index([cityId])
  @@map("stops")
}

// ──────────────────────────────
// CITIES & ACTIVITIES (catalog data)
// ──────────────────────────────

model City {
  id                Int      @id @default(autoincrement()) @map("city_id")
  cityName          String   @map("city_name") @db.VarChar(100)
  country           String   @db.VarChar(100)
  countryCode       String   @map("country_code") @db.VarChar(2)
  costIndex         String   @default("Medium") @map("cost_index") @db.VarChar(10) // Low | Medium | High
  popularityScore   Int      @default(0) @map("popularity_score")
  imageUrl          String?  @map("image_url") @db.VarChar(255)
  latitude          Decimal? @db.Decimal(10, 8)
  longitude         Decimal? @db.Decimal(11, 8)
  description       String?  @db.Text
  isActive          Boolean  @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at")

  stops             Stop[]
  activities        Activity[]

  @@unique([cityName, countryCode])
  @@index([countryCode])
  @@index([costIndex])
  @@index([popularityScore])
  @@map("cities")
}

model Category {
  id             Int    @id @default(autoincrement()) @map("category_id")
  categoryName   String @unique @map("category_name") @db.VarChar(50)
  description    String? @db.VarChar(200)
  iconUrl        String? @map("icon_url") @db.VarChar(255)
  sortOrder      Int    @default(0) @map("sort_order")

  activities     Activity[]

  @@map("categories")
}

model Activity {
  id                  Int      @id @default(autoincrement()) @map("activity_id")
  activityName        String   @map("activity_name") @db.VarChar(150)
  cityId              Int      @map("city_id")
  categoryId          Int      @map("category_id")
  description         String?  @db.Text
  estimatedCost       Decimal? @map("estimated_cost") @db.Decimal(10, 2)
  estimatedDuration   Int?     @map("estimated_duration") // minutes
  rating              Decimal? @db.Decimal(3, 2)
  reviewCount         Int      @default(0) @map("review_count")
  imageUrl            String?  @map("image_url") @db.VarChar(255)
  isPopular           Boolean  @default(false) @map("is_popular")
  isActive            Boolean  @default(true) @map("is_active")
  createdAt           DateTime @default(now()) @map("created_at")

  city                City           @relation(fields: [cityId], references: [id])
  category            Category       @relation(fields: [categoryId], references: [id])
  tripActivities      TripActivity[]

  @@index([cityId])
  @@index([categoryId])
  @@index([isPopular])
  @@map("activities")
}

model TripActivity {
  id                    Int      @id @default(autoincrement()) @map("trip_activity_id")
  tripId                Int      @map("trip_id")
  stopId                Int      @map("stop_id")
  activityId            Int      @map("activity_id")
  scheduledDate         DateTime @map("scheduled_date") @db.Date
  scheduledStartTime    String?  @map("scheduled_start_time") @db.VarChar(5) // "09:00"
  scheduledEndTime      String?  @map("scheduled_end_time") @db.VarChar(5)
  actualCost            Decimal? @map("actual_cost") @db.Decimal(10, 2)
  status                String   @default("planned") @db.VarChar(20) // planned | completed | cancelled
  addedAt               DateTime @default(now()) @map("added_at")

  stop                  Stop     @relation(fields: [stopId], references: [id], onDelete: Cascade)
  activity              Activity @relation(fields: [activityId], references: [id])

  @@unique([tripId, activityId, scheduledDate])
  @@index([tripId])
  @@index([stopId])
  @@index([scheduledDate])
  @@map("trip_activities")
}

// ──────────────────────────────
// BUDGET
// ──────────────────────────────

model TripBudget {
  id                       Int      @id @default(autoincrement()) @map("budget_id")
  tripId                   Int      @unique @map("trip_id")
  accommodationBudget      Decimal? @map("accommodation_budget") @db.Decimal(12, 2)
  activitiesBudget         Decimal? @map("activities_budget") @db.Decimal(12, 2)
  foodBudget               Decimal? @map("food_budget") @db.Decimal(12, 2)
  transportationBudget     Decimal? @map("transportation_budget") @db.Decimal(12, 2)
  miscellaneousBudget      Decimal? @map("miscellaneous_budget") @db.Decimal(12, 2)
  totalBudget              Decimal? @map("total_budget") @db.Decimal(12, 2)
  updatedAt                DateTime @updatedAt @map("updated_at")

  trip                     Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@map("trip_budgets")
}

// ──────────────────────────────
// SHARING
// ──────────────────────────────

model TripShare {
  id                  Int       @id @default(autoincrement()) @map("share_id")
  tripId              Int       @map("trip_id")
  sharedByUserId      Int       @map("shared_by_user_id")
  sharedWithUserId    Int?      @map("shared_with_user_id")
  shareType           String    @default("public") @map("share_type") @db.VarChar(20)
  passwordHash        String?   @map("password_hash") @db.VarChar(255)
  shareUrlSlug        String    @unique @map("share_url_slug") @db.VarChar(100)
  allowCopy           Boolean   @default(true) @map("allow_copy")
  viewCount           Int       @default(0) @map("view_count")
  createdAt           DateTime  @default(now()) @map("created_at")
  expiresAt           DateTime? @map("expires_at")

  trip                Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  sharedBy            User      @relation("SharedBy", fields: [sharedByUserId], references: [id])
  sharedWith          User?     @relation("SharedWith", fields: [sharedWithUserId], references: [id])

  @@index([tripId])
  @@index([shareUrlSlug])
  @@map("trip_shares")
}
```

**Notes for the team**:
- `@map(...)` keeps clean `camelCase` in JS while the actual MySQL columns stay `snake_case` (matches common SQL conventions).
- `@@map(...)` does the same for table names.
- Run `npx prisma migrate dev --name <change_name>` every time you edit `schema.prisma` — Prisma writes and runs the SQL migration for you.

---

## 3. Prisma Client Usage Patterns

### 3.1 Prisma Client Singleton (`src/config/prisma.js`)

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
```

### 3.2 Example: Register User (`src/services/auth.service.js`)

```javascript
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function registerUser({ email, password, firstName, lastName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already exists');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      preferences: { create: {} }, // creates a related UserPreference row too
    },
  });

  return { userId: user.id, email: user.email };
}

module.exports = { registerUser };
```

### 3.3 Example: Create Trip with Nested Stops

```javascript
async function createTrip(userId, { tripName, description, startDate, endDate, totalBudget }) {
  return prisma.trip.create({
    data: {
      userId,
      tripName,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalBudget,
      budget: { create: { totalBudget } }, // auto-create related budget row
    },
  });
}
```

### 3.4 Example: Get Full Itinerary (replaces multi-JOIN SQL)

```javascript
async function getTripDetails(tripId, userId) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      stops: {
        orderBy: { stopSequence: 'asc' },
        include: {
          city: true,
          activities: {
            include: { activity: true },
            orderBy: { scheduledDate: 'asc' },
          },
        },
      },
      budget: true,
    },
  });

  if (!trip) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }

  return trip;
}
```

This single Prisma call replaces what would otherwise be a 3-table SQL JOIN — Prisma builds the query and returns nested JSON automatically.

### 3.5 Example: Budget Aggregation

```javascript
async function getBudgetSummary(tripId) {
  const result = await prisma.tripActivity.aggregate({
    where: { tripId },
    _sum: { actualCost: true },
  });

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { budget: true },
  });

  return {
    totalBudget: trip.budget?.totalBudget ?? trip.totalBudget,
    estimatedTotal: result._sum.actualCost ?? 0,
  };
}
```

### 3.6 Example: City Search (autocomplete)

```javascript
async function searchCities(query, limit = 20) {
  return prisma.city.findMany({
    where: {
      isActive: true,
      OR: [
        { cityName: { contains: query } },
        { country: { contains: query } },
      ],
    },
    orderBy: { popularityScore: 'desc' },
    take: limit,
  });
}
```

---

## 4. Seed Script (`prisma/seed.js`)

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

Run with: `npx prisma db seed`

---

## 5. API Specifications

### 5.1 Standard Response Format

**Success**:
```json
{
  "success": true,
  "data": { },
  "meta": { "timestamp": "2026-08-22T14:45:00Z" }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "startDate must be before endDate",
    "statusCode": 400
  }
}
```

### 5.2 Endpoint Reference

#### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| POST | `/api/v1/auth/register` | Create account | No |
| POST | `/api/v1/auth/login` | Login, get JWT | No |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| POST | `/api/v1/auth/forgot-password` | Send reset email | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |

#### Trips
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/trips` | List user's trips (paginated) | Yes |
| POST | `/api/v1/trips` | Create trip | Yes |
| GET | `/api/v1/trips/:tripId` | Full trip details (stops, activities, budget) | Yes |
| PUT | `/api/v1/trips/:tripId` | Update trip | Yes |
| DELETE | `/api/v1/trips/:tripId` | Delete trip | Yes |
| POST | `/api/v1/trips/:tripId/duplicate` | Copy trip | Yes |

#### Stops
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| POST | `/api/v1/trips/:tripId/stops` | Add stop (city) | Yes |
| PUT | `/api/v1/trips/:tripId/stops/:stopId` | Update stop dates | Yes |
| DELETE | `/api/v1/trips/:tripId/stops/:stopId` | Remove stop | Yes |
| POST | `/api/v1/trips/:tripId/stops/reorder` | Reorder stops | Yes |

#### Activities
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/activities/search` | Search/filter activities | No |
| POST | `/api/v1/trips/:tripId/stops/:stopId/activities` | Add activity to stop | Yes |
| PUT | `/api/v1/trips/:tripId/activities/:tripActivityId` | Update schedule/cost | Yes |
| DELETE | `/api/v1/trips/:tripId/activities/:tripActivityId` | Remove activity | Yes |

#### Cities
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/cities/search?q=` | Search cities | No |
| GET | `/api/v1/cities/popular` | Trending cities | No |
| GET | `/api/v1/cities/:cityId` | City details + activities | No |

#### Budget
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/trips/:tripId/budget` | Budget breakdown | Yes |
| PUT | `/api/v1/trips/:tripId/budget` | Update budget limits | Yes |

#### Sharing
| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| POST | `/api/v1/trips/:tripId/share` | Generate share link | Yes |
| GET | `/api/v1/trips/public/:urlSlug` | View public trip | No |
| POST | `/api/v1/trips/public/:urlSlug/copy` | Copy public trip to account | Yes |

### 5.3 Example Route + Controller (Express)

**`src/routes/trips.routes.js`**
```javascript
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const tripsController = require('../controllers/trips.controller');

router.use(authenticate);
router.get('/', tripsController.list);
router.post('/', tripsController.create);
router.get('/:tripId', tripsController.getById);
router.put('/:tripId', tripsController.update);
router.delete('/:tripId', tripsController.remove);

module.exports = router;
```

**`src/controllers/trips.controller.js`**
```javascript
const tripsService = require('../services/trips.service');

exports.create = async (req, res, next) => {
  try {
    const trip = await tripsService.createTrip(req.user.id, req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const trip = await tripsService.getTripDetails(Number(req.params.tripId), req.user.id);
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};
```

---

## 6. Business Logic & Validation Rules

### 6.1 Trip Validation (Zod example)

```javascript
const { z } = require('zod');

const createTripSchema = z.object({
  tripName: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  totalBudget: z.number().positive().max(1000000).optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});

module.exports = { createTripSchema };
```

### 6.2 Core Business Rules

| Rule | Enforcement |
|------|-------------|
| Trip end date > start date | Zod validation + Prisma check before create |
| Trip duration ≤ 365 days | Service layer check |
| Stop dates within trip dates | Service layer check against parent `Trip` |
| No overlapping stops | Query existing stops for trip, compare ranges |
| No duplicate activity on same date | Enforced by `@@unique([tripId, activityId, scheduledDate])` in schema |
| Budget alert if actual > planned | Computed in `budget.service.js`, returned in API response |
| Public slug uniqueness | Enforced by `@unique` in schema; generate via `slugify(tripName) + random suffix` |

### 6.3 Cost & Budget Calculation

```javascript
async function calculateBudgetSummary(tripId) {
  const activities = await prisma.tripActivity.findMany({
    where: { stop: { tripId } },
    include: { activity: true },
  });

  const estimatedTotal = activities.reduce(
    (sum, ta) => sum + Number(ta.actualCost ?? ta.activity.estimatedCost ?? 0),
    0
  );

  const budget = await prisma.tripBudget.findUnique({ where: { tripId } });

  return {
    totalBudget: Number(budget?.totalBudget ?? 0),
    estimatedTotal,
    remaining: Number(budget?.totalBudget ?? 0) - estimatedTotal,
    isOverBudget: estimatedTotal > Number(budget?.totalBudget ?? Infinity),
  };
}
```

---

## 7. Authentication & Security

### 7.1 JWT Middleware (`src/middleware/authenticate.js`)

```javascript
const jwt = require('jsonwebtoken');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};
```

### 7.2 Security Checklist

- [x] Passwords hashed with bcrypt (10+ salt rounds) — never store plain text
- [x] Prisma parameterizes all queries automatically — SQL injection is not possible via Prisma Client
- [x] JWT secret ≥32 chars, stored in `.env`, never committed
- [x] HTTPS enforced in production
- [x] Rate limiting: 1000 req/hour per user (via `express-rate-limit` + Redis store)
- [x] CORS restricted to known frontend origins
- [x] Input validated with Zod before hitting the service layer
- [x] File uploads: whitelist JPG/PNG, max 5MB, private S3 bucket

---

## 8. Environment Variables (`.env.example`)

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/globetrotter_db"

# Server
PORT=5000
NODE_ENV=development

# Auth
JWT_SECRET=replace_with_32plus_char_secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# File Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=globetrotter-uploads

# Email (optional)
SENDGRID_API_KEY=
```

---

## 9. Local Development (Docker Compose)

**`docker-compose.yml`**
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

**Getting started (from zero, for a team new to MySQL)**:
```bash
# 1. Start MySQL + Redis locally
docker compose up -d

# 2. Install deps
npm install

# 3. Copy env file and fill in values
cp .env.example .env

# 4. Create tables from schema.prisma
npx prisma migrate dev --name init

# 5. Seed sample data
npx prisma db seed

# 6. Start the API
npm run dev

# 7. (Optional) Browse your DB visually
npx prisma studio
```

---

## 10. Caching Strategy (Redis)

| Key Pattern | TTL | Invalidated On |
|-------------|-----|-----------------|
| `trips:user:{userId}` | 1 hour | Trip create/update/delete |
| `cities:popular` | 24 hours | Daily cron recompute |
| `activities:city:{cityId}` | 12 hours | Activity add/edit |
| `trip:public:{slug}` | 30 days | Share settings change |
| `ratelimit:{userId}` | 1 hour | Sliding window per request |

---

## 11. Performance Targets

| Endpoint | Target (P95) |
|----------|---------------|
| Auth (login/register) | 300ms |
| Trip list | 200ms |
| Trip details (with stops+activities) | 400ms |
| Search (cities/activities) | 250ms |
| Budget summary | 200ms |

**Prisma-specific tips**:
- Use `select` to fetch only needed fields on hot paths (avoid `include` everything).
- Add `@@index` on any field used in `where` filters (already included in schema above).
- Use `prisma.$transaction([...])` for multi-write operations (e.g., create trip + budget).
- Enable Prisma's connection pooling (`connection_limit` param in `DATABASE_URL`) for production.

---

## 12. Testing Strategy

```bash
npm install --save-dev jest supertest
```

**Example integration test** (`tests/trips.test.js`):
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/v1/trips', () => {
  it('creates a trip for an authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        tripName: 'Europe 2024',
        startDate: '2024-07-01',
        endDate: '2024-07-20',
        totalBudget: 5000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tripName).toBe('Europe 2024');
  });
});
```

Use a **separate test database** (`globetrotter_test_db`) so tests never touch dev/prod data. Reset with `npx prisma migrate reset` between test runs in CI.

---

## 13. Deployment Notes

- Run `npx prisma migrate deploy` (NOT `migrate dev`) in production/CI — it applies existing migrations without prompting or generating new ones.
- Set `DATABASE_URL` via environment secrets, never hardcode.
- Recommended hosts: PlanetScale, AWS RDS (MySQL), or Railway — all support standard MySQL connection strings Prisma expects.
- Run `npx prisma generate` as part of your build step (`postinstall` script) so the Prisma Client is available in the deployed container.

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate",
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "prisma migrate deploy"
  }
}
```

---

## 14. Roadmap (5 Weeks)

### Week 1 — Foundation
- [ ] Docker compose (MySQL + Redis) running locally
- [ ] `schema.prisma` finalized, first migration run
- [ ] Auth endpoints (register/login/refresh) with bcrypt + JWT
- [ ] Seed script for cities/categories/activities

### Week 2 — Trip Core
- [ ] Trip CRUD
- [ ] Stops CRUD + reorder
- [ ] Validation layer (Zod) on all write endpoints

### Week 3 — Activities & Budget
- [ ] Activity search + add/remove from trip
- [ ] Budget aggregation endpoint
- [ ] Redis caching on read-heavy endpoints

### Week 4 — Sharing & Hardening
- [ ] Public share link generation + public read endpoints
- [ ] Rate limiting, CORS, security review
- [ ] Integration test suite (Jest + Supertest)

### Week 5 — Launch
- [ ] Deploy MySQL (PlanetScale/RDS) + run `migrate deploy`
- [ ] Deploy API (Docker container)
- [ ] Monitoring/logging wired up
- [ ] Smoke test against production

---

## 15. Acceptance Criteria

- [ ] `schema.prisma` matches all entities in this document
- [ ] All endpoints in Section 5.2 implemented and returning the standard response format
- [ ] Zod validation on every write endpoint
- [ ] JWT auth enforced on all non-public routes
- [ ] `npx prisma migrate deploy` runs cleanly on a fresh database
- [ ] Seed script populates enough data for demo (≥20 cities, ≥100 activities)
- [ ] Integration tests passing in CI
- [ ] No raw SQL string concatenation anywhere in the codebase

---

## Document Information

- **Version**: 1.0 (Backend-First, Node.js + Prisma + MySQL)
- **Last Updated**: August 22, 2026
- **Status**: Ready for Implementation
- **Target Audience**: Backend engineers (including those new to MySQL)
