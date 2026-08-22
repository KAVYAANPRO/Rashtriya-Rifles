const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

const TOKEN_KEY = 'gt_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable — the session just won't persist */
  }
}

export class ApiError extends Error {
  constructor(message, { status, code, payload } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

function query(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, value)
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(
      `Cannot reach the API at ${BASE}. Is the backend running?`,
      { status: 0, code: 'NETWORK_ERROR' },
    )
  }

  let payload = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }

  if (!res.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed with status ${res.status}`
    throw new ApiError(message, {
      status: res.status,
      code: payload?.error?.code,
      payload,
    })
  }

  return payload?.data !== undefined ? payload.data : payload
}

/* ── auth ─────────────────────────────────────────────────────────── */

export const auth = {
  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  verifyEmail: (body) => request('/auth/verify-email', { method: 'POST', body, auth: false }),
  resendOtp: (body) => request('/auth/resend-otp', { method: 'POST', body, auth: false }),
  googleLogin: (idToken) => request('/auth/google-login', { method: 'POST', body: { idToken }, auth: false }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body, auth: false }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PATCH', body }),
}

/* ── catalog (public) ─────────────────────────────────────────────── */

export const catalog = {
  cities: (params) => request(`/catalog/cities${query(params)}`, { auth: false }),
  city: (id) => request(`/catalog/cities/${id}`, { auth: false }),
  categories: () => request('/catalog/categories', { auth: false }),
  activities: (params) => request(`/catalog/activities${query(params)}`, { auth: false }),
}

/* ── currency ─────────────────────────────────────────────────────── */

export const currency = {
  convert: (params) => request(`/currency/convert${query(params)}`, { auth: false }),
  supported: () => request('/currency/supported', { auth: false }),
}

/* ── trips ────────────────────────────────────────────────────────── */

export const trips = {
  list: () => request('/trips'),
  get: (tripId) => request(`/trips/${tripId}`),
  create: (body) => request('/trips', { method: 'POST', body }),
  update: (tripId, body) => request(`/trips/${tripId}`, { method: 'PATCH', body }),
  remove: (tripId) => request(`/trips/${tripId}`, { method: 'DELETE' }),
}

/* ── stops ────────────────────────────────────────────────────────── */

export const stops = {
  list: (tripId) => request(`/trips/${tripId}/stops`),
  add: (tripId, body) => request(`/trips/${tripId}/stops`, { method: 'POST', body }),
  update: (tripId, stopId, body) => request(`/trips/${tripId}/stops/${stopId}`, { method: 'PATCH', body }),
  remove: (tripId, stopId) => request(`/trips/${tripId}/stops/${stopId}`, { method: 'DELETE' }),
}

/* ── scheduled activities ─────────────────────────────────────────── */

export const tripActivities = {
  list: (tripId, stopId) => request(`/trips/${tripId}/stops/${stopId}/activities`),
  add: (tripId, stopId, body) =>
    request(`/trips/${tripId}/stops/${stopId}/activities`, { method: 'POST', body }),
  update: (tripId, stopId, id, body) =>
    request(`/trips/${tripId}/stops/${stopId}/activities/${id}`, { method: 'PATCH', body }),
  remove: (tripId, stopId, id) =>
    request(`/trips/${tripId}/stops/${stopId}/activities/${id}`, { method: 'DELETE' }),
}

/* ── budget ───────────────────────────────────────────────────────── */

export const budget = {
  get: (tripId) => request(`/trips/${tripId}/budget`),
  save: (tripId, body) => request(`/trips/${tripId}/budget`, { method: 'PUT', body }),
}

/* ── stop-scoped extras ───────────────────────────────────────────── */

export const recommendations = {
  forStop: (tripId, stopId) => request(`/trips/${tripId}/stops/${stopId}/recommendations/activities`),
}

export const events = {
  forStop: (tripId, stopId) => request(`/trips/${tripId}/stops/${stopId}/events`),
}

export const autoPlanner = {
  run: (tripId, stopId, body) =>
    request(`/trips/${tripId}/stops/${stopId}/auto-plan`, { method: 'POST', body }),
}

/* ── sharing ──────────────────────────────────────────────────────── */

export const share = {
  get: (tripId) => request(`/trips/${tripId}/share`),
  create: (tripId, body = { shareType: 'public', allowCopy: true }) =>
    request(`/trips/${tripId}/share`, { method: 'POST', body }),
  revoke: (tripId) => request(`/trips/${tripId}/share`, { method: 'DELETE' }),
  publicTrip: (slug) => request(`/public/trips/${slug}`, { auth: false }),
}

/* ── travel search ────────────────────────────────────────────────── */

export const travel = {
  flights: (params) => request(`/flights/search${query(params)}`),
  hotels: (params) => request(`/hotels/search${query(params)}`),
  transport: (city) => request(`/transport/search${query({ city })}`),
}

/* ── payments ─────────────────────────────────────────────────────── */

export const payment = {
  createOrder: () => request('/payment/create-order', { method: 'POST', body: {} }),
  verify: (body) => request('/payment/verify', { method: 'POST', body }),
  history: () => request('/payment/history'),
}

export const apiBaseUrl = BASE
