const SUPPORTED = ['USD', 'EUR', 'JPY', 'INR', 'GBP', 'AUD', 'CAD', 'SGD', 'CHF', 'ZAR', 'THB'];

/** Keys are sometimes pasted with stray slashes or whitespace — trim them. */
function apiKey() {
  const raw = (process.env.EXCHANGE_RATE_API_KEY || '').trim().replace(/^\/+|\/+$/g, '');
  return raw && raw !== 'your_exchange_rate_api_key_here' ? raw : null;
}

/**
 * Static fallback rates, expressed per 1 USD. Used when no live rate provider
 * is configured (or the key is rejected) so the app still shows real numbers.
 * Override the headline one with USD_TO_INR in .env.
 */
const STATIC_RATES_PER_USD = {
  USD: 1,
  INR: Number(process.env.USD_TO_INR) || 94,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157,
  AUD: 1.52,
  CAD: 1.36,
  SGD: 1.35,
  CHF: 0.88,
  ZAR: 18.5,
  THB: 36,
};

function staticRate(from, to) {
  const f = STATIC_RATES_PER_USD[from];
  const t = STATIC_RATES_PER_USD[to];
  if (!f || !t) return null;
  return t / f;
}

function isConfigured() {
  return Boolean(apiKey());
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;

  if (!isConfigured()) {
    console.warn('EXCHANGE_RATE_API_KEY not set. Falling back to 1:1 conversion.');
    return amount;
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey()}/pair/${fromCurrency}/${toCurrency}/${amount}`,
    );
    const data = await res.json();
    if (data.result === 'success') {
      return data.conversion_result;
    }
    console.warn('Currency conversion rejected:', data['error-type'] || data.result);
    return amount;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount;
  }
}

/**
 * Same conversion, but the caller can tell whether a real rate was applied —
 * the UI only shows a converted figure when it means something.
 */
async function convert(amount, fromCurrency, toCurrency) {
  const from = String(fromCurrency || '').toUpperCase();
  const to = String(toCurrency || '').toUpperCase();

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    const err = new Error('from and to must be 3-letter currency codes');
    err.statusCode = 422;
    throw err;
  }

  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    const err = new Error('amount must be a non-negative number');
    err.statusCode = 422;
    throw err;
  }

  if (from === to) {
    return { amount: numeric, from, to, result: numeric, converted: true, rateApplied: 1, source: 'identity' };
  }

  // Try the live provider first; fall back to the static table.
  if (isConfigured()) {
    const live = await convertCurrency(numeric, from, to);
    if (live !== numeric) {
      return {
        amount: numeric, from, to, result: live, converted: true,
        rateApplied: numeric > 0 ? live / numeric : null, source: 'live',
      };
    }
  }

  const rate = staticRate(from, to);
  if (rate === null) {
    return { amount: numeric, from, to, result: numeric, converted: false, rateApplied: null, source: 'none' };
  }

  return {
    amount: numeric,
    from,
    to,
    result: Math.round(numeric * rate * 100) / 100,
    converted: true,
    rateApplied: rate,
    source: 'static',
  };
}

module.exports = { convertCurrency, convert, isConfigured, staticRate, SUPPORTED, STATIC_RATES_PER_USD };
