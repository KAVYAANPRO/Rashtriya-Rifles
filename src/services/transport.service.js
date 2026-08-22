const { OPENROUTER_MODEL, AI_TIMEOUT_MS } = require('../config/ai');
const { parseAiJson } = require('../utils/aiJson');

async function searchTransport(city) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    const err = new Error('Local transport lookup is not configured. Add OPENROUTER_API_KEY to the backend .env file.');
    err.statusCode = 503;
    err.code = 'SEARCH_NOT_CONFIGURED';
    throw err;
  }

  const prompt = `You are a local travel guide. The user needs transportation information for ${city}.
Provide realistic and highly accurate local transport details.
1. Provide 2-3 local cab services (e.g., Uber, Bolt, or specific local taxi companies like G7 in Paris, Yellow Cab in NYC). Include their phone numbers and booking URLs.
2. Provide 1-2 major modes of public transport available in the city (e.g., Metro, Bus, Tram) and a link to the official transit authority or app.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "cabs": [
    {
      "name": "string",
      "phoneNumber": "string",
      "bookingUrl": "string",
      "description": "string"
    }
  ],
  "publicTransport": [
    {
      "mode": "string",
      "bookingUrl": "string",
      "description": "string"
    }
  ]
}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await res.json();
    const content = aiData.choices[0].message.content.trim();
    
    return parseAiJson(content, 'Transport lookup');
  } catch (err) {
    console.error('AI Transport Error:', err);
    return { cabs: [], publicTransport: [] };
  }
}

module.exports = { searchTransport };
