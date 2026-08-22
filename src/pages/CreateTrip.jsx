import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { CITIES, activitiesByCity, cityById } from '../store/mockData'
import { Field, SelectField, PrimaryButton } from '../components/ui'
import { fmtMoney } from '../lib/format'

const todayPlus = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function CreateTrip() {
  const { createTrip, addActivityToSection } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState(CITIES[0].id)
  const [startDate, setStartDate] = useState(todayPlus(14))
  const [endDate, setEndDate] = useState(todayPlus(21))
  const [budget, setBudget] = useState('2500')
  const [currency, setCurrency] = useState('USD')
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const suggestions = useMemo(() => activitiesByCity(cityId).slice(0, 5), [cityId])
  const city = cityById(cityId)

  const toggleSuggestion = (activityId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(activityId)) next.delete(activityId)
      else next.add(activityId)
      return next
    })
  }

  const changeCity = (id) => {
    setCityId(id)
    setSelectedIds(new Set())
  }

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Give your trip a name.')
    if (endDate < startDate) return setError('End date must be on or after the start date.')
    if (Number(budget) < 0) return setError('Budget cannot be negative.')
    setError('')
    const trip = createTrip({ name: name.trim(), startDate, endDate, budget, currency, cityId, cityLabel: `${city.name} arrival` })
    const sectionId = trip.sections[0]?.id
    if (sectionId && selectedIds.size > 0) {
      suggestions
        .filter((s) => selectedIds.has(s.id))
        .forEach((s) => addActivityToSection(trip.id, sectionId, { activityId: s.id, name: s.name, cost: s.cost, category: s.category, date: startDate }))
    }
    navigate(`/trips/${trip.id}/builder`)
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-rise">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Plan a trip</div>
      <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight mt-3 mb-7">Plan a new trip</h1>

      <form onSubmit={submit} className="grid lg:grid-cols-2 gap-7 items-start">
        <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-8 shadow-[0_40px_80px_-50px_rgba(30,26,80,0.35)]">
          <Field label="Trip name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kansai Spring Loop" />
          <div className="mt-4">
            <SelectField label="Starting place" value={cityId} onChange={(e) => changeCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
              ))}
            </SelectField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Total budget" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <SelectField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option><option>EUR</option><option>JPY</option><option>INR</option>
            </SelectField>
          </div>
          {error && <div className="mt-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <PrimaryButton type="submit" className="w-full mt-6">Save and build itinerary</PrimaryButton>
        </div>

        <div>
          <h3 className="text-[18px] font-extrabold tracking-tight mb-1">Suggestions for {city.name}</h3>
          <p className="text-[#6b6c80] text-sm mb-4">
            Based on the place you picked — added ones join your itinerary automatically once you save.
          </p>
          <div className="flex flex-col gap-3">
            {suggestions.map((s) => {
              const added = selectedIds.has(s.id)
              return (
                <div key={s.id} className="bg-white border border-[#cfd2e0] rounded-2xl p-4 flex gap-3.5 items-center shadow-[0_2px_10px_-4px_rgba(30,26,80,0.18)] transition-all hover:-translate-y-1 hover:border-[#b9bdd1] hover:shadow-[0_16px_30px_-10px_rgba(30,26,80,0.28)]">
                  <div className="w-[58px] h-[58px] shrink-0 rounded-xl" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 8px,#f6f7fc 8px 16px)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold tracking-tight truncate">{s.name}</div>
                    <div className="text-xs text-[#6b6c80] mt-1 font-semibold">{fmtMoney(s.cost, currency)} · {s.duration} min</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSuggestion(s.id)}
                    aria-label={added ? `Remove ${s.name}` : `Add ${s.name}`}
                    className="shrink-0 w-[34px] h-[34px] rounded-full grid place-items-center text-[18px] font-bold cursor-pointer transition-all"
                    style={
                      added
                        ? { background: 'var(--ac)', color: '#fff', border: '1px solid var(--ac)' }
                        : { background: '#000000', color: '#fff', border: '1px solid #000000' }
                    }
                  >
                    {added ? '✓' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
          {selectedIds.size > 0 && (
            <div className="mt-3 text-xs font-bold" style={{ color: 'var(--ac-d)' }}>
              {selectedIds.size} activit{selectedIds.size === 1 ? 'y' : 'ies'} will be added to your itinerary.
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
