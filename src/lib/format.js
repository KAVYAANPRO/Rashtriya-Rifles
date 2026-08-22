const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', INR: '₹' }

export function fmtMoney(amount, currency = 'USD') {
  const sym = SYMBOLS[currency] || currency + ' '
  const n = Number(amount) || 0
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d + 'T00:00:00')
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtRange(start, end) {
  if (!start || !end) return ''
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sameYear = s.getFullYear() === e.getFullYear()
  const sOpts = sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }
  return `${s.toLocaleDateString(undefined, sOpts)} – ${e.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function dayCount(start, end) {
  if (!start || !end) return 0
  const ms = new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00')
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

export function tripStatus(trip) {
  const today = new Date().toISOString().slice(0, 10)
  if (trip.endDate < today) return 'Past'
  if (trip.startDate > today) return 'Upcoming'
  return 'Ongoing'
}

/** "09:00 – 10:30", or just the start when no end is known. */
export function fmtTimeRange(start, end) {
  if (!start) return ''
  return end ? `${start} – ${end}` : start
}
