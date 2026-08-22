import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { ACTIVITIES, CATEGORIES, cityById } from '../store/mockData'
import { EmptyState } from '../components/ui'
import { fmtMoney } from '../lib/format'

function AddToTripPanel({ activity, onClose }) {
  const { userTrips, addActivityToSection, notify } = useApp()
  const matchingSections = userTrips.flatMap((t) => t.sections.filter((s) => s.cityId === activity.city).map((s) => ({ trip: t, section: s })))
  const allSections = userTrips.flatMap((t) => t.sections.map((s) => ({ trip: t, section: s })))
  const options = matchingSections.length > 0 ? matchingSections : allSections
  const [choice, setChoice] = useState(options[0] ? `${options[0].trip.id}::${options[0].section.id}` : '')

  if (userTrips.length === 0) {
    return <div className="text-xs text-[#8b8ca0] mt-2">Create a trip first, then come back to add this.</div>
  }
  if (options.length === 0) {
    return <div className="text-xs text-[#8b8ca0] mt-2">Add a section to one of your trips before adding activities.</div>
  }

  const submit = () => {
    const [tripId, sectionId] = choice.split('::')
    const target = options.find((o) => o.trip.id === tripId && o.section.id === sectionId)
    addActivityToSection(tripId, sectionId, { activityId: activity.id, name: activity.name, cost: activity.cost, category: activity.category, date: target.section.startDate })
    onClose()
  }

  return (
    <div className="mt-3 flex flex-col gap-2 bg-[#f7f8fc] rounded-xl p-3">
      <select value={choice} onChange={(e) => setChoice(e.target.value)} className="h-10 px-2.5 rounded-lg border border-[#dfe1ec] text-xs bg-white outline-none">
        {options.map((o) => (
          <option key={`${o.trip.id}::${o.section.id}`} value={`${o.trip.id}::${o.section.id}`}>
            {o.trip.name} — {o.section.title}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button onClick={submit} className="flex-1 h-9 rounded-lg text-white text-xs font-bold cursor-pointer" style={{ background: 'var(--ac)' }}>Confirm add</button>
        <button onClick={onClose} className="h-9 px-3 rounded-lg border border-[#dfe1ec] text-xs font-bold text-[#6b6c80] cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}

export default function Search() {
  const { isActivityInTrip, userTrips } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [openId, setOpenId] = useState(null)

  const results = useMemo(() => {
    return ACTIVITIES.filter((a) => {
      const matchesQ = !q.trim() || a.name.toLowerCase().includes(q.trim().toLowerCase()) || cityById(a.city)?.name.toLowerCase().includes(q.trim().toLowerCase())
      const matchesCat = category === 'All' || a.category === category
      return matchesQ && matchesCat
    })
  }, [q, category])

  const cities = new Set(results.map((r) => r.city))
  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.cost, 0) / results.length) : 0

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-fade">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Browse activities</div>
      <div className="flex items-end justify-between gap-5 flex-wrap mt-3">
        <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight m-0">Activities &amp; cities</h1>
        <div className="text-sm text-[#6b6c80] font-bold">{results.length} results · {cities.size} cities · avg {fmtMoney(avg)}</div>
      </div>

      <div className="mt-6 bg-white border border-[#e6e7f0] rounded-3xl p-3.5 flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[200px] flex items-center gap-2.5 px-3.5 h-[46px] rounded-xl bg-[#F7F9FC]">
          <div className="w-3.5 h-3.5 border-2 border-[#9a9cb0] rounded-full" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activities or cities…" className="flex-1 border-none bg-transparent text-[15px] outline-none font-semibold" />
        </div>
      </div>

      <div className="flex gap-2 mt-4.5 flex-wrap">
        {['All', ...CATEGORIES].map((c) => (
          <div
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2.5 rounded-full text-[13px] font-bold cursor-pointer border transition-transform hover:-translate-y-0.5 ${
              category === c ? 'text-white border-transparent' : 'bg-white text-[#3c3d52] border-[#e6e7f0]'
            }`}
            style={category === c ? { background: 'var(--ac)' } : {}}
          >
            {c}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState title="No activities match" subtitle="Try a different search term or category." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((a) => {
              const city = cityById(a.city)
              const added = isActivityInTrip(userTrips[0]?.id, a.id) || userTrips.some((t) => isActivityInTrip(t.id, a.id))
              return (
                <div key={a.id} className="bg-white border border-[#e9eaf2] rounded-3xl overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="h-[130px] grid place-items-center text-[#8b8ca0] mono text-[10px] tracking-widest uppercase" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 9px,#f6f7fc 9px 18px)' }}>{city?.name}</div>
                  <div className="p-4.5">
                    <div className="flex justify-between gap-3 items-baseline">
                      <div className="text-[16px] font-extrabold tracking-tight">{a.name}</div>
                      <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(a.cost)}</div>
                    </div>
                    <div className="text-[13px] text-[#6b6c80] mt-1.5 font-semibold">{city?.name}, {city?.country}</div>
                    <div className="flex gap-1.5 flex-wrap mt-3.5">
                      <div className="px-2.5 py-1 rounded-full bg-[#f2f3f8] text-[#6b6c80] text-[11px] font-bold">{a.duration} min</div>
                      <div className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--ac-w)', color: 'var(--ac-d)' }}>★ {a.rating} · {a.reviews}</div>
                    </div>
                    {openId === a.id ? (
                      <AddToTripPanel activity={a} onClose={() => setOpenId(null)} />
                    ) : (
                      <div
                        onClick={() => (userTrips.length === 0 ? navigate('/trips/new') : setOpenId(a.id))}
                        className={`mt-4 py-2.5 rounded-xl text-center text-[13px] font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                          added ? 'bg-[var(--ink)] text-white border-transparent' : 'border-[#dfe1ec] text-[#3c3d52]'
                        }`}
                      >
                        {userTrips.length === 0 ? 'Plan a trip first' : added ? 'Added — add again' : 'Add to trip'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
