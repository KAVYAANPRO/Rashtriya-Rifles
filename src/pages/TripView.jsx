import { useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { cityById } from '../store/mockData'
import { EmptyState } from '../components/ui'
import { fmtMoney, fmtRange, fmtDate, dayCount } from '../lib/format'

const CATEGORY_COLORS = {
  'Adventure': 'var(--ac)', 'Food & Dining': '#F59E0B', 'Culture & History': '#8B5CF6',
  'Shopping': '#EC4899', 'Nightlife': '#EF4444', 'Nature & Parks': 'var(--green)',
  'Photography': '#EAB308', 'Sports': '#C2410C', 'Wellness': '#14B8A6',
}

export default function TripView() {
  const { tripId } = useParams()
  const { getTrip, tripSpend } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState('day')
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

  if (!trip) return <Navigate to="/trips" replace />

  const spend = tripSpend(trip)
  const remaining = trip.budget - spend
  const overBudget = spend > trip.budget && trip.budget > 0
  const days = dayCount(trip.startDate, trip.endDate)
  const dailyAvg = days > 0 ? spend / days : 0

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-fade">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Itinerary &amp; budget</div>
      <div className="flex items-end justify-between gap-5 flex-wrap mt-3">
        <div>
          <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight m-0">{trip.name}</h1>
          <div className="text-sm text-[#6b6c80] font-semibold mt-2">{fmtRange(trip.startDate, trip.endDate)} · {trip.sections.length} stops · {days} days</div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <div onClick={() => navigate(`/trips/${trip.id}/builder`)} className="px-5 py-3 rounded-full border border-[#dfe1ec] bg-white text-sm font-bold cursor-pointer transition-all hover:border-[color:var(--ac)]" style={{ color: 'var(--ac-d)' }}>
            Edit itinerary
          </div>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5">
          <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">TOTAL BUDGET</div>
          <div className="text-2xl font-extrabold tracking-tight mt-2">{trip.budget > 0 ? fmtMoney(trip.budget, trip.currency) : 'No budget set'}</div>
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
                      <div className="text-sm font-bold">{a.name}</div>
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
