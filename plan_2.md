# GlobeTrotter — Hackathon Execution Plan

## Overview

This is the single source of truth for **who builds what, in what order, by when**. It ties together the PRD, the Backend PRD (Node.js + Prisma + MySQL), and `instruction.md` (backend build steps) into one team-level plan.

**Stack**: React (frontend) + Node.js/Express/Prisma (backend) + MySQL + Redis
**Team split assumed**: 2 backend, 2 frontend (adjust the "Owner" column to your actual team)

---

## 1. Scope Decision — What Ships vs. What Gets Cut

Hackathons are won by finishing a small thing completely, not starting a big thing. Lock this in before writing code.

### Must Ship (MVP — demo depends on these)
- Login / Signup
- Create Trip
- Add Stops (cities) to a trip
- Add Activities to a stop
- Itinerary View (day-wise list)
- Trip Budget summary (total + basic breakdown)
- My Trips list

### Should Ship (if time allows)
- City/Activity search with filters
- Trip Calendar/Timeline view
- Public share link + copy trip

### Cut Unless Way Ahead of Schedule
- Admin/Analytics dashboard
- Drag-to-reorder activities
- Two-factor auth, email verification flows
- Currency conversion
- Social media share previews

**Rule**: If a "Should Ship" item threatens a "Must Ship" item's deadline, it gets cut. Re-evaluate scope at the end of every phase below, not just at the end.

---

## 2. Timeline (36-Hour Hackathon Reference)

Adjust the hour numbers to your actual hackathon length — the **order and dependencies** matter more than exact hours.

| Phase | Hours | Focus |
|-------|-------|-------|
| Phase 0 | 0–2 | Setup: repo, DB, environments, contracts agreed |
| Phase 1 | 2–10 | Backend core (auth, trips, stops) + Frontend shell (routing, auth screens) in parallel |
| Phase 2 | 10–20 | Backend (activities, budget) + Frontend (itinerary builder, trip list) in parallel |
| Phase 3 | 20–28 | Integration: connect frontend to real API, replace mocks |
| Phase 4 | 28–32 | Should-Ship features if on schedule, otherwise polish/bug fixes |
| Phase 5 | 32–36 | Freeze features, demo prep, deploy, rehearse |

---

## 3. Phase 0 — Setup (Hour 0–2)

| Task | Owner | Output |
|------|-------|--------|
| Create GitHub repo, branch protection, `main`/`dev` branches | Team lead | Repo ready |
| Backend scaffold (Step 1 of `instruction.md`) | Backend | `globetrotter-backend/` builds and runs |
| `docker-compose up -d` for MySQL + Redis | Backend | Local DB running |
| `schema.prisma` written + first migration run | Backend | Tables exist |
| Frontend scaffold (Vite + React + router) | Frontend | Blank app runs on `localhost:5173` |
| Agree on API contract (use `GlobeTrotter_Backend_API.md` as the fixed reference) | Both | No renegotiating endpoint shapes mid-build |
| Shared `.env.example` committed | Backend | Anyone can `cp .env.example .env` and run |

**Exit condition**: Backend `npm run dev` responds on `/health`. Frontend renders a blank page. Both pushed to `dev`.

---

## 4. Phase 1 — Core Auth + Trip Skeleton (Hour 2–10)

### Backend (follows `instruction.md` Steps 8–9)
| Task | Owner | Depends on |
|------|-------|-----------|
| Auth service: register, login, JWT issuing | Backend Dev A | Phase 0 |
| Auth routes + Zod validation | Backend Dev A | above |
| Trips service: create, list, get, update, delete | Backend Dev B | Phase 0 |
| Trips routes + `authenticate` middleware | Backend Dev B | above |
| Manual `curl`/Postman test of both | Backend Dev A+B | above |

### Frontend (build against mocked responses matching the API doc, don't block on backend)
| Task | Owner | Depends on |
|------|-------|-----------|
| Login / Signup screens + form validation | Frontend Dev A | API contract |
| Dashboard shell + routing (protected routes) | Frontend Dev A | above |
| Create Trip form | Frontend Dev B | API contract |
| My Trips list (cards) | Frontend Dev B | API contract |
| Axios/fetch client with mock base URL, easy to swap later | Frontend Dev A | — |

**Exit condition**: Backend can register/login/create/list trips via curl. Frontend has working screens against mock data, structurally ready to point at the real API.

---

## 5. Phase 2 — Itinerary Depth (Hour 10–20)

### Backend (follows `instruction.md` Steps 10–13)
| Task | Owner | Depends on |
|------|-------|-----------|
| Stops service + validation (dates within trip, no overlap) | Backend Dev A | Phase 1 trips |
| Stops routes | Backend Dev A | above |
| Cities seed data (≥20 cities) + search endpoint | Backend Dev B | Phase 0 schema |
| Activities seed data (≥100 activities) + search endpoint | Backend Dev B | above |
| Trip Activities service (add/remove/update) | Backend Dev A | Stops done |
| Budget aggregation endpoint | Backend Dev B | Trip Activities done |

### Frontend
| Task | Owner | Depends on |
|------|-------|-----------|
| Itinerary Builder screen (add stop, add activity UI) | Frontend Dev A | Create Trip done |
| City search + Activity search components | Frontend Dev B | API contract |
| Itinerary View (day-wise layout) | Frontend Dev A | Itinerary Builder |
| Budget breakdown screen (numbers first, charts if time) | Frontend Dev B | API contract |

**Exit condition**: Every "Must Ship" screen exists in the frontend with real component structure (even if still on mock data), and every corresponding backend endpoint is implemented and manually tested.

---

## 6. Phase 3 — Integration (Hour 20–28)

This is the highest-risk phase. Do it as pairs (one frontend + one backend dev per feature), not solo.

| Task | Pair | Notes |
|------|------|-------|
| Swap auth mock → real API, confirm token storage/refresh works | Dev A + Dev A | Test logout/expired-token handling |
| Swap trips list/create/detail → real API | Dev B + Dev B | Confirm nested stops/activities render |
| Swap itinerary builder → real API | Dev A + Dev A | Test add/remove stop and activity end-to-end |
| Swap budget screen → real API | Dev B + Dev B | Confirm totals match manual math |
| Cross-browser/responsive check on core screens | Whoever's free | Desktop + one mobile width minimum |

**Exit condition**: A user can go Register → Create Trip → Add Stops → Add Activities → View Itinerary → View Budget entirely through the real UI, no mocks left in the critical path.

---

## 7. Phase 4 — Should-Ship or Polish (Hour 28–32)

**Decision point**: Look at Phase 3's exit condition. If it was met with time to spare, pick from "Should Ship" in priority order:

1. Public share link + copy trip (`instruction.md` Step 14)
2. City/Activity filters (cost, category, duration)
3. Trip Calendar/Timeline view

If Phase 3 exit condition was **not** cleanly met, this entire phase becomes bug-fixing and stabilizing the MVP flow instead. No new features.

---

## 8. Phase 5 — Freeze & Demo Prep (Hour 32–36)

| Task | Owner | Notes |
|------|-------|-------|
| Feature freeze — no new code except critical bug fixes | Everyone | Hard cutoff |
| Deploy backend (Railway/Render/similar) + run `prisma migrate deploy` | Backend | Use production `DATABASE_URL` |
| Deploy frontend (Vercel/Netlify) pointed at deployed API | Frontend | Confirm CORS allows the deployed frontend origin |
| Seed production DB with demo-friendly data | Backend | Recognizable cities/activities for the demo story |
| Write demo script (which user, which trip, what to click) | Whoever presents | Rehearse the exact click path |
| Full run-through on the deployed URLs, not localhost | Everyone | Catches env-specific bugs |
| Prepare fallback: screen recording of the working flow | Whoever presents | In case live demo/wifi fails |

---

## 9. Ownership Matrix (fill in real names)

| Area | Primary | Backup |
|------|---------|--------|
| Auth (backend) | | |
| Trips/Stops (backend) | | |
| Activities/Cities/Budget (backend) | | |
| Auth + Dashboard (frontend) | | |
| Itinerary Builder + View (frontend) | | |
| Budget + Search UI (frontend) | | |
| Deployment | | |
| Demo presenter | | |

---

## 10. Standing Rules

- **No silent scope creep.** Anything not in "Must Ship" or approved "Should Ship" needs a 30-second team check-in before someone starts building it.
- **API contract is frozen after Phase 0.** If it must change, both a backend and frontend person agree on it together before code changes — no one-sided edits.
- **Every backend endpoint gets a one-line curl test before being called "done."** Referenced in `instruction.md` checkpoints — don't skip them under time pressure, they're faster than debugging integration later.
- **Commit and push at least every 2 hours.** Merge conflicts at hour 34 are how demos die.
- **Re-check the timeline at the end of every phase.** If a phase runs over, cut scope from the *next* phase, not from testing/integration time.
- **If AI (Claude Code / Cursor / Copilot, etc.) is writing the code, it must test the feature it just built before moving to the next one — no exceptions.** This applies to every backend endpoint and every frontend screen/component, not just the "big" features. See Section 12 for exactly what "tested" means at each layer.

---

## 11. Risk Register

| Risk | Mitigation |
|------|-----------|
| Backend/frontend integration takes longer than planned | Phase 3 has a dedicated 8-hour block for exactly this — don't compress it |
| MySQL/Prisma unfamiliarity slows backend | `instruction.md` gives copy-paste-ready code for every step; use it literally, don't improvise the schema |
| Scope creep from "just one more feature" | Section 1's Must/Should/Cut list is final unless the whole team agrees to revisit |
| Deploy environment differs from local (env vars, CORS) | Deploy early in Phase 5, not at the last hour — leaves time to fix env issues |
| Demo-day wifi/live bugs | Screen-recorded fallback prepared in Phase 5 |
| AI-written code looks complete but was never run | Section 12's test-before-next-feature rule is mandatory, not optional — enforce it every single feature, especially under time pressure |

---

## 12. AI-Written Code — Test-Before-Next-Feature Rule

The team is vibecoding this build with AI assistance. AI-generated code moves fast but silently accumulates untested edges if nothing forces a check. To prevent that, **every feature the AI implements must be verified working before the AI (or the person driving it) is allowed to start the next feature.** This is not optional polish — treat it as part of "done," the same way a checkpoint in `instruction.md` is part of "done."

### What "tested" means, per layer

**Backend endpoint (every Step in `instruction.md`)**:
1. AI writes the service + controller + route for one feature (e.g., "add stop to trip").
2. AI immediately runs a `curl` (or writes/runs a Jest+Supertest test) against the running local server for:
   - The success case (valid input → correct status code + expected response shape)
   - At least one failure case (missing auth token, invalid input, not-found resource)
3. AI reports the actual response received, not just "should work." If the endpoint doesn't behave as expected, fix it before moving on — don't queue it as a "fix later."
4. Only after both cases pass does the AI move to the next feature in `instruction.md`.

**Frontend screen/component**:
1. AI writes the component.
2. AI (or the developer, if AI can't render a browser) manually exercises the screen: happy path (form submits, list renders with data) and at least one edge case (empty state, validation error shown).
3. Any console errors or failed network requests during this check must be resolved before moving on.

**Integration (Phase 3 pairs)**:
1. After wiring frontend to a real backend endpoint, run the full user action end-to-end (click through the UI, not just check the network tab).
2. Confirm the data appears correctly in Prisma Studio / the database, not just in the UI — this catches cases where the UI looks right but the write silently failed or wrote wrong data.

### Why this rule exists

AI coding assistants will confidently generate code for a feature and describe it as complete without ever having run it. In a hackathon, that shows up as a pile of "should work" code discovered broken during Phase 5 demo prep, when there's no time left to fix it. Testing immediately after each feature — while the context of what was just built is still fresh — is dramatically cheaper than debugging a stack of unverified features later.

### Enforcement

- Nobody accepts an AI's code as "done" on the strength of the AI's own claim that it works. A visible test result (terminal output, curl response, screen recording, or a passing test run) is required.
- If the AI cannot run the code itself (no execution environment), the human driving it must run the test before merging or moving to the next task — the rule doesn't relax just because the AI can't self-verify.
- Add this test result briefly to the PR description or commit message (e.g., "tested: POST /trips/:id/stops returns 201 + validates date overlap") so teammates don't have to re-verify each other's work from scratch.

---

## Reference Documents

- `GlobeTrotter_PRD.md` — full product requirements
- `GlobeTrotter_Backend_PRD_Prisma.md` — backend architecture, schema, API spec
- `instruction.md` — step-by-step backend build order with checkpoints

This plan assumes those documents as fixed references — don't re-derive requirements mid-build, look them up.
