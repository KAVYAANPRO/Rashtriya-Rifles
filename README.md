# GlobalTrotter

Plan multi-city trips, build day-by-day itineraries, and keep the whole budget in one place.

## Branches

| Branch | Contents |
| --- | --- |
| `main` | This README. |
| `frontend` | The full React frontend. |

## Frontend

A React single-page app built with Vite and Tailwind CSS v4. It currently runs entirely on
the client — all data lives in React context backed by `localStorage`, so it can be demoed
without a backend. The store functions are shaped to mirror the planned REST API, so wiring
in a real backend later means swapping those functions for HTTP calls.

### Screens

- **Welcome** — public landing page with an animated hero, feature overview, and footer
- **Login / Register** — local account creation and sign-in
- **Dashboard** — recent trips, city suggestions, quick search
- **Create trip** — name, starting city, dates, budget, plus one-tap activity suggestions
- **Itinerary builder** — add stops per city and drop activities into each, with a live cost total
- **Itinerary & budget** — day-list and by-city views, category cost breakdown, over-budget warning
- **My trips** — trips grouped by Upcoming / Ongoing / Past, with search and delete
- **Profile** — editable details and trip history

### Tech

- React 19 + Vite
- React Router
- Tailwind CSS v4
- Framer Motion (hero animation)

### Running it

```bash
git checkout frontend
cd app
npm install
npm run dev
```

The dev server starts on <http://localhost:5173>.

Demo account: `ananya.rao` / `travel2026`

### Building

```bash
npm run build
```

Output goes to `dist/`.
