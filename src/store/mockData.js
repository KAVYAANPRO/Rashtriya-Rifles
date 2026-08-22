// Kept for reference only — the app now reads cities, categories and
// activities from the API (see src/lib/api.js -> catalog). The backend seed
// in Backend/prisma/seed.js loads this same catalog into MySQL.

export const CATEGORIES = [
  'Adventure', 'Food & Dining', 'Culture & History', 'Shopping',
  'Nightlife', 'Nature & Parks', 'Photography', 'Sports', 'Wellness',
]

export const CITIES = [
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', cost: '$$', tag: 'Culture', stay: '3-5 days' },
  { id: 'osaka', name: 'Osaka', country: 'Japan', cost: '$$', tag: 'Food', stay: '2-4 days' },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', cost: '$', tag: 'Coastal', stay: '3-4 days' },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', cost: '$$$', tag: 'Nature', stay: '4-6 days' },
  { id: 'paris', name: 'Paris', country: 'France', cost: '$$$', tag: 'Culture', stay: '3-5 days' },
  { id: 'loire', name: 'Loire Valley', country: 'France', cost: '$$', tag: 'Scenic', stay: '2-3 days' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', cost: '$', tag: 'Food', stay: '3-4 days' },
  { id: 'capetown', name: 'Cape Town', country: 'South Africa', cost: '$$', tag: 'Adventure', stay: '4-6 days' },
]

export const ACTIVITIES = [
  { id: 'a1', name: 'Fushimi Inari Hike', city: 'kyoto', category: 'Adventure', cost: 0, duration: 150, rating: 4.8, reviews: 2140 },
  { id: 'a2', name: 'Kaiseki Tasting Menu', city: 'kyoto', category: 'Food & Dining', cost: 85, duration: 120, rating: 4.9, reviews: 860 },
  { id: 'a3', name: 'Gion District Walking Tour', city: 'kyoto', category: 'Culture & History', cost: 32, duration: 90, rating: 4.6, reviews: 540 },
  { id: 'a4', name: 'Dotonbori Street Food Crawl', city: 'osaka', category: 'Food & Dining', cost: 45, duration: 150, rating: 4.7, reviews: 1320 },
  { id: 'a5', name: 'Osaka Castle Tour', city: 'osaka', category: 'Culture & History', cost: 20, duration: 100, rating: 4.5, reviews: 980 },
  { id: 'a6', name: 'Paragliding over Kansai Coast', city: 'osaka', category: 'Sports', cost: 126, duration: 60, rating: 4.9, reviews: 210 },
  { id: 'a7', name: 'Belém Tower & Tram 28', city: 'lisbon', category: 'Culture & History', cost: 15, duration: 180, rating: 4.6, reviews: 1500 },
  { id: 'a8', name: 'Sintra Day Trip', city: 'lisbon', category: 'Nature & Parks', cost: 60, duration: 480, rating: 4.8, reviews: 2200 },
  { id: 'a9', name: 'Fado Night & Dinner', city: 'lisbon', category: 'Nightlife', cost: 55, duration: 150, rating: 4.7, reviews: 640 },
  { id: 'a10', name: 'Blue Lagoon Soak', city: 'reykjavik', category: 'Wellness', cost: 90, duration: 180, rating: 4.7, reviews: 3100 },
  { id: 'a11', name: 'Northern Lights Tour', city: 'reykjavik', category: 'Nature & Parks', cost: 110, duration: 240, rating: 4.9, reviews: 1890 },
  { id: 'a12', name: 'Golden Circle Photography Tour', city: 'reykjavik', category: 'Photography', cost: 130, duration: 480, rating: 4.8, reviews: 760 },
  { id: 'a13', name: 'Eiffel Tower Summit', city: 'paris', category: 'Culture & History', cost: 28, duration: 120, rating: 4.6, reviews: 5200 },
  { id: 'a14', name: 'Louvre Skip-the-Line', city: 'paris', category: 'Culture & History', cost: 22, duration: 180, rating: 4.7, reviews: 4400 },
  { id: 'a15', name: 'Le Marais Shopping Walk', city: 'paris', category: 'Shopping', cost: 0, duration: 120, rating: 4.4, reviews: 380 },
  { id: 'a16', name: 'Chateau de Chambord Tour', city: 'loire', category: 'Culture & History', cost: 40, duration: 240, rating: 4.8, reviews: 620 },
  { id: 'a17', name: 'Loire Valley Wine Tasting', city: 'loire', category: 'Food & Dining', cost: 65, duration: 180, rating: 4.9, reviews: 410 },
  { id: 'a18', name: 'Grand Palace & Wat Pho', city: 'bangkok', category: 'Culture & History', cost: 18, duration: 150, rating: 4.6, reviews: 3300 },
  { id: 'a19', name: 'Chatuchak Market Crawl', city: 'bangkok', category: 'Shopping', cost: 0, duration: 200, rating: 4.5, reviews: 1900 },
  { id: 'a20', name: 'Table Mountain Cable Car', city: 'capetown', category: 'Nature & Parks', cost: 34, duration: 150, rating: 4.8, reviews: 2600 },
  { id: 'a21', name: 'Shark Cage Diving', city: 'capetown', category: 'Adventure', cost: 175, duration: 300, rating: 4.7, reviews: 890 },
]

export const cityById = (id) => CITIES.find((c) => c.id === id)
export const activitiesByCity = (id) => ACTIVITIES.filter((a) => a.city === id)
