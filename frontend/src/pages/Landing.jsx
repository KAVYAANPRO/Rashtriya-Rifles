import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { EmptyState } from '../components/ui'
import { fmtMoney, fmtRange, tripStatus, dayCount } from '../lib/format'

export default function Landing() {
  const { currentUser, userTrips, tripSpend, cities } = useApp()
  const navigate = useNavigate()

  const recentTrips = [...userTrips].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)
  const savedCities = cities.length

  // Headline the trip they're actually about to take, rather than fixed copy.
  const nextTrip = [...userTrips]
    .filter((t) => tripStatus(t) !== 'Past')
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] || null

  const withCities = nextTrip?.sections?.filter((sec) => sec.cityName) || []
  const origin = withCities[0]?.cityName || null
  const destination = withCities[withCities.length - 1]?.cityName || null

  const headline = origin
    ? (destination && destination !== origin ? `${origin} to ${destination}.` : `${origin}, sorted.`)
    : 'Two weeks, five cities, one plan.'

  const subline = nextTrip
    ? `${dayCount(nextTrip.startDate, nextTrip.endDate)} days · ${nextTrip.sections.length} stop${nextTrip.sections.length === 1 ? '' : 's'} · ${fmtMoney(nextTrip.budget, nextTrip.currency)} budget. Everything below updates as you plan.`
    : 'Pick your stops, drop in activities, and watch the budget update as the itinerary takes shape.'

  return (
    <div className="anim-fade">
      <div className="relative bg-[var(--ink)] overflow-hidden py-10 md:py-20 pb-24 md:pb-32">
        <div className="absolute w-[760px] h-[760px] -left-[180px] -top-[320px] rounded-full opacity-45 blur-xl" style={{ background: 'radial-gradient(circle at 45% 45%, var(--ac) 0%, transparent 66%)' }} />
        <div className="absolute w-[560px] h-[560px] -right-[120px] -bottom-[260px] rounded-full opacity-40 blur-2xl" style={{ background: 'radial-gradient(circle at 50% 50%, var(--ac2) 0%, transparent 64%)' }} />
        <div className="relative max-w-[1320px] mx-auto px-4 md:px-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold text-[color:color-mix(in_oklch,var(--ac)_55%,white)]">
              Welcome back, {currentUser.firstName || currentUser.username}
            </div>
            <h1 className="text-white text-[clamp(36px,5.4vw,62px)] font-extrabold tracking-tight leading-[1.02] mt-4">
              {headline}
            </h1>
            <p className="text-white/60 text-[17px] leading-relaxed max-w-[480px] mt-4 mb-7">
              {subline}
            </p>
            <div className="flex gap-3 flex-wrap">
              <div onClick={() => navigate('/trips/new')} className="px-7 py-4 rounded-full bg-white text-[var(--ink)] text-[15px] font-bold cursor-pointer transition-transform hover:-translate-y-0.5">
                Plan a trip
              </div>
              <div onClick={() => navigate('/search')} className="px-7 py-4 rounded-full border border-white/25 text-white text-[15px] font-bold cursor-pointer transition-all hover:bg-white/10">
                Browse activities
              </div>
            </div>
          </div>
          <div className="relative min-h-[220px] hidden md:block">
            <div className="rounded-3xl overflow-hidden border border-white/10 h-[260px]" style={{ background: 'repeating-linear-gradient(135deg,#22223a 0 10px,#2b2b45 10px 20px)' }} />
            <div className="absolute -left-2 -bottom-6 bg-white rounded-2xl px-5 py-4 shadow-2xl">
              <div className="mono text-[10px] tracking-widest text-[#8b8ca0]">NEXT DEPARTURE</div>
              <div className="text-[19px] font-extrabold tracking-tight mt-1.5">
                {nextTrip ? nextTrip.name : 'No trips yet'}
              </div>
            </div>
            <div className="absolute -right-2 -top-6 rounded-2xl px-5 py-4 text-white shadow-2xl" style={{ background: 'var(--ac)' }}>
              <div className="mono text-[10px] tracking-widest opacity-75">SAVED CITIES</div>
              <div className="text-[19px] font-extrabold tracking-tight mt-1.5">{savedCities} places</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-10 -mt-14 relative z-10">
        <div className="bg-white border border-[#e6e7f0] rounded-3xl p-3.5 flex gap-3 flex-wrap items-center shadow-[0_30px_70px_-40px_rgba(30,26,80,0.4)]">
          <div className="flex-1 min-w-[220px] flex items-center gap-2.5 px-3.5 h-12 rounded-xl bg-[#F7F9FC]">
            <div className="w-3.5 h-3.5 border-2 border-[#9a9cb0] rounded-full" />
            <input onFocus={() => navigate('/search')} readOnly placeholder="Search cities, activities or trips…" className="flex-1 border-none bg-transparent text-[15px] outline-none cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-10 pt-14">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-tight">Top regional selections</h2>
          <div onClick={() => navigate('/search')} className="text-sm font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>See all cities →</div>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cities.slice(0, 4).map((c) => (
            <div key={c.id} onClick={() => navigate('/search')} className="bg-white border border-[#e9eaf2] rounded-3xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-2 hover:shadow-2xl">
              <div className="h-[150px] grid place-items-center text-[#8b8ca0] mono text-[10px] tracking-widest uppercase" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 9px,#f6f7fc 9px 18px)' }}>{c.name}</div>
              <div className="p-4">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="text-[17px] font-extrabold tracking-tight">{c.name}</div>
                  <div className="mono text-[10px] text-[#8b8ca0]">{c.cost}</div>
                </div>
                <div className="text-[13px] text-[#6b6c80] mt-1 font-semibold">{c.country}</div>
                <div className="mt-3.5 flex gap-1.5 flex-wrap">
                  <div className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--ac-w)', color: 'var(--ac-d)' }}>{c.tag}</div>
                  <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f2f3f8] text-[#6b6c80]">{c.stay}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-14 pb-24">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-tight">Previous trips</h2>
          <div onClick={() => navigate('/trips')} className="text-sm font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>All my trips →</div>
        </div>
        <div className="mt-5">
          {recentTrips.length === 0 ? (
            <EmptyState title="No trips yet" subtitle="Plan your first trip and it'll show up here." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentTrips.map((t) => {
                const spend = tripSpend(t)
                return (
                  <div key={t.id} onClick={() => navigate(`/trips/${t.id}`)} className="bg-white border border-[#e9eaf2] rounded-3xl p-5 flex gap-4 items-center cursor-pointer transition-transform hover:-translate-y-2 hover:shadow-2xl">
                    <div className="w-[76px] h-[76px] shrink-0 rounded-2xl" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 8px,#f6f7fc 8px 16px)' }} />
                    <div className="min-w-0">
                      <div className="text-[16px] font-extrabold tracking-tight truncate">{t.name}</div>
                      <div className="text-[13px] text-[#6b6c80] mt-1 font-semibold">{fmtRange(t.startDate, t.endDate)}</div>
                      <div className="mono text-[11px] mt-2 font-bold" style={{ color: 'var(--ac-d)' }}>{tripStatus(t)} · {fmtMoney(spend, t.currency)} spent</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
