const prisma = require('../config/prisma');
const { OPENROUTER_MODEL, AI_TIMEOUT_MS } = require('../config/ai');
const { parseAiJson } = require('../utils/aiJson');
async function getLiveEvents(userId, tripId, stopId) {
  // 1. Validate stop and trip
  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId },
    include: { city: true, trip: true }
  });

  if (!stop || stop.trip.userId !== userId) {
    const err = new Error('Stop not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey || apiKey === 'your_ticketmaster_api_key_here') {
    console.warn('TICKETMASTER_API_KEY is not set. Returning mocked events.');
    return returnMockEvents(stop.city.cityName, stop.startDate, stop.endDate);
  }

  // 2. Format dates for Ticketmaster (e.g. 2026-10-01T00:00:00Z)
  const startDateTime = new Date(stop.startDate).toISOString().slice(0, 19) + 'Z';
  const endDateTime = new Date(stop.endDate).toISOString().slice(0, 19) + 'Z';

  // 3. Fetch from Ticketmaster Discovery API
  //
  // locale=* is essential: without it the Discovery API answers in the key's
  // default locale (en-us) and returns ZERO results for every non-US city —
  // Paris goes from 0 to ~1,300 events purely by adding it.
  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      city: stop.city.cityName,
      locale: '*',
      startDateTime,
      endDateTime,
      sort: 'date,asc',
      // Over-fetch: the same attraction is listed once per day, so the raw
      // first page is all day one. We de-duplicate below.
      size: '50',
    });
    // Narrow by country when we know it, so "Paris, Texas" doesn't leak in.
    if (stop.city.countryCode) params.set('countryCode', stop.city.countryCode);

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.fault) {
      console.warn('Ticketmaster fault:', data.fault.faultstring);
    }

    if (!data._embedded || !data._embedded.events || data._embedded.events.length === 0) {
      // 3.5 Fallback to OpenRouter AI if Ticketmaster returns 0 events
      const aiKey = process.env.OPENROUTER_API_KEY;
      if (aiKey && aiKey !== 'your_openrouter_api_key_here') {
        console.log(`0 events found on Ticketmaster for ${stop.city.cityName}. Falling back to OpenRouter AI...`);
        return await fetchEventsFromAI(aiKey, stop.city.cityName, stop.startDate, stop.endDate);
      } else {
        console.log(`0 events found on Ticketmaster for ${stop.city.cityName} and OPENROUTER_API_KEY is not set. Returning empty array.`);
        return [];
      }
    }

    // 4. Map the response to a clean format
    const mapped = data._embedded.events.map(event => {
      return {
        id: event.id,
        name: event.name,
        type: event.classifications?.[0]?.segment?.name || 'Event',
        date: event.dates?.start?.localDate,
        time: event.dates?.start?.localTime,
        venue: event._embedded?.venues?.[0]?.name,
        bookingUrl: event.url,
        imageUrl: event.images?.[0]?.url,
        priceMin: event.priceRanges?.[0]?.min,
        priceMax: event.priceRanges?.[0]?.max,
        currency: event.priceRanges?.[0]?.currency,
        source: 'ticketmaster',
      };
    });

    // Long-running exhibitions repeat for every date in the range; keep the
    // earliest showing of each so the list is 12 different things to do.
    const seen = new Set();
    const events = [];
    for (const event of mapped) {
      const key = `${event.name}|${event.venue || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push(event);
      if (events.length === 12) break;
    }

    return events;
  } catch (err) {
    console.error('Error fetching Ticketmaster events:', err);
    throw new Error('Failed to fetch live events from external API');
  }
}

async function fetchEventsFromAI(apiKey, cityName, startDate, endDate) {
  const startStr = new Date(startDate).toISOString().split('T')[0];
  const endStr = new Date(endDate).toISOString().split('T')[0];

  const prompt = `You are a helpful travel assistant. The user is visiting ${cityName} from ${startStr} to ${endStr}.
There are no major Ticketmaster concerts. Suggest 3 cultural events, recurring local festivals, seasonal markets, or highly popular nightlife/arts activities they could attend during this time.
Respond ONLY with a valid JSON array of objects. Do not include markdown formatting or backticks.
Each object must have these exact keys:
- "id": a unique string (e.g., "ai-event-1")
- "name": string
- "type": string (e.g., "Cultural", "Market", "Nightlife")
- "date": string (YYYY-MM-DD format, must be between ${startStr} and ${endStr})
- "time": string (HH:MM:SS format)
- "venue": string
- "bookingUrl": string (just use "https://google.com/search?q=XYZ" where XYZ is the URL encoded event name)
- "priceMin": number (estimate, use 0 if free)
- "priceMax": number (estimate)
- "currency": string (e.g., "USD" or local currency)
`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    if (!data.choices || data.choices.length === 0) {
      console.warn('OpenRouter returned empty response');
      return [];
    }

    const content = data.choices[0].message.content.trim();
    // In case the model returns markdown backticks anyway
    
    const events = parseAiJson(content, 'Event suggestions');
    // Tag these so the UI can say they are suggestions, not bookable listings.
    return events.map((e) => ({ ...e, source: 'ai' }));

  } catch (err) {
    console.error('Error fetching events from OpenRouter:', err);
    return []; // Return empty array on AI failure so we don't crash the frontend
  }
}

function returnMockEvents(cityName, startDate, endDate) {
  // Returns fake data to prevent crashes if API key is missing
  return [
    {
      source: 'sample',
      id: 'mock-1',
      name: `Epic Symphony Orchestra in ${cityName}`,
      type: 'Music',
      date: new Date(startDate).toISOString().split('T')[0],
      time: '19:00:00',
      venue: `${cityName} Grand Hall`,
      bookingUrl: 'https://ticketmaster.com',
      priceMin: 45,
      priceMax: 120,
      currency: 'USD'
    },
    {
      source: 'sample',
      id: 'mock-2',
      name: `${cityName} Comedy Festival`,
      type: 'Arts & Theatre',
      date: new Date(endDate).toISOString().split('T')[0],
      time: '20:30:00',
      venue: `The Laughing Post`,
      bookingUrl: 'https://ticketmaster.com',
      priceMin: 25,
      priceMax: 25,
      currency: 'USD'
    }
  ];
}

module.exports = { getLiveEvents };
