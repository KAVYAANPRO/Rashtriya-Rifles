import { useEffect, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { autoPlanner, events as eventsApi, recommendations as recsApi } from '../lib/api'
import {
  Field, SelectField, ConfirmButton, EmptyState, PageLoader,
  Panel, Chip, Loading, InlineError,
} from '../components/ui'
import { fmtMoney, fmtRange, fmtDate, dayCount, fmtTimeRange } from '../lib/format'

const DIETARY = ['Any', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Jain']

function AddSectionForm({ trip, cities, onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [cityId, setCityId] = useState(cities[0]?.id || '')
  const [startDate, setStartDate] = useState(trip.startDate)
  const [endDate, setEndDate] = useState(trip.endDate)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return setError('Give this section a title.')
    if (!cityId) return setError('Pick a city for this section.')
    if (endDate < startDate) return setError('End date must be on or after the start date.')
    setError('')
    setSaving(true)
    await onAdd({ title: title.trim(), cityId, startDate, endDate })
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="border border-dashed rounded-3xl p-5 md:p-6 bg-white" style={{ borderColor: 'var(--ac)' }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Section title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lisbon coastal days" />
        <SelectField label="City" value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
        </SelectField>
        <Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {error && <div className="mt-3 text-sm font-semibold text-red-600">{error}</div>}
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full text-white text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--ac)' }}>
          {saving ? 'Adding…' : 'Add section'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full border border-[#dfe1ec] text-sm font-bold cursor-pointer text-[#6b6c80]">Cancel</button>
      </div>
    </form>
  )
}

/** PATCH /trips/:id/stops/:id — retitle a section, move it or change its dates. */
function EditSectionForm({ section, cities, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: section.title,
    cityId: section.cityId,
    startDate: section.startDate,
    endDate: section.endDate,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Give this section a title.')
    if (form.endDate < form.startDate) return setError('End date must be on or after the start date.')
    setError('')
    setSaving(true)
    await onSave({ ...form, title: form.title.trim() })
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="bg-[#f7f8fc] rounded-2xl p-4 mt-3">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Section title" value={form.title} onChange={set('title')} />
        <SelectField label="City" value={form.cityId} onChange={set('cityId')}>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
        </SelectField>
        <Field label="Start date" type="date" value={form.startDate} onChange={set('startDate')} />
        <Field label="End date" type="date" value={form.endDate} onChange={set('endDate')} />
      </div>
      {error && <div className="mt-3 text-sm font-semibold text-red-600">{error}</div>}
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full text-white text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--ac)' }}>
          {saving ? 'Saving…' : 'Save section'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full border border-[#dfe1ec] text-sm font-bold cursor-pointer text-[#6b6c80]">Cancel</button>
      </div>
    </form>
  )
}

/** PATCH .../activities/:id — reschedule, re-price or complete a booked item. */
function EditActivityForm({ section, activity, onSave, onCancel }) {
  const [form, setForm] = useState({
    scheduledDate: activity.date,
    scheduledStartTime: activity.startTime || '',
    actualCost: activity.cost ?? '',
    status: activity.status || 'planned',
  })
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      scheduledDate: form.scheduledDate,
      scheduledStartTime: form.scheduledStartTime || null,
      actualCost: form.actualCost === '' ? null : Number(form.actualCost),
      status: form.status,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end bg-[#f7f8fc] rounded-2xl p-4 mt-2">
      <Field label="Date" type="date" value={form.scheduledDate} min={section.startDate} max={section.endDate} onChange={set('scheduledDate')} />
      <Field label="Start time" type="time" value={form.scheduledStartTime} onChange={set('scheduledStartTime')} />
      <Field label="Cost" type="number" min="0" value={form.actualCost} onChange={set('actualCost')} />
      <SelectField label="Status" value={form.status} onChange={set('status')}>
        <option value="planned">Planned</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </SelectField>
      <button type="submit" disabled={saving} className="h-[52px] px-5 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--ac)' }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={onCancel} className="h-[52px] px-5 rounded-xl border border-[#dfe1ec] text-sm font-bold cursor-pointer text-[#6b6c80]">Close</button>
    </form>
  )
}

function AddActivityForm({ section, options, onAdd, onCancel }) {
  const [activityId, setActivityId] = useState(options[0]?.id || '')
  const [date, setDate] = useState(section.startDate)
  const [saving, setSaving] = useState(false)

  if (options.length === 0) {
    return <div className="text-sm text-[#8b8ca0]">No catalog activities for this city yet.</div>
  }

  const submit = async (e) => {
    e.preventDefault()
    const a = options.find((o) => o.id === activityId)
    if (!a) return
    setSaving(true)
    await onAdd({ activityId: a.id, name: a.name, cost: a.cost, category: a.category, date })
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end bg-[#f7f8fc] rounded-2xl p-4 mt-3">
      <SelectField label="Activity" value={activityId} onChange={(e) => setActivityId(e.target.value)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name} — {fmtMoney(o.cost)}</option>)}
      </SelectField>
      <Field label="Date" type="date" value={date} min={section.startDate} max={section.endDate} onChange={(e) => setDate(e.target.value)} />
      <button type="submit" disabled={saving} className="h-[52px] px-5 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--ac)' }}>
        {saving ? 'Adding…' : 'Add'}
      </button>
      <button type="button" onClick={onCancel} className="h-[52px] px-5 rounded-xl border border-[#dfe1ec] text-sm font-bold cursor-pointer text-[#6b6c80]">Close</button>
    </form>
  )
}

/** GET /trips/:id/stops/:id/recommendations/activities — what still fits the budget. */
function RecommendationsPanel({ trip, section, onAdd, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    let alive = true
    recsApi.forStop(trip.id, section.id)
      .then((data) => alive && setState({ loading: false, error: '', data }))
      .catch((err) => alive && setState({ loading: false, error: err.message, data: null }))
    return () => { alive = false }
  }, [trip.id, section.id])

  const add = async (rec) => {
    setAddingId(rec.id)
    await onAdd({
      activityId: String(rec.id),
      name: rec.activityName,
      cost: Number(rec.estimatedCost) || 0,
      category: rec.categoryName,
      date: section.startDate,
    })
    setAddingId(null)
  }

  return (
    <Panel className="mt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="mono text-[10px] tracking-widest text-[#8b8ca0]">SUGGESTED FOR YOUR BUDGET</div>
        <button onClick={onClose} className="text-[#b7b9c9] hover:text-[#6b6c80] text-lg leading-none cursor-pointer">×</button>
      </div>

      {state.loading && <Loading label="Checking what fits…" />}
      {state.error && <div className="mt-3"><InlineError>{state.error}</InlineError></div>}

      {state.data && (
        <>
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            {state.data.hasBudgetLimit ? (
              <Chip tone="accent">{fmtMoney(state.data.remainingBudget, trip.currency)} left for activities</Chip>
            ) : (
              <Chip>No activities budget set — showing everything</Chip>
            )}
            <Chip>{state.data.recommendations.length} options</Chip>
          </div>

          {state.data.recommendations.length === 0 ? (
            <div className="text-sm text-[#8b8ca0] mt-3">
              Nothing in this city fits the remaining activities budget.
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-3">
              {state.data.recommendations.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 bg-white border border-[#eceef4] rounded-xl px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{r.activityName}</div>
                    <div className="text-xs text-[#8b8ca0] mt-0.5">
                      {r.categoryName}{r.estimatedDuration ? ` · ${r.estimatedDuration} min` : ''}{r.rating ? ` · ★ ${r.rating}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(r.estimatedCost, trip.currency)}</div>
                    <button
                      onClick={() => add(r)}
                      disabled={addingId === r.id}
                      className="px-3 py-1.5 rounded-full text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      style={{ background: 'var(--ac)' }}
                    >
                      {addingId === r.id ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

/** GET /trips/:id/stops/:id/events — live events while they're in town. */
function EventsPanel({ trip, section, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    let alive = true
    eventsApi.forStop(trip.id, section.id)
      .then((data) => alive && setState({ loading: false, error: '', data: Array.isArray(data) ? data : [] }))
      .catch((err) => alive && setState({ loading: false, error: err.message, data: null }))
    return () => { alive = false }
  }, [trip.id, section.id])

  return (
    <Panel className="mt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="mono text-[10px] tracking-widest text-[#8b8ca0]">
          LIVE EVENTS · {fmtRange(section.startDate, section.endDate)}
        </div>
        <button onClick={onClose} className="text-[#b7b9c9] hover:text-[#6b6c80] text-lg leading-none cursor-pointer">×</button>
      </div>

      {state.loading && <Loading label="Looking for events…" />}
      {state.error && <div className="mt-3"><InlineError>{state.error}</InlineError></div>}

      {state.data && state.data.length === 0 && (
        <div className="text-sm text-[#8b8ca0] mt-3">No events listed for these dates.</div>
      )}

      {state.data && state.data.length > 0 && state.data[0]?.source !== 'ticketmaster' && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          <Chip tone="accent">Suggestions — not live ticket listings</Chip>
        </div>
      )}

      {state.data && state.data.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {state.data.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-3 bg-white border border-[#eceef4] rounded-xl px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{ev.name}</div>
                <div className="text-xs text-[#8b8ca0] mt-0.5 truncate">
                  {[ev.type, ev.date && fmtDate(ev.date), ev.time?.slice(0, 5), ev.venue].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {(ev.priceMin !== undefined && ev.priceMin !== null) && (
                  <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>
                    {ev.priceMin === ev.priceMax
                      ? fmtMoney(ev.priceMin, ev.currency || trip.currency)
                      : `${fmtMoney(ev.priceMin, ev.currency || trip.currency)}+`}
                  </div>
                )}
                {ev.bookingUrl && (
                  <a
                    href={ev.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full border border-[#dfe1ec] text-xs font-bold cursor-pointer"
                    style={{ color: 'var(--ac-d)' }}
                  >
                    Tickets
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

/** POST /trips/:id/stops/:id/auto-plan — AI fills the days in. */
function AutoPlanPanel({ trip, section, categories, onDone, onClose }) {
  const [preferences, setPreferences] = useState([])
  const [dietary, setDietary] = useState('Any')
  const [state, setState] = useState({ loading: false, error: '', result: null })

  const toggle = (name) =>
    setPreferences((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]))

  const run = async () => {
    setState({ loading: true, error: '', result: null })
    try {
      const result = await autoPlanner.run(trip.id, section.id, {
        preferences,
        dietaryPreference: dietary,
      })
      setState({ loading: false, error: '', result })
      await onDone()
    } catch (err) {
      setState({ loading: false, error: err.message, result: null })
    }
  }

  return (
    <Panel className="mt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="mono text-[10px] tracking-widest text-[#8b8ca0]">AUTO-PLAN THIS STOP</div>
        <button onClick={onClose} className="text-[#b7b9c9] hover:text-[#6b6c80] text-lg leading-none cursor-pointer">×</button>
      </div>

      <div className="text-xs text-[#6b6c80] mt-2 leading-relaxed">
        Builds a geo-clustered plan for every day of this stop — three meals plus a snack, each with a
        start and end time and no overlaps, inside the activities budget.
        This replaces everything currently scheduled in this section.
      </div>

      <div className="mt-3">
        <div className="text-[13px] font-bold text-[#3c3d52] mb-2">Preferences</div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => {
            const on = preferences.includes(c)
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-bold cursor-pointer border transition-transform hover:-translate-y-0.5 ${
                  on ? 'text-white border-transparent' : 'bg-white text-[#3c3d52] border-[#e6e7f0]'
                }`}
                style={on ? { background: 'var(--ac)' } : {}}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-3 items-end">
        <SelectField label="Dietary preference" value={dietary} onChange={(e) => setDietary(e.target.value)}>
          {DIETARY.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectField>
        <button
          onClick={run}
          disabled={state.loading}
          className="h-[52px] px-5 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--ac)' }}
        >
          {state.loading ? 'Planning…' : 'Generate itinerary'}
        </button>
      </div>

      {state.loading && <Loading label="Building your day-by-day plan — this can take up to two minutes…" />}
      {state.error && <div className="mt-3"><InlineError>{state.error}</InlineError></div>}

      {state.result && (
        <>
          <div className="flex gap-1.5 flex-wrap mt-3">
            <Chip tone="green">{state.result.daysPlanned} of {state.result.stopDays} days planned</Chip>
            <Chip tone="green">{state.result.activitiesScheduled} items scheduled</Chip>
            {state.result.hasBudgetLimit && (
              <Chip tone="accent">{fmtMoney(state.result.remainingBudget, trip.currency)} left</Chip>
            )}
            {state.result.droppedCount > 0 && (
              <Chip>{state.result.droppedCount} didn't fit the day</Chip>
            )}
          </div>

          {state.result.days?.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {state.result.days.map((d) => (
                <div key={d.day} className="flex items-center justify-between gap-3 bg-white border border-[#eceef4] rounded-xl px-3.5 py-2.5">
                  <div className="text-sm font-bold">Day {d.day} · {fmtDate(d.date)}</div>
                  <div className="mono text-xs font-bold text-[#6b6c80]">
                    {d.activities} items{d.firstStart ? ` · ${d.firstStart}–${d.lastEnd}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

function Section({ trip, section, index }) {
  const {
    updateSection, removeSection,
    addActivityToSection, updateActivityInSection, removeActivityFromSection,
    activitiesByCity, cityById, categories, cities, reloadTrip,
  } = useApp()
  const [panel, setPanel] = useState(null) // add | recommend | events | autoplan | edit
  const [editingActivityId, setEditingActivityId] = useState(null)
  const city = cityById(section.cityId)
  const total = section.activities.reduce((s, a) => s + (Number(a.cost) || 0), 0)

  const toggle = (name) => setPanel((p) => (p === name ? null : name))

  return (
    <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7 anim-fade">
      <div className="flex gap-4 items-start flex-wrap">
        <div className="w-[46px] h-[46px] shrink-0 rounded-2xl grid place-items-center mono font-bold text-sm" style={{ background: 'var(--ac-w)', color: 'var(--ac-d)' }}>{index + 1}</div>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="text-[19px] font-extrabold tracking-tight">Section {index + 1}: {section.title}</div>
            <div className="px-2.5 py-1 rounded-full bg-[#f2f3f8] text-[#6b6c80] text-[11px] font-bold">{city?.name || section.cityName || 'Unknown city'}</div>
          </div>
          <div className="text-[#6b6c80] text-sm mt-2">{dayCount(section.startDate, section.endDate)} days · {fmtRange(section.startDate, section.endDate)}</div>

          {section.activities.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {section.activities.map((a) => (
                <div key={a.id}>
                  <div className="flex items-center justify-between gap-3 border border-[#eceef4] rounded-xl px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{a.name}</div>
                      <div className="text-xs text-[#8b8ca0] mt-0.5">
                        {a.category} · {a.date}{a.startTime ? ` · ${fmtTimeRange(a.startTime, a.endTime)}` : ''}{a.status !== 'planned' ? ` · ${a.status}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(a.cost, trip.currency)}</div>
                      <button
                        onClick={() => setEditingActivityId((id) => (id === a.id ? null : a.id))}
                        className="text-[11px] font-bold text-[#8b8ca0] hover:text-[var(--ac-d)] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button onClick={() => removeActivityFromSection(trip.id, section.id, a.id)} className="text-[#b7b9c9] hover:text-red-500 text-lg leading-none cursor-pointer">×</button>
                    </div>
                  </div>
                  {editingActivityId === a.id && (
                    <EditActivityForm
                      section={section}
                      activity={a}
                      onCancel={() => setEditingActivityId(null)}
                      onSave={async (patch) => {
                        await updateActivityInSection(trip.id, section.id, a.id, patch)
                        setEditingActivityId(null)
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 flex-wrap items-center mt-4">
            <button onClick={() => toggle('add')} className="text-sm font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>
              + Add activity
            </button>
            <button onClick={() => toggle('recommend')} className="text-sm font-bold cursor-pointer text-[#6b6c80] hover:text-[var(--ac-d)]">
              Budget picks
            </button>
            <button onClick={() => toggle('events')} className="text-sm font-bold cursor-pointer text-[#6b6c80] hover:text-[var(--ac-d)]">
              Live events
            </button>
            <button onClick={() => toggle('autoplan')} className="text-sm font-bold cursor-pointer text-[#6b6c80] hover:text-[var(--ac-d)]">
              Auto-plan
            </button>
            <button onClick={() => toggle('edit')} className="text-sm font-bold cursor-pointer text-[#6b6c80] hover:text-[var(--ac-d)]">
              Edit section
            </button>
          </div>

          {panel === 'add' && (
            <AddActivityForm
              section={section}
              options={activitiesByCity(section.cityId)}
              onCancel={() => setPanel(null)}
              onAdd={async (payload) => { await addActivityToSection(trip.id, section.id, payload); setPanel(null) }}
            />
          )}
          {panel === 'recommend' && (
            <RecommendationsPanel
              trip={trip}
              section={section}
              onClose={() => setPanel(null)}
              onAdd={(payload) => addActivityToSection(trip.id, section.id, payload)}
            />
          )}
          {panel === 'events' && (
            <EventsPanel trip={trip} section={section} onClose={() => setPanel(null)} />
          )}
          {panel === 'edit' && (
            <EditSectionForm
              section={section}
              cities={cities}
              onCancel={() => setPanel(null)}
              onSave={async (patch) => { await updateSection(trip.id, section.id, patch); setPanel(null) }}
            />
          )}
          {panel === 'autoplan' && (
            <AutoPlanPanel
              trip={trip}
              section={section}
              categories={categories}
              onDone={() => reloadTrip(trip.id)}
              onClose={() => setPanel(null)}
            />
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
  const { getTrip, addSection, tripSpend, tripsLoaded, cities } = useApp()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const trip = getTrip(tripId)

  if (!tripsLoaded) return <PageLoader label="Loading your trip…" />
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
          <AddSectionForm
            trip={trip}
            cities={cities}
            onCancel={() => setShowAdd(false)}
            onAdd={async (payload) => { await addSection(trip.id, payload); setShowAdd(false) }}
          />
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
