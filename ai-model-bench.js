/**
 * Benchmarks candidate OpenRouter models on the real auto-plan prompt.
 *
 * Runs each model against several cities (a fresh prompt each time, so
 * OpenRouter's cache can't flatter the timings) and reports how often the
 * reply is usable and how long it took.
 *
 * Run with:  node -r dotenv/config ai-model-bench.js
 */
const { buildDaySchedule } = require('./src/utils/schedule');
const { parseAiJson } = require('./src/utils/aiJson');

const CANDIDATES = [
  'openai/gpt-4o-mini',
  'openai/gpt-4.1-nano',
  'mistralai/mistral-small-24b-instruct-2501',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
];

const CITIES = ['Lisbon', 'Seville', 'Osaka'];
const DAYS = 3;

const promptFor = (city) => `You are a world-class travel agent planning an itinerary for ${city}.
The user is staying for ${DAYS} days.
Their budget for activities and food is $600.
Their general preferences are: Culture & History, Food & Dining.
Their dietary preference is: Vegetarian.

RULES:
1. Produce EXACTLY ${DAYS} day object(s), numbered 1 to ${DAYS}. Never invent extra days.
2. You MUST schedule 3 meals a day (Breakfast, Lunch, Dinner) plus 1 Snack/Coffee break.
3. Suggest famous, highly-rated restaurants. ALL food MUST be Vegetarian.
4. GEO-CLUSTER: group activities geographically.
5. TIMING - every activity needs "startTime" AND "endTime" in 24-hour HH:MM, chronological, no overlaps, day between 08:00 and 23:30.
6. Respond ONLY with a valid JSON array representing the itinerary. No markdown.

JSON SCHEMA:
[{"day":1,"activities":[{"name":"Cafe","type":"Food","cost":25.00,"durationHours":1.5,"startTime":"08:30","endTime":"10:00"}]}]`;

function evaluate(content) {
  let parsed;
  try {
    parsed = parseAiJson(content);
  } catch {
    return { ok: false, note: 'unparseable' };
  }
  if (!Array.isArray(parsed)) return { ok: false, note: 'not an array' };

  const days = parsed.filter((d) => Number(d?.day) >= 1 && Number(d.day) <= DAYS);
  const items = days.reduce((n, d) => n + (d.activities?.length || 0), 0);
  if (days.length === 0 || items === 0) return { ok: false, note: 'no usable days' };

  // How much did our scheduler have to correct? Lower is better.
  let repaired = 0;
  for (const d of days) {
    const { scheduled, overflow } = buildDaySchedule(d.activities || []);
    repaired += overflow.length;
    for (const original of d.activities || []) {
      const placed = scheduled.find((x) => x.name === original.name);
      if (placed && original.startTime && placed.startTime !== original.startTime) repaired++;
    }
  }

  return { ok: true, note: `${days.length}/${DAYS} days, ${items} items, ${repaired} repaired` };
}

async function bench(model, city) {
  const started = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: promptFor(city) }] }),
      signal: AbortSignal.timeout(240000),
    });
    const secs = (Date.now() - started) / 1000;
    const data = await res.json();

    if (!res.ok) {
      return { secs, ok: false, note: `HTTP ${res.status} ${(data.error?.message || '').slice(0, 55)}` };
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { secs, ok: false, note: 'empty response' };

    return { secs, ...evaluate(content) };
  } catch (err) {
    const secs = (Date.now() - started) / 1000;
    return { secs, ok: false, note: err.name === 'TimeoutError' ? 'timed out' : err.message.slice(0, 55) };
  }
}

(async () => {
  console.log(`Auto-plan prompt, ${DAYS} days, ${CITIES.length} runs per model\n`);

  const summary = [];
  for (const model of CANDIDATES) {
    const runs = [];
    for (const city of CITIES) runs.push({ city, ...(await bench(model, city)) });

    const good = runs.filter((r) => r.ok);
    summary.push({
      model,
      successes: good.length,
      total: runs.length,
      avgSecs: good.length ? good.reduce((n, r) => n + r.secs, 0) / good.length : Infinity,
      worstSecs: good.length ? Math.max(...good.map((r) => r.secs)) : Infinity,
      runs,
    });
  }

  summary.sort((a, b) => (b.successes - a.successes) || (a.avgSecs - b.avgSecs));

  for (const r of summary) {
    const avg = Number.isFinite(r.avgSecs) ? `${r.avgSecs.toFixed(1)}s avg` : '  —  ';
    const worst = Number.isFinite(r.worstSecs) ? `${r.worstSecs.toFixed(1)}s worst` : '';
    console.log(`${r.successes}/${r.total}  ${avg.padStart(10)}  ${worst.padStart(12)}  ${r.model}`);
    for (const run of r.runs) {
      console.log(`          ${run.city.padEnd(9)} ${run.secs.toFixed(1).padStart(6)}s  ${run.ok ? run.note : 'FAIL: ' + run.note}`);
    }
  }

  const best = summary.find((r) => r.successes === r.total);
  console.log(best
    ? `\nRecommended: ${best.model} — ${best.successes}/${best.total} clean, ${best.avgSecs.toFixed(1)}s average, ${best.worstSecs.toFixed(1)}s worst`
    : '\nNo model succeeded on every run.');
})();
