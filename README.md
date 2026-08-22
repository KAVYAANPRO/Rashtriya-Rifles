# 🌍 GlobeTrotter — AI Travel Planner (Full-Stack)

An intelligent, full-stack AI-powered travel planning application built with **React, Vite, Node.js, Express, Prisma ORM, and MySQL**. 

GlobeTrotter enables multi-city trip planning, automated AI itinerary generation with dietary preferences, live flight & accommodation searches tailored for family sizes, local public transport discovery, and an integrated **Razorpay Freemium monetization engine**.

---

## 🌟 Key Features

- **🤖 AI Auto-Planner**: Generates complete day-by-day itineraries based on travel budget, city, duration, vibe, and **dietary preferences** (Vegetarian, Vegan, Halal, etc.).
- **👨‍👩‍👧‍👦 Family Booking Support**: Automatically adjusts Google Flights, Booking.com, and Airbnb deep-links with exact passenger breakdown (`adults` + `children`).
- **✈️ Live Flight & Hotel Search**: Live fare estimates, 7-day price graphs, and dynamic checkout links for major travel portals.
- **🚕 Local Transport & Cabs**: Discover local cab services (Ola, Uber, Meru), hotline numbers, and public transit info (Metro, Bus) for any destination city.
- **💳 Freemium Model & Razorpay Paywall**:
  - **Free Tier**: 3 trip plannings included on sign-up.
  - **Paywall**: 4th trip creation attempt triggers a `403` paywall block (`requiresUpgrade: true`).
  - **Razorpay Integration**: ₹999 one-time payment with cryptographic HMAC-SHA256 signature verification to unlock unlimited trips instantly.
- **🔒 Secure Authentication**: JWT-based auth, password hashing with `bcryptjs`, and Google OAuth support.

---

## 🏗️ Tech Stack

### **Frontend** (`my-frontend/`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Custom Glassmorphism UI
- **Animations**: Framer Motion
- **Routing**: React Router DOM v7
- **Payment SDK**: Razorpay Checkout JS (`https://checkout.razorpay.com/v1/checkout.js`)

### **Backend** (`root`)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database & ORM**: MySQL 8.0+ via Prisma ORM
- **AI Engine**: OpenRouter API (`gpt-4o-mini`)
- **Payment Gateway**: Razorpay Node SDK
- **Validation**: Zod schema validation
- **Caching**: Redis via `ioredis` *(optional fallback)*

---

## 📁 Directory Structure

```text
OdooBackend/
├── prisma/
│   └── schema.prisma         # Prisma Database Schema (Users, Trips, Payments, etc.)
├── src/
│   ├── app.js                # Express App Setup & Middleware
│   ├── server.js             # HTTP Server Entry Point
│   ├── config/               # Prisma & Redis Configurations
│   ├── controllers/          # Request Handlers (Auth, Trip, Flight, Hotel, Transport, Payment, etc.)
│   ├── middleware/           # Auth, Rate Limiter, Error Handler, Zod Validation
│   ├── routes/               # API Express Routers
│   ├── schemas/              # Zod Input Validation Schemas
│   └── services/             # Business Logic (AI Planner, Razorpay, SerpApi, Transport)
├── my-frontend/              # React Single-Page Application
│   ├── src/
│   │   ├── components/       # UI Components (Navbar, Toast, Buttons, Logo)
│   │   ├── lib/              # API Client (`api.js`) & Formatting Utilities
│   │   ├── pages/            # Application Pages (Welcome, Login, Register, MyTrips, CreateTrip, Upgrade, etc.)
│   │   └── store/            # Global Application Context (`AppContext.jsx`)
│   ├── vite.config.js        # Vite Config with Dev Proxy (`/api` -> `http://localhost:5000`)
│   └── package.json
├── .env.example              # Environment Variable Template
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites & System Requirements

| Tool | Minimum Version | Download Link |
|---|---|---|
| **Node.js** | v18.0.0+ | https://nodejs.org |
| **MySQL** | v8.0+ | https://dev.mysql.com/downloads/installer/ |
| **npm** | v9.0+ | Ships with Node.js |
| **Git** | Any | https://git-scm.com |
| **Redis** *(Optional)* | v6.0+ | https://redis.io/downloads |

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/KAVYAANPRO/Rashtriya-Rifles.git
cd Rashtriya-Rifles
git checkout Backend
```

---

### Step 2: Backend Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create MySQL Database**:
   Log in to MySQL Workbench or MySQL CLI and run:
   ```sql
   CREATE DATABASE globetrotter_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   # Windows PowerShell / CMD
   copy .env.example .env

   # Mac / Linux
   cp .env.example .env
   ```

   Edit `.env` with your database credentials and API keys:
   ```env
   DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/globetrotter_db"
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars
   JWT_EXPIRES_IN=7d
   REDIS_URL=redis://localhost:6379

   # AI & Travel APIs
   OPENROUTER_API_KEY=your_openrouter_api_key_here

   # Razorpay Payment Gateway
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Sync Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   The backend runs on **`http://localhost:5000`**. You can verify health at `http://localhost:5000/health`.

---

### Step 3: Frontend Setup

1. **Navigate to Frontend Directory**:
   ```bash
   cd my-frontend
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The frontend runs on **`http://localhost:5173`**. Requests to `/api/v1` are automatically proxied to `http://localhost:5000`.

---

## 📡 API Endpoint Reference

### 🔐 Auth Routes (`/api/v1/auth`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register new user account |
| `POST` | `/api/v1/auth/login` | No | Login & receive JWT token |
| `POST` | `/api/v1/auth/google-login` | No | Google OAuth login |
| `GET` | `/api/v1/auth/me` | Yes | Get authenticated user profile |
| `PATCH` | `/api/v1/auth/profile` | Yes | Update user profile details |

### 🧳 Trip Management (`/api/v1/trips`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/trips` | Yes | Create trip *(Blocked if >3 trips & not premium)* |
| `GET` | `/api/v1/trips` | Yes | List all user trips |
| `GET` | `/api/v1/trips/:id` | Yes | Fetch single trip details |
| `PATCH` | `/api/v1/trips/:id` | Yes | Update trip metadata |
| `DELETE` | `/api/v1/trips/:id` | Yes | Delete trip |

### ✈️ Flights (`/api/v1/flights`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/flights/search` | Yes | Search flight options with family breakdown & Skyscanner graph |

**Params**: `origin`, `destination`, `date`, `adults`, `children`

### 🏨 Hotels & Airbnb (`/api/v1/hotels`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/hotels/search` | Yes | Search hotels & Airbnb with Booking.com / Airbnb deep-links |

**Params**: `city`, `checkIn`, `checkOut`, `adults`, `children`

### 🚕 Local Transport (`/api/v1/transport`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/transport/search` | Yes | Get local cabs (Ola, Uber, Meru) & public transit for a city |

**Params**: `city`

### 🤖 AI Auto Planner (`/api/v1/trips/:tripId/stops/:stopId/auto-plan`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/trips/:tripId/stops/:stopId/auto-plan` | Yes | AI generates geographically clustered itinerary with dietary restrictions |

**Body**:
```json
{
  "preferences": ["Art", "Architecture", "Fine Dining"],
  "dietaryPreference": "Vegan"
}
```

### 💳 Razorpay Payments (`/api/v1/payment`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/payment/create-order` | Yes | Create Razorpay order for ₹999 Premium upgrade |
| `POST` | `/api/v1/payment/verify` | Yes | Verify HMAC-SHA256 signature & upgrade user |
| `GET` | `/api/v1/payment/history` | Yes | List user's payment transaction history |

---

## 💎 Freemium & Razorpay Workflow

1. **Free Tier**: Users can create up to **3 trips** for free.
2. **Paywall Block**: On attempting to create a 4th trip without Premium:
   ```json
   {
     "success": false,
     "message": "Trip limit reached. Please upgrade to Premium to create more trips.",
     "requiresUpgrade": true
   }
   ```
3. **Checkout Modal**: The frontend redirects the user to `/upgrade` or opens the native Razorpay modal (`Razorpay` JS SDK).
4. **Verification**: When payment succeeds, signature details (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) are posted to `/api/v1/payment/verify`.
5. **Instant Upgrade**: Once verified via HMAC-SHA256, `isPremium` flips to `true` in MySQL, unlocking unlimited trip planning.

---

## 🛠️ Troubleshooting

| Issue / Symptom | Possible Cause | Solution |
|---|---|---|
| `Access denied for user 'root'@'localhost'` | Wrong MySQL password in `.env` | Update `DATABASE_URL` in `.env` with your local MySQL password. |
| `Unknown database 'globetrotter_db'` | Database not created | Execute `CREATE DATABASE globetrotter_db;` in MySQL first. |
| `Razorpay keys not configured` | Missing Razorpay keys in `.env` | Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`. |
| `OPENROUTER_API_KEY not set` | Missing AI key | Get a free API key at https://openrouter.ai and place it in `.env`. |
| `Port 5000 already in use` | Another process on 5000 | Change `PORT=5001` in `.env`. |

---

## 📄 License & Attribution

Built for the **GlobeTrotter AI Travel Planning Platform**. All rights reserved.
