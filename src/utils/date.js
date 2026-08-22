/**
 * Date helpers.
 *
 * The UI sends plain calendar dates ("2026-04-02") from <input type="date">,
 * while Prisma needs a JS Date for @db.Date columns. Both forms are accepted
 * here so schemas can stay lenient without every service repeating the parse.
 */

function toDate(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value instanceof Date) return value;

  // Plain calendar date — pin it to midnight UTC so the stored day never
  // shifts because of the server's timezone.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error(`Invalid date: ${value}`);
    err.statusCode = 422;
    throw err;
  }
  return parsed;
}

/** Converts every listed key on `data` from a date string into a Date. */
function toDates(data, keys) {
  const out = { ...data };
  for (const key of keys) {
    if (out[key] !== undefined) out[key] = toDate(out[key]);
  }
  return out;
}

/** "2026-04-02" for a Date or date-ish value; used when talking back to the UI. */
function toDateString(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

module.exports = { toDate, toDates, toDateString };
