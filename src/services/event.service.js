const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLiveEvents(userId, tripId, stopId) {
  // 1. Validate stop and trip
  const stop = await prisma.stop.findFirst({
    where: { id: stopId, tripId },
    include: { city: true, trip: true }
  });

  if (!stop || stop.trip.userId !== userId) {
    throw new Error('Stop not found or unauthorized');
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
  // Using city name, start and end dates, sorting by date
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(stop.city.cityName)}&startDateTime=${startDateTime}&endDateTime=${endDateTime}&sort=date,asc`;
    const res = await fetch(url);
    const data = await res.json();

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
    const events = data._embedded.events.map(event => {
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
        currency: event.priceRanges?.[0]?.currency
      };
    });

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
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
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
    const cleanContent = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
    
    const events = JSON.parse(cleanContent);
    return events;

  } catch (err) {
    console.error('Error fetching events from OpenRouter:', err);
    return []; // Return empty array on AI failure so we don't crash the frontend
  }
}

function returnMockEvents(cityName, startDate, endDate) {
  // Returns fake data to prevent crashes if API key is missing
  return [
    {
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
