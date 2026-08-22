# GlobalTrotter — running it on your laptop

Two apps: an Express + Prisma API in `Backend/` talking to your **local MySQL**, and a
React + Vite app in `frontend/`. Run both at once, in two terminals.

Already done for you: dependencies are installed in both folders, `frontend/.env` is
created, and `Backend/.env` is created from the template with a fresh `JWT_SECRET`.

---

## 1. Point the API at your MySQL

Your MySQL service (`MySQL267`) is running and listening on port 3306, but the password
in the template is not the one your server uses.

Open `Backend/.env` and set `DATABASE_URL` to your real credentials:

```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/globetrotter_db"
```

- `globetrotter_db` does not need to exist — the next step creates it.
- If your password contains `@ : / ? # %`, URL-encode it (`@` becomes `%40`).
- Using a non-root user is fine too, as long as it can `CREATE DATABASE`.

## 2. Create the schema and load the catalog

From `Backend/`:

```bash
npx prisma migrate dev --name init
```

Then seed the cities, categories, activities and a demo account:

```bash
npm run seed
```

## 3. Start the API

From `Backend/`:

```bash
npm run dev
```

It listens on <http://localhost:5000>. Check <http://localhost:5000/health> — it should
return `{"status":"ok"}`.

## 4. Start the web app

In a second terminal, from `frontend/`:

```bash
npm run dev
```

Open the URL Vite prints (normally <http://localhost:5173>).

## 5. Sign in

```
ananya.rao@example.com
travel2026
```

The seed gives this account one upcoming trip and one past trip so the dashboards
aren't empty. You can also register a fresh account — see the OTP note below.

---

## Optional API keys

Everything above works without a single external key. These unlock the extra features;
without them the relevant screen shows a plain "not configured" message instead of
breaking.

| Key in `Backend/.env` | Unlocks |
| --- | --- |
| `OPENROUTER_API_KEY` | Auto-plan, plus flight/hotel/transport results when SerpApi is absent |
| `OPENROUTER_MODEL` | Overrides the model (default `openai/gpt-4o-mini`, which is **paid**). Out of credit? Use `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `SERPAPI_KEY` | Real Google Flights / Google Hotels results |
| `TICKETMASTER_API_KEY` | Live events for a stop (falls back to AI, then to samples) |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | The Premium upgrade on the Profile page |
| `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` | "Continue with Google" on the login screen |
| `SMTP_USER` + `SMTP_PASS` | Real OTP emails |
| `EXCHANGE_RATE_API_KEY` | Currency conversion helper |

### About OTP codes

New accounts must confirm a 6-digit code before their first sign-in. With no SMTP
configured, **the code is printed in the backend terminal** — look for a
`📧 [MOCK EMAIL to …]` block. The same applies to password resets.

---

## Everyday commands

| Where | Command | What it does |
| --- | --- | --- |
| `Backend/` | `npm run dev` | API with auto-reload |
| `Backend/` | `npm start` | API without auto-reload |
| `Backend/` | `npm run seed` | Re-load the catalog (safe to re-run) |
| `Backend/` | `npx prisma studio` | Browse the database in a GUI |
| `Backend/` | `node -r dotenv/config probe-routes.js` | Ping every API route and print what each returns |
| `Backend/` | `node -r dotenv/config e2e-check.js` | Full journey test against the real DB (53 assertions, cleans up after itself) |
| `Backend/` | `node -r dotenv/config autoplan-check.js` | Exercise the AI auto-planner on a throwaway account |
| `Backend/` | `npx prisma migrate dev` | Apply schema changes |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build into `dist/` |

---

## If something goes wrong

**`Authentication failed against database server`** — the password in
`Backend/.env` is wrong. Fix `DATABASE_URL` and re-run step 2.

**`Can't reach database server at localhost:3306`** — MySQL isn't running. Start it from
Windows Services (the service on this machine is `MySQL267`).

**Frontend says "Cannot reach the API"** — the backend isn't running, or
`VITE_API_URL` in `frontend/.env` doesn't match its port. Restart Vite after editing
`.env`; it only reads env files at startup.

**`Too many requests`** — the rate limiter. Raise `RATE_LIMIT_MAX` in `Backend/.env`.

**"Browse activities" keeps growing** — this is by design. When the AI auto-planner
invents a restaurant or sight that isn't in the catalog, it saves it as a real activity so
it can be scheduled. Those rows are shared, not per-user, so the catalog grows every time
someone auto-plans. To prune the ones nothing references:

```bash
npx prisma studio
```

and delete unwanted rows from `activities`, or re-run `npm run seed` after a reset.

**Schema and database out of step** — `npx prisma migrate reset` wipes and rebuilds the
database, then re-run `npm run seed`. This deletes all local data.
