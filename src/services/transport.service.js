async function searchTransport(city) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    throw new Error('No API keys configured for transport search.');
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
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await res.json();
    const content = aiData.choices[0].message.content.trim();
    const cleanContent = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
    
    return JSON.parse(cleanContent);
  } catch (err) {
    console.error('AI Transport Error:', err);
    return { cabs: [], publicTransport: [] };
  }
}

module.exports = { searchTransport };
