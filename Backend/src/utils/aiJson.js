/**
 * Pulls JSON out of a model reply.
 *
 * Models are inconsistent: some return bare JSON, some wrap it in ```json
 * fences, some add a sentence before or after it. Rather than trusting any one
 * shape, this finds the first balanced JSON array or object in the text.
 */

function stripFences(text) {
  return text
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/**
 * Scans for the first `[`/`{` and returns the substring up to its matching
 * close, ignoring brackets that appear inside strings.
 */
function extractBalanced(text) {
  const openIndex = (() => {
    const a = text.indexOf('[');
    const o = text.indexOf('{');
    if (a === -1) return o;
    if (o === -1) return a;
    return Math.min(a, o);
  })();
  if (openIndex === -1) return null;

  const open = text[openIndex];
  const close = open === '[' ? ']' : '}';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];

    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(openIndex, i + 1);
    }
  }

  return null; // never closed — truncated reply
}

/**
 * Returns the parsed value, or throws an Error with a readable message.
 * `label` names the feature so the error tells you which call failed.
 */
function parseAiJson(content, label = 'AI') {
  if (typeof content !== 'string' || !content.trim()) {
    const err = new Error(`${label} returned an empty response.`);
    err.statusCode = 502;
    throw err;
  }

  const candidates = [stripFences(content), extractBalanced(content)].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next shape */
    }
  }

  const head = content.trim().slice(0, 120).replace(/\s+/g, ' ');
  const err = new Error(`${label} returned output we could not read. Please try again. (starts: "${head}")`);
  err.statusCode = 502;
  throw err;
}

/** Non-throwing variant for paths that prefer an empty result over an error. */
function tryParseAiJson(content, fallback = null) {
  try {
    return parseAiJson(content);
  } catch {
    return fallback;
  }
}

module.exports = { parseAiJson, tryParseAiJson, stripFences, extractBalanced };
