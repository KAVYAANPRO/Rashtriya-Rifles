import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { currency as currencyApi, share as shareApi } from '../lib/api'
import { EmptyState, PageLoader, Field, SelectField, Panel, Chip, Loading, InlineError } from '../components/ui'
import { fmtMoney, fmtRange, fmtDate, dayCount, fmtTimeRange } from '../lib/format'

const CATEGORY_COLORS = {
  'Adventure': 'var(--ac)', 'Food & Dining': '#F59E0B', 'Culture & History': '#8B5CF6',
  'Shopping': '#EC4899', 'Nightlife': '#EF4444', 'Nature & Parks': 'var(--green)',
  'Photography': '#EAB308', 'Sports': '#C2410C', 'Wellness': '#14B8A6',
}

const BUDGET_PARTS = [
  { key: 'accommodationBudget', label: 'Accommodation' },
  { key: 'activitiesBudget', label: 'Activities' },
  { key: 'foodBudget', label: 'Food' },
  { key: 'transportationBudget', label: 'Transport' },
  { key: 'miscellaneousBudget', label: 'Miscellaneous' },
]

const CURRENCIES = ['USD', 'EUR', 'JPY', 'INR', 'GBP', 'AUD', 'CAD', 'SGD', 'CHF', 'ZAR', 'THB']

/** PATCH /trips/:id — name, dates, headline budget and currency. */
function TripDetailsForm({ trip, onClose }) {
  const { updateTripDetails } = useApp()
  const [form, setForm] = useState({
    tripName: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalBudget: trip.budget || '',
    currency: trip.currency,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.tripName.trim()) return setError('Give your trip a name.')
    if (form.endDate < form.startDate) return setError('End date must be on or after the start date.')
    if (Number(form.totalBudget) < 0) return setError('Budget cannot be negative.')

    setSaving(true)
    const res = await updateTripDetails(trip.id, {
      tripName: form.tripName.trim(),
      description: form.description || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      totalBudget: Number(form.totalBudget) || 0,
      currency: form.currency,
    })
    setSaving(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <form onSubmit={submit} className="mt-6 bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[15px] font-extrabold">Trip details</div>
        <button type="button" onClick={onClose} className="text-[#b7b9c9] hover:text-[#6b6c80] text-lg leading-none cursor-pointer">×</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Field label="Trip name" value={form.tripName} onChange={set('tripName')} />
        <Field label="Start date" type="date" value={form.startDate} onChange={set('startDate')} />
        <Field label="End date" type="date" value={form.endDate} onChange={set('endDate')} />
        <Field label="Total budget" type="number" min="0" value={form.totalBudget} onChange={set('totalBudget')} />
        <SelectField label="Currency" value={form.currency} onChange={set('currency')}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <Field label="Description" value={form.description} onChange={set('description')} placeholder="Optional" />
      </div>
      {error && <div className="mt-3"><InlineError>{error}</InlineError></div>}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--ac)' }}>
          {saving ? 'Saving…' : 'Save details'}
        </button>
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-[#dfe1ec] text-sm font-bold text-[#6b6c80] cursor-pointer">Cancel</button>
      </div>
    </form>
  )
}

/** GET /currency/convert — shows the total in the traveller's home currency. */
function ConvertedTotal({ trip, preferredCurrency }) {
  const [converted, setConverted] = useState(null)

  useEffect(() => {
    if (!preferredCurrency || preferredCurrency === trip.currency || !trip.budget) {
      setConverted(null)
      return
    }
    let alive = true
    currencyApi.convert({ amount: trip.budget, from: trip.currency, to: preferredCurrency })
      .then((data) => alive && setConverted(data.converted ? data : null))
      .catch(() => { /* conversion is a nicety — stay quiet if it isn't available */ })
    return () => { alive = false }
  }, [trip.budget, trip.currency, preferredCurrency])

  if (!converted) return null
  return (
    <div className="text-xs text-[#8b8ca0] mt-1">≈ {fmtMoney(converted.result, converted.to)}</div>
  )
}

/** PUT /trips/:id/budget — the category split behind the headline number. */
function BudgetPlanner({ trip, onClose }) {
  const { saveBudget } = useApp()
  const breakdown = trip.budgetBreakdown
  const [form, setForm] = useState(() =>
    Object.fromEntries(BUDGET_PARTS.map(({ key }) => [key, breakdown?.[key] ?? ''])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = BUDGET_PARTS.reduce((sum, { key }) => sum + (Number(form[key]) || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (BUDGET_PARTS.some(({ key }) => form[key] !== '' && Number(form[key]) < 0)) {
      return setError('Budgets cannot be negative.')
    }
    const payload = {}
    for (const { key } of BUDGET_PARTS) {
      if (form[key] !== '' && form[key] !== null) payload[key] = Number(form[key])
    }
    setSaving(true)
    const res = await saveBudget(trip.id, payload)
    setSaving(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUDGET_PARTS.map(({ key, label }) => (
          <Field
            key={key}
            label={label}
            type="number"
            min="0"
            step="1"
            value={form[key]}
            placeholder="0"
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
        ))}
      </div>
      {error && <div className="mt-3"><InlineError>{error}</InlineError></div>}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--ac)' }}>
          {saving ? 'Saving…' : 'Save budget'}
        </button>
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-[#dfe1ec] text-sm font-bold text-[#6b6c80] cursor-pointer">Cancel</button>
        <div className="mono text-xs font-bold text-[#6b6c80]">Total {fmtMoney(total, trip.currency)}</div>
      </div>
    </form>
  )
}

/** POST/GET/DELETE /trips/:id/share — the public read-only link. */
function SharePanel({ trip, onClose }) {
  const { notify, reloadTrip } = useApp()
  const [state, setState] = useState({ loading: true, error: '', slug: trip.shareSlug || null })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    shareApi.get(trip.id)
      .then((data) => alive && setState({ loading: false, error: '', slug: data?.shareUrlSlug || null }))
      .catch((err) => alive && setState({ loading: false, error: err.message, slug: null }))
    return () => { alive = false }
  }, [trip.id])

  const url = state.slug ? `${window.location.origin}/t/${state.slug}` : ''

  const create = async () => {
    setBusy(true)
    try {
      const data = await shareApi.create(trip.id)
      setState({ loading: false, error: '', slug: data.shareUrlSlug })
      await reloadTrip(trip.id)
    } catch (err) {
      setState((s) => ({ ...s, error: err.message }))
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    setBusy(true)
    try {
      await shareApi.revoke(trip.id)
      setState({ loading: false, error: '', slug: null })
      await reloadTrip(trip.id)
      notify('Share link revoked.', 'info')
    } catch (err) {
      setState((s) => ({ ...s, error: err.message }))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      notify('Link copied.', 'success')
    } catch {
      notify('Copy failed — select the link and copy it manually.', 'error')
    }
  }

  return (
    <div className="mt-6 bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[15px] font-extrabold">Share this trip</div>
        <button onClick={onClose} className="text-[#b7b9c9] hover:text-[#6b6c80] text-lg leading-none cursor-pointer">×</button>
      </div>

      {state.loading && <Loading label="Checking your share link…" />}
      {state.error && <div className="mt-3"><InlineError>{state.error}</InlineError></div>}

      {!state.loading && !state.slug && (
        <>
          <p className="text-[13px] text-[#6b6c80] mt-2 leading-relaxed max-w-[520px]">
            Creates a read-only public page with your stops and activities. Your budget is never included.
          </p>
          <button
            onClick={create}
            disabled={busy}
            className="mt-4 px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--ac)' }}
          >
            {busy ? 'Creating…' : 'Create share link'}
          </button>
        </>
      )}

      {!state.loading && state.slug && (
        <>
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            <Chip tone="green">Public</Chip>
            <Chip>{trip.viewCount} views</Chip>
          </div>
          <Panel className="mt-3 flex items-center gap-3 flex-wrap">
            <a href={url} target="_blank" rel="noreferrer" className="mono text-xs font-bold break-all flex-1 min-w-[200px]" style={{ color: 'var(--ac-d)' }}>
              {url}
            </a>
            <button onClick={copy} className="px-4 py-2 rounded-full bg-[var(--ink)] text-white text-xs font-bold cursor-pointer">Copy</button>
            <button onClick={revoke} disabled={busy} className="px-3 py-2 rounded-full border border-[#f0d0d0] text-red-500 text-xs font-bold cursor-pointer disabled:opacity-50">
              {busy ? '…' : 'Revoke'}
            </button>
          </Panel>
        </>
      )}
    </div>
  )
}

export default function TripView() {
  const { tripId } = useParams()
  const { getTrip, tripSpend, tripsLoaded, cityById, currentUser } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState('day')
  const [editingBudget, setEditingBudget] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [sharing, setSharing] = useState(false)
  const trip = getTrip(tripId)

  const allActivities = useMemo(() => {
    if (!trip) return []
    return trip.sections.flatMap((s) => s.activities.map((a) => ({ ...a, sectionTitle: s.title, cityId: s.cityId })))
  }, [trip])

  const byDay = useMemo(() => {
    const map = {}
    allActivities.forEach((a) => {
      map[a.date] = map[a.date] || []
      map[a.date].push(a)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [allActivities])

  const byCategory = useMemo(() => {
    const map = {}
    allActivities.forEach((a) => {
      map[a.category] = (map[a.category] || 0) + (Number(a.cost) || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allActivities])

  if (!tripsLoaded) return <PageLoader label="Loading your trip…" />
  if (!trip) return <Navigate to="/trips" replace />

  const spend = tripSpend(trip)
  const remaining = trip.budget - spend
  const overBudget = spend > trip.budget && trip.budget > 0
  const days = dayCount(trip.startDate, trip.endDate)
  const dailyAvg = days > 0 ? spend / days : 0
  const breakdown = trip.budgetBreakdown
  const hasBreakdown = breakdown && BUDGET_PARTS.some(({ key }) => Number(breakdown[key]) > 0)

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-fade">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Itinerary &amp; budget</div>
      <div className="flex items-end justify-between gap-5 flex-wrap mt-3">
        <div>
          <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight m-0">{trip.name}</h1>
          <div className="text-sm text-[#6b6c80] font-semibold mt-2">{fmtRange(trip.startDate, trip.endDate)} · {trip.sections.length} stops · {days} days</div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <div onClick={() => setEditingDetails((v) => !v)} className="px-5 py-3 rounded-full border border-[#dfe1ec] bg-white text-sm font-bold cursor-pointer transition-all hover:border-[color:var(--ac)]" style={{ color: 'var(--ac-d)' }}>
            Edit details
          </div>
          <div onClick={() => setSharing((v) => !v)} className="px-5 py-3 rounded-full border border-[#dfe1ec] bg-white text-sm font-bold cursor-pointer transition-all hover:border-[color:var(--ac)]" style={{ color: 'var(--ac-d)' }}>
            Share
          </div>
          <div onClick={() => navigate(`/trips/${trip.id}/builder`)} className="px-5 py-3 rounded-full border border-[#dfe1ec] bg-white text-sm font-bold cursor-pointer transition-all hover:border-[color:var(--ac)]" style={{ color: 'var(--ac-d)' }}>
            Edit itinerary
          </div>
        </div>
      </div>

      {editingDetails && <TripDetailsForm trip={trip} onClose={() => setEditingDetails(false)} />}
      {sharing && <SharePanel trip={trip} onClose={() => setSharing(false)} />}

      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5">
          <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">TOTAL BUDGET</div>
          <div className="text-2xl font-extrabold tracking-tight mt-2">{trip.budget > 0 ? fmtMoney(trip.budget, trip.currency) : 'No budget set'}</div>
          <ConvertedTotal trip={trip} preferredCurrency={currentUser?.currency} />
        </div>
        <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5">
          <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">ESTIMATED SPEND</div>
          <div className="text-2xl font-extrabold tracking-tight mt-2">{fmtMoney(spend, trip.currency)}</div>
          <div className="text-xs text-[#8b8ca0] mt-1">{fmtMoney(dailyAvg, trip.currency)}/day avg</div>
        </div>
        <div className={`rounded-3xl p-5 border ${overBudget ? 'bg-red-50 border-red-200' : 'bg-white border-[#e6e7f0]'}`}>
          <div className="mono text-[10px] tracking-widest" style={{ color: overBudget ? '#dc2626' : '#8b8ca0' }}>{overBudget ? 'OVER BUDGET' : 'REMAINING'}</div>
          <div className={`text-2xl font-extrabold tracking-tight mt-2 ${overBudget ? 'text-red-600' : ''}`}>
            {trip.budget > 0 ? fmtMoney(Math.abs(remaining), trip.currency) : '—'}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[15px] font-extrabold">Planned budget by category</div>
          {!editingBudget && (
            <div onClick={() => setEditingBudget(true)} className="px-4.5 py-2.5 rounded-full border border-[#dfe1ec] text-[13px] font-bold cursor-pointer transition-all hover:border-[color:var(--ac)]" style={{ color: 'var(--ac-d)' }}>
              {hasBreakdown ? 'Edit' : 'Set budget'}
            </div>
          )}
        </div>

        {editingBudget ? (
          <BudgetPlanner trip={trip} onClose={() => setEditingBudget(false)} />
        ) : hasBreakdown ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
              {BUDGET_PARTS.map(({ key, label }) => (
                <div key={key} className="p-3.5 rounded-2xl bg-[#f7f8fc] border border-[#eceef4]">
                  <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">{label.toUpperCase()}</div>
                  <div className="text-[15px] font-bold mt-1.5">{fmtMoney(breakdown[key] || 0, trip.currency)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap mt-3.5">
              <Chip tone="accent">Planned total {fmtMoney(breakdown.totalBudget || 0, trip.currency)}</Chip>
              <Chip>{fmtMoney(breakdown.plannedActivitiesSpend || 0, trip.currency)} of activities scheduled</Chip>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#6b6c80] mt-2 leading-relaxed max-w-[560px]">
            Split your budget across accommodation, activities, food, transport and extras — the itinerary
            builder then only suggests activities that still fit.
          </p>
        )}
      </div>

      {byCategory.length > 0 && (
        <div className="mt-6 bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
          <div className="text-[15px] font-extrabold mb-4">Category breakdown</div>
          <div className="flex flex-col gap-3">
            {byCategory.map(([cat, amt]) => {
              const pct = spend > 0 ? Math.round((amt / spend) * 100) : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-bold text-[#3c3d52] mb-1.5">
                    <span>{cat}</span>
                    <span className="mono">{fmtMoney(amt, trip.currency)} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f0f1f7] overflow-hidden">
                    <div className="h-full rounded-full anim-grow" style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || 'var(--ac)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-tight">Itinerary</h2>
        <div className="flex gap-1 bg-[#f0f1f7] rounded-full p-1">
          {['day', 'city'].map((v) => (
            <div key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer capitalize transition-transform hover:-translate-y-0.5 ${view === v ? 'bg-white shadow' : 'text-[#6b6c80]'}`}>
              {v === 'day' ? 'Day list' : 'By city'}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {allActivities.length === 0 ? (
          <EmptyState title="No activities scheduled yet" subtitle="Add activities from the itinerary builder or the activity search." />
        ) : view === 'day' ? (
          <div className="flex flex-col gap-4">
            {byDay.map(([date, items]) => (
              <div key={date} className="bg-white border border-[#e9eaf2] rounded-3xl p-5">
                <div className="text-[15px] font-extrabold tracking-tight">{fmtDate(date)}</div>
                <div className="text-xs text-[#8b8ca0] mt-0.5">{cityById(items[0].cityId)?.name}</div>
                <div className="flex flex-col gap-2 mt-3.5">
                  {items.map((a) => (
                    <div key={a.id} className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-[#f7f8fc]">
                      <div className="text-sm font-bold">{a.name}{a.startTime ? <span className="text-xs text-[#8b8ca0] font-normal"> · {fmtTimeRange(a.startTime, a.endTime)}</span> : null}</div>
                      <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(a.cost, trip.currency)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trip.sections.filter((s) => s.activities.length > 0).map((s) => (
              <div key={s.id} className="bg-white border border-[#e9eaf2] rounded-3xl p-5">
                <div className="text-[15px] font-extrabold tracking-tight">{cityById(s.cityId)?.name} — {s.title}</div>
                <div className="flex flex-col gap-2 mt-3.5">
                  {s.activities.map((a) => (
                    <div key={a.id} className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-[#f7f8fc]">
                      <div className="text-sm font-bold">{a.name} <span className="text-xs text-[#8b8ca0] font-normal">· {fmtDate(a.date)}</span></div>
                      <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(a.cost, trip.currency)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
