import { useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { CITIES, activitiesByCity, cityById } from '../store/mockData'
import { Field, SelectField, ConfirmButton, EmptyState } from '../components/ui'
import { fmtMoney, fmtRange, dayCount } from '../lib/format'

function AddSectionForm({ trip, onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [cityId, setCityId] = useState(CITIES[0].id)
  const [startDate, setStartDate] = useState(trip.startDate)
  const [endDate, setEndDate] = useState(trip.endDate)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return setError('Give this section a title.')
    if (endDate < startDate) return setError('End date must be on or after the start date.')
    setError('')
    onAdd({ title: title.trim(), cityId, startDate, endDate })
  }

  return (
    <form onSubmit={submit} className="border border-dashed rounded-3xl p-5 md:p-6 bg-white" style={{ borderColor: 'var(--ac)' }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Section title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lisbon coastal days" />
        <SelectField label="City" value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
        </SelectField>
        <Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {error && <div className="mt-3 text-sm font-semibold text-red-600">{error}</div>}
      <div className="flex gap-3 mt-4">
        <button type="submit" className="px-5 py-2.5 rounded-full text-white text-sm font-bold cursor-pointer" style={{ background: 'var(--ac)' }}>Add section</button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full border border-[#dfe1ec] text-sm font-bold cursor-pointer text-[#6b6c80]">Cancel</button>
      </div>
    </form>
  )
}

function AddActivityForm({ section, onAdd, onCancel }) {
  const options = activitiesByCity(section.cityId)
  const [activityId, setActivityId] = useState(options[0]?.id || '')
  const [date, setDate] = useState(section.startDate)

  if (options.length === 0) {
    return <div className="text-sm text-[#8b8ca0]">No catalog activities for this city yet.</div>
  }

  const submit = (e) => {
    e.preventDefault()
    const a = options.find((o) => o.id === activityId)
    if (!a) return
    onAdd({ activityId: a.id, name: a.name, cost: a.cost, category: a.category, date })
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end bg-[#f7f8fc] rounded-2xl p-4 mt-3">
      <SelectField label="Activity" value={activityId} onChange={(e) => setActivityId(e.target.value)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name} — {fmtMoney(o.cost)}</option>)}
      </SelectField>
      <Field label="Date" type="date" value={date} min={section.startDate} max={section.endDate} onChange={(e) => setDate(e.target.value)} />
      <button type="submit" className="h-[52px] px-5 rounded-xl text-white text-sm font-bold cursor-pointer" style={{ background: 'var(--ac)' }}>Add</button>
      <button type="button" onClick={onCancel} className="h-[52px] px-5 rounded-xl border border-[#dfe1ec] text-sm font-bold cursor-pointer text-[#6b6c80]">Close</button>
    </form>
  )
}

function Section({ trip, section, index }) {
  const { removeSection, removeActivityFromSection, addActivityToSection } = useApp()
  const [adding, setAdding] = useState(false)
  const city = cityById(section.cityId)
  const total = section.activities.reduce((s, a) => s + (Number(a.cost) || 0), 0)

  return (
    <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7 anim-fade">
      <div className="flex gap-4 items-start flex-wrap">
        <div className="w-[46px] h-[46px] shrink-0 rounded-2xl grid place-items-center mono font-bold text-sm" style={{ background: 'var(--ac-w)', color: 'var(--ac-d)' }}>{index + 1}</div>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="text-[19px] font-extrabold tracking-tight">Section {index + 1}: {section.title}</div>
            <div className="px-2.5 py-1 rounded-full bg-[#f2f3f8] text-[#6b6c80] text-[11px] font-bold">{city?.name || 'Unknown city'}</div>
          </div>
          <div className="text-[#6b6c80] text-sm mt-2">{dayCount(section.startDate, section.endDate)} days · {fmtRange(section.startDate, section.endDate)}</div>

          {section.activities.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {section.activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 border border-[#eceef4] rounded-xl px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{a.name}</div>
                    <div className="text-xs text-[#8b8ca0] mt-0.5">{a.category} · {a.date}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(a.cost, trip.currency)}</div>
                    <button onClick={() => removeActivityFromSection(trip.id, section.id, a.id)} className="text-[#b7b9c9] hover:text-red-500 text-lg leading-none cursor-pointer">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adding ? (
            <AddActivityForm section={section} onCancel={() => setAdding(false)} onAdd={(payload) => { addActivityToSection(trip.id, section.id, payload); setAdding(false) }} />
          ) : (
            <button onClick={() => setAdding(true)} className="mt-4 text-sm font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>+ Add activity</button>
          )}
        </div>
        <div className="flex flex-col gap-2.5 min-w-[170px]">
          <div className="rounded-2xl px-3.5 py-3 bg-[#f7f8fc]">
            <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">SECTION SPEND</div>
            <div className="text-lg font-extrabold mt-1.5">{fmtMoney(total, trip.currency)}</div>
          </div>
          <ConfirmButton
            label="Remove section"
            onConfirm={() => removeSection(trip.id, section.id)}
            className="text-xs font-bold text-[#b7b9c9] hover:text-red-500 cursor-pointer text-left"
          />
        </div>
      </div>
    </div>
  )
}

export default function BuildItinerary() {
  const { tripId } = useParams()
  const { getTrip, addSection, tripSpend } = useApp()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const trip = getTrip(tripId)

  if (!trip) return <Navigate to="/trips" replace />

  const spend = tripSpend(trip)
  const overBudget = spend > trip.budget

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-rise">
      <div className="flex items-end justify-between gap-5 flex-wrap">
        <div>
          <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Build itinerary</div>
          <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight mt-3 mb-1.5">{trip.name}</h1>
          <div className="text-sm text-[#6b6c80] font-semibold">
            {fmtRange(trip.startDate, trip.endDate)} · {trip.sections.length} stops · {fmtMoney(trip.budget, trip.currency)} budget
          </div>
        </div>
        <div className="flex gap-3">
          <div className={`px-4 py-2.5 rounded-full text-xs font-bold mono ${overBudget ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#f2f3f8] text-[#6b6c80]'}`}>
            {fmtMoney(spend, trip.currency)} spent {overBudget ? '· over budget' : ''}
          </div>
          <div onClick={() => navigate(`/trips/${trip.id}`)} className="px-6 py-3.5 rounded-full bg-[var(--ink)] text-white text-sm font-bold cursor-pointer transition-transform hover:-translate-y-0.5">
            View itinerary
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4">
        {trip.sections.length === 0 && !showAdd && (
          <EmptyState title="No sections yet" subtitle="Add a section for each city or stop on this trip." />
        )}
        {trip.sections.map((s, i) => <Section key={s.id} trip={trip} section={s} index={i} />)}

        {showAdd ? (
          <AddSectionForm trip={trip} onCancel={() => setShowAdd(false)} onAdd={(payload) => { addSection(trip.id, payload); setShowAdd(false) }} />
        ) : (
          <div
            onClick={() => setShowAdd(true)}
            className="border border-dashed border-[#cfd2e2] rounded-3xl py-6 flex items-center justify-center gap-3 cursor-pointer font-bold transition-all hover:-translate-y-1"
            style={{ color: 'var(--ac-d)' }}
          >
            <span className="w-7 h-7 rounded-full text-white grid place-items-center text-base" style={{ background: 'var(--ac)' }}>+</span>
            Add another section
          </div>
        )}
      </div>
    </div>
  )
}
