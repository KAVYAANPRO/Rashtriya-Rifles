/**
 * Sends each AI-backed prompt to the configured OPENROUTER_MODEL and reports
 * whether the reply survives the parsing the services actually do.
 * Run with:  node -r dotenv/config ai-model-check.js
 */
const { OPENROUTER_MODEL } = require('./src/config/ai');

const PROMPTS = {
  transport: `You are a local travel guide. The user needs transportation information for Paris.
Respond ONLY with a valid JSON object matching this exact schema:
{"cabs":[{"name":"string","phoneNumber":"string","bookingUrl":"string","description":"string"}],"publicTransport":[{"mode":"string","bookingUrl":"string","description":"string"}]}`,

  flights: `You are a travel agent. The user wants to fly from DEL to KIX on 2026-10-01 for 1 adults and 0 children.
Provide 3 realistic estimated flight options AND a 7-day price graph.
Respond ONLY with a valid JSON object matching this exact schema:
{"flights":[{"airline":"Delta","departureTime":"08:00 AM","arrivalTime":"10:30 AM","price":650,"duration":550,"layovers":0}],"priceGraph":[{"date":"YYYY-MM-DD","lowestPrice":750}]}`,

  hotels: `You are a travel agent. The user is looking for accommodation in Paris from 2026-10-01 to 2026-10-05 for 2 adults and 0 children.
Provide 3 options. Respond ONLY with a valid JSON array. Each object must have:
"name" (string), "type" ("Hotel" or "Airbnb"), "pricePerNight" (number), "totalPrice" (number), "rating" (number)`,

  events: `You are a helpful travel assistant. The user is visiting Kyoto from 2026-10-01 to 2026-10-05.
Suggest 3 cultural events. Respond ONLY with a valid JSON array of objects, no markdown.
Each object must have: "id","name","type","date" (YYYY-MM-DD),"time" (HH:MM:SS),"venue","bookingUrl","priceMin" (number),"priceMax" (number),"currency"`,

  autoplan: `You are a world-class travel agent planning an itinerary for Kyoto.
The user is staying for 2 days. Their budget is $600. Dietary preference: Vegetarian.
Schedule 3 meals a day plus a snack. Respond ONLY with a valid JSON array. No markdown.
[{"day":1,"activities":[{"name":"Cafe","type":"Food","cost":25.00,"durationHours":1.5,"startTime":"08:30"}]}]`,
};

/** The exact clean-up the services perform before JSON.parse. */
function clean(content) {
  return content.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
}

async function ask(prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, note: `HTTP ${res.status} ${data.error?.message || ''}`.slice(0, 90) };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return { ok: false, note: 'empty response' };

  try {
    const parsed = JSON.parse(clean(content));
    return { ok: true, note: `parsed ${Array.isArray(parsed) ? parsed.length + ' items' : 'object'}` };
  } catch (err) {
    const head = content.trim().slice(0, 70).replace(/\s+/g, ' ');
    return { ok: false, note: `JSON.parse failed — starts: "${head}"` };
  }
}

(async () => {
  console.log(`model: ${OPENROUTER_MODEL}\n`);
  for (const [name, prompt] of Object.entries(PROMPTS)) {
    const started = Date.now();
    const result = await ask(prompt);
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`${result.ok ? 'OK  ' : 'FAIL'} ${name.padEnd(11)}${secs.padStart(5)}s  ${result.note}`);
  }
})();
