async function searchFlights(origin, destination, date, returnDate) {
  const serpapiKey = process.env.SERPAPI_KEY;

  if (serpapiKey && serpapiKey !== 'your_serpapi_key_here' && !serpapiKey.startsWith('http')) {
    const flights = await searchFlightsSerpApi(origin, destination, date, returnDate, serpapiKey);
    if (flights && flights.length > 0) return flights;
    console.log('SerpApi returned no flights or failed. Falling back to AI...');
  }
  
  console.log('Using AI Fallback for flight estimates...');
  return await searchFlightsAI(origin, destination, date, returnDate);
}

async function searchFlightsSerpApi(origin, destination, date, returnDate, apiKey) {
  // SerpApi Google Flights Integration
  let url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${destination}&outbound_date=${date}&currency=USD&hl=en&api_key=${apiKey}`;
  if (returnDate) {
    url += `&return_date=${returnDate}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('SerpApi Response snippet:', Object.keys(data), data.error || '');
    
    if (!data.best_flights || data.best_flights.length === 0) {
      return [];
    }

    // Map SerpApi response to our standard format
    const mappedFlights = data.best_flights.map(flight => ({
      id: flight.flights[0]?.flight_number || 'unknown',
      airline: flight.flights[0]?.airline || 'Multiple Airlines',
      departureTime: flight.flights[0]?.departure_airport?.time || 'Unknown',
      arrivalTime: flight.flights[flight.flights.length - 1]?.arrival_airport?.time || 'Unknown',
      price: flight.price || 0,
      currency: 'USD',
      bookingUrl: data.search_metadata?.google_flights_url || `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${date}`,
      duration: flight.total_duration || 0,
      layovers: flight.layovers ? flight.layovers.length : 0
    }));

    return {
      flights: mappedFlights,
      priceGraph: [] // SerpApi price graph extraction is complex, leaving empty for now
    };
  } catch (err) {
    console.error('SerpApi Error:', err);
    throw new Error('Failed to fetch real-time flights.');
  }
}

async function searchFlightsAI(origin, destination, date, returnDate) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    throw new Error('No API keys configured for flight search.');
  }

  const prompt = `You are a travel agent. The user wants to fly from ${origin} to ${destination} on ${date}${returnDate ? ` returning on ${returnDate}` : ''}.
Provide 3 realistic estimated flight options (Economy), AND a 7-day price graph showing the lowest price for flights 3 days before, the requested date, and 3 days after.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "flights": [
    {
      "airline": "Delta",
      "departureTime": "08:00 AM",
      "arrivalTime": "10:30 AM",
      "price": 650,
      "duration": 550,
      "layovers": 0
    }
  ],
  "priceGraph": [
    { "date": "YYYY-MM-DD", "lowestPrice": 750 }
  ]
}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await res.json();
    const content = aiData.choices[0].message.content.trim();
    const cleanContent = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const result = JSON.parse(cleanContent);

    // Map AI results and dynamically inject the Google Flights search URL!
    const mappedFlights = result.flights.map((f, i) => ({
      id: `ai-flight-${i}`,
      airline: f.airline,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      price: f.price,
      currency: 'USD',
      bookingUrl: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${date}`,
      duration: f.duration,
      layovers: f.layovers,
      isAiEstimate: true
    }));

    return {
      flights: mappedFlights,
      priceGraph: result.priceGraph || []
    };

  } catch (err) {
    console.error('AI Flight Error:', err);
    return [];
  }
}

module.exports = {
  searchFlights
};
