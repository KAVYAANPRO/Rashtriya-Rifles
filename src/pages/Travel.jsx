import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { travel } from '../lib/api'
import { Field, SelectField, PrimaryButton, EmptyState, Chip, Loading, InlineError, Panel } from '../components/ui'
import { fmtMoney } from '../lib/format'

const TABS = ['Flights', 'Stays', 'Getting around']

const todayPlus = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const minutesToHours = (mins) => {
  const n = Number(mins) || 0
  if (!n) return ''
  return `${Math.floor(n / 60)}h ${n % 60}m`
}

function ResultCard({ children }) {
  return (
    <div className="bg-white border border-[#e9eaf2] rounded-3xl p-5 transition-transform hover:-translate-y-1 hover:shadow-xl">
      {children}
    </div>
  )
}

function BookLink({ href, label = 'Book' }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="px-4 py-2 rounded-full bg-[var(--ink)] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
    >
      {label}
    </a>
  )
}

/** GET /flights/search */
function FlightsTab() {
  const [form, setForm] = useState({
    origin: '', destination: '', date: todayPlus(30), returnDate: '', adults: '1', children: '0',
  })
  const [state, setState] = useState({ loading: false, error: '', data: null })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.origin.trim() || !form.destination.trim()) {
      return setState({ loading: false, error: 'Enter both airport codes, e.g. JFK and CDG.', data: null })
    }
    setState({ loading: true, error: '', data: null })
    try {
      const data = await travel.flights({
        origin: form.origin.trim().toUpperCase(),
        destination: form.destination.trim().toUpperCase(),
        date: form.date,
        returnDate: form.returnDate,
        adults: form.adults,
        children: form.children,
      })
      // The API returns { flights, priceGraph } and falls back to [] on failure.
      const flights = Array.isArray(data) ? data : data?.flights || []
      const priceGraph = Array.isArray(data) ? [] : data?.priceGraph || []
      setState({ loading: false, error: '', data: { flights, priceGraph } })
    } catch (err) {
      setState({ loading: false, error: err.message, data: null })
    }
  }

  const cheapest = state.data?.priceGraph?.length
    ? state.data.priceGraph.reduce((a, b) => (Number(b.lowestPrice) < Number(a.lowestPrice) ? b : a))
    : null

  return (
    <>
      <form onSubmit={submit} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="From (airport code)" value={form.origin} onChange={set('origin')} placeholder="JFK" maxLength={3} />
          <Field label="To (airport code)" value={form.destination} onChange={set('destination')} placeholder="CDG" maxLength={3} />
          <Field label="Departure" type="date" value={form.date} onChange={set('date')} />
          <Field label="Return (optional)" type="date" value={form.returnDate} onChange={set('returnDate')} />
          <SelectField label="Adults" value={form.adults} onChange={set('adults')}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
          <SelectField label="Children" value={form.children} onChange={set('children')}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
        </div>
        <PrimaryButton type="submit" className="px-8 mt-6" disabled={state.loading} style={{ width: 'auto' }}>
          {state.loading ? 'Searching…' : 'Search flights'}
        </PrimaryButton>
      </form>

      {state.loading && <Loading label="Checking fares…" />}
      {state.error && <div className="mt-5"><InlineError>{state.error}</InlineError></div>}

      {state.data && (
        <div className="mt-6">
          {cheapest && (
            <Panel className="mb-5">
              <div className="mono text-[10px] tracking-widest text-[#8b8ca0]">CHEAPEST NEARBY DATE</div>
              <div className="text-lg font-extrabold mt-1.5">
                {cheapest.date} · {fmtMoney(cheapest.lowestPrice)}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-3">
                {state.data.priceGraph.map((p) => (
                  <Chip key={p.date} tone={p.date === cheapest.date ? 'accent' : 'muted'}>
                    {String(p.date).slice(5)} · {fmtMoney(p.lowestPrice)}
                  </Chip>
                ))}
              </div>
            </Panel>
          )}

          {state.data.flights.length === 0 ? (
            <EmptyState title="No flights found" subtitle="Try different airport codes or another date." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {state.data.flights.map((f, i) => (
                <ResultCard key={`${f.id}-${i}`}>
                  <div className="flex justify-between gap-3 items-baseline">
                    <div className="text-[16px] font-extrabold tracking-tight">{f.airline}</div>
                    <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(f.price, f.currency)}</div>
                  </div>
                  <div className="text-[13px] text-[#6b6c80] mt-1.5 font-semibold">
                    {f.departureTime} → {f.arrivalTime}
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-3.5">
                    {f.duration ? <Chip>{minutesToHours(f.duration)}</Chip> : null}
                    <Chip>{f.layovers ? `${f.layovers} stop${f.layovers > 1 ? 's' : ''}` : 'Non-stop'}</Chip>
                    {f.isAiEstimate && <Chip tone="accent">Estimate</Chip>}
                  </div>
                  <div className="mt-4 flex justify-end"><BookLink href={f.bookingUrl} /></div>
                </ResultCard>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/** GET /hotels/search */
function StaysTab({ cities }) {
  const [form, setForm] = useState({
    city: cities[0]?.name || '', checkIn: todayPlus(30), checkOut: todayPlus(34), adults: '2', children: '0',
  })
  const [state, setState] = useState({ loading: false, error: '', data: null })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.city.trim()) return setState({ loading: false, error: 'Enter a city.', data: null })
    if (form.checkOut <= form.checkIn) {
      return setState({ loading: false, error: 'Check-out must be after check-in.', data: null })
    }
    setState({ loading: true, error: '', data: null })
    try {
      const data = await travel.hotels({
        city: form.city.trim(),
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: form.adults,
        children: form.children,
      })
      setState({ loading: false, error: '', data: Array.isArray(data) ? data : [] })
    } catch (err) {
      setState({ loading: false, error: err.message, data: null })
    }
  }

  return (
    <>
      <form onSubmit={submit} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="City" value={form.city} onChange={set('city')} placeholder="Paris" list="gt-city-list" />
          <datalist id="gt-city-list">
            {cities.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
          <Field label="Check in" type="date" value={form.checkIn} onChange={set('checkIn')} />
          <Field label="Check out" type="date" value={form.checkOut} onChange={set('checkOut')} />
          <SelectField label="Adults" value={form.adults} onChange={set('adults')}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
          <SelectField label="Children" value={form.children} onChange={set('children')}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
        </div>
        <PrimaryButton type="submit" className="px-8 mt-6" disabled={state.loading} style={{ width: 'auto' }}>
          {state.loading ? 'Searching…' : 'Search stays'}
        </PrimaryButton>
      </form>

      {state.loading && <Loading label="Finding places to stay…" />}
      {state.error && <div className="mt-5"><InlineError>{state.error}</InlineError></div>}

      {state.data && (
        <div className="mt-6">
          {state.data.length === 0 ? (
            <EmptyState title="No stays found" subtitle="Try another city or a different set of dates." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {state.data.map((h, i) => (
                <ResultCard key={`${h.id}-${i}`}>
                  <div className="flex justify-between gap-3 items-baseline">
                    <div className="text-[16px] font-extrabold tracking-tight">{h.name}</div>
                    <div className="mono text-xs font-bold" style={{ color: 'var(--ac-d)' }}>{fmtMoney(h.pricePerNight, h.currency)}/night</div>
                  </div>
                  <div className="text-[13px] text-[#6b6c80] mt-1.5 font-semibold">
                    {fmtMoney(h.totalPrice, h.currency)} total
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-3.5">
                    <Chip>{h.type}</Chip>
                    {h.rating ? <Chip tone="accent">★ {h.rating}</Chip> : null}
                    {h.isAiEstimate && <Chip tone="accent">Estimate</Chip>}
                  </div>
                  <div className="mt-4 flex justify-end"><BookLink href={h.bookingUrl} /></div>
                </ResultCard>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/** GET /transport/search */
function TransportTab({ cities }) {
  const [city, setCity] = useState(cities[0]?.name || '')
  const [state, setState] = useState({ loading: false, error: '', data: null })

  const submit = async (e) => {
    e.preventDefault()
    if (!city.trim()) return setState({ loading: false, error: 'Enter a city.', data: null })
    setState({ loading: true, error: '', data: null })
    try {
      const data = await travel.transport(city.trim())
      setState({ loading: false, error: '', data })
    } catch (err) {
      setState({ loading: false, error: err.message, data: null })
    }
  }

  const cabs = state.data?.cabs || []
  const publicTransport = state.data?.publicTransport || []

  return (
    <>
      <form onSubmit={submit} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" list="gt-transport-city-list" />
          <datalist id="gt-transport-city-list">
            {cities.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>
        <PrimaryButton type="submit" className="px-8 mt-6" disabled={state.loading} style={{ width: 'auto' }}>
          {state.loading ? 'Looking up…' : 'Show local transport'}
        </PrimaryButton>
      </form>

      {state.loading && <Loading label="Checking how people get around…" />}
      {state.error && <div className="mt-5"><InlineError>{state.error}</InlineError></div>}

      {state.data && (
        <div className="mt-6 flex flex-col gap-8">
          <div>
            <h2 className="text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-tight">Cabs &amp; ride-hailing</h2>
            {cabs.length === 0 ? (
              <div className="mt-4"><EmptyState title="Nothing listed" subtitle="No cab services came back for this city." /></div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cabs.map((cab, i) => (
                  <ResultCard key={`${cab.name}-${i}`}>
                    <div className="text-[16px] font-extrabold tracking-tight">{cab.name}</div>
                    <p className="text-[13px] text-[#6b6c80] mt-2 leading-relaxed">{cab.description}</p>
                    {cab.phoneNumber && (
                      <div className="mono text-[11px] mt-3 font-bold" style={{ color: 'var(--ac-d)' }}>{cab.phoneNumber}</div>
                    )}
                    <div className="mt-4 flex justify-end"><BookLink href={cab.bookingUrl} label="Open" /></div>
                  </ResultCard>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-tight">Public transport</h2>
            {publicTransport.length === 0 ? (
              <div className="mt-4"><EmptyState title="Nothing listed" subtitle="No public transport info came back for this city." /></div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {publicTransport.map((t, i) => (
                  <ResultCard key={`${t.mode}-${i}`}>
                    <div className="text-[16px] font-extrabold tracking-tight">{t.mode}</div>
                    <p className="text-[13px] text-[#6b6c80] mt-2 leading-relaxed">{t.description}</p>
                    <div className="mt-4 flex justify-end"><BookLink href={t.bookingUrl} label="Open" /></div>
                  </ResultCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function Travel() {
  const { cities } = useApp()
  const [tab, setTab] = useState('Flights')

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-fade">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Getting there</div>
      <div className="flex items-end justify-between gap-5 flex-wrap mt-3">
        <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight m-0">Flights, stays &amp; transport</h1>
        <div className="text-sm text-[#6b6c80] font-bold">Prices are live where available, estimated otherwise.</div>
      </div>

      <div className="flex gap-2 mt-6 flex-wrap">
        {TABS.map((t) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            className={`px-4.5 py-2.5 rounded-full text-sm font-bold cursor-pointer border transition-transform hover:-translate-y-0.5 ${
              tab === t ? 'text-white border-transparent' : 'bg-white text-[#3c3d52] border-[#e6e7f0]'
            }`}
            style={tab === t ? { background: 'var(--ac)' } : {}}
          >
            {t}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Flights' && <FlightsTab />}
        {tab === 'Stays' && <StaysTab cities={cities} />}
        {tab === 'Getting around' && <TransportTab cities={cities} />}
      </div>
    </div>
  )
}
