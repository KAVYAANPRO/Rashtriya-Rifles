const rateLimit = require('express-rate-limit');

// A single page of the SPA can fire a dozen calls, so the default ceiling is
// generous in development and tight in production. Override with RATE_LIMIT_MAX.
const defaultMax = process.env.NODE_ENV === 'production' ? 100 : 2000;

const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || defaultMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.', statusCode: 429 },
  },
});

module.exports = rateLimiter;
