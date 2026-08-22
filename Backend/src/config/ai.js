/**
 * Which OpenRouter model the AI-backed features use.
 *
 * Defaults to a small paid model. Set OPENROUTER_MODEL in .env to switch —
 * useful when the account has no credit, e.g.
 *   OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
 *
 * Free models are considerably slower: a 3-day auto-plan takes ~11s on
 * openai/gpt-4o-mini and over two minutes on the free Nemotron.
 */
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

/** Give up on a stuck upstream rather than hanging the browser forever. */
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 240000;

module.exports = { OPENROUTER_MODEL, AI_TIMEOUT_MS };
