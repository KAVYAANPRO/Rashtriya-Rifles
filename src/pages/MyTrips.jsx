import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { EmptyState, ConfirmButton } from '../components/ui'
import { fmtMoney, fmtRange, tripStatus } from '../lib/format'

const TABS = ['All', 'Upcoming', 'Ongoing', 'Past']
const STATUS_STYLE = {
  Upcoming: 'bg-[var(--ac)]',
  Ongoing: 'bg-[var(--ac2)]',
  Past: 'bg-[#6b6c80]',
}

export default function MyTrips() {
  const { userTrips, deleteTrip, tripSpend } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return userTrips
      .filter((t) => tab === 'All' || tripStatus(t) === tab)
      .filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [userTrips, tab, q])

  const groups = useMemo(() => {
    if (tab !== 'All') return [{ label: tab, items: filtered }]
    const byStatus = { Ongoing: [], Upcoming: [], Past: [] }
    filtered.forEach((t) => byStatus[tripStatus(t)].push(t))
    return Object.entries(byStatus)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }))
  }, [filtered, tab])

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-fade">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>My trips</div>
      <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight mt-3 mb-6">All of your trips</h1>

      <div className="bg-white border border-[#e6e7f0] rounded-3xl p-3.5 flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[200px] flex items-center gap-2.5 px-3.5 h-[46px] rounded-xl bg-[#F7F9FC]">
          <div className="w-3.5 h-3.5 border-2 border-[#9a9cb0] rounded-full" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your trips…" className="flex-1 border-none bg-transparent text-[15px] outline-none" />
        </div>
      </div>

      <div className="flex gap-2 mt-5 flex-wrap">
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

      <div className="mt-7 flex flex-col gap-8">
        {filtered.length === 0 ? (
          <EmptyState
            title={userTrips.length === 0 ? 'No trips yet' : 'No trips match your filters'}
            subtitle={userTrips.length === 0 ? 'Plan your first trip to see it here.' : 'Try a different tab or search term.'}
            action={userTrips.length === 0 && (
              <div onClick={() => navigate('/trips/new')} className="px-6 py-3 rounded-full text-white text-sm font-bold cursor-pointer" style={{ background: 'var(--ac)' }}>
                Plan a trip
              </div>
            )}
          />
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <div className="flex items-center gap-3">
                <h2 className="text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-tight">{g.label}</h2>
                <div className="px-2.5 py-1 rounded-full bg-[#f2f3f8] text-[#6b6c80] mono text-[11px] font-bold">{g.items.length}</div>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {g.items.map((t) => {
                  const status = tripStatus(t)
                  const spend = tripSpend(t)
                  const pct = t.budget > 0 ? Math.min(100, Math.round((spend / t.budget) * 100)) : 0
                  return (
                    <div key={t.id} className="bg-white border border-[#e9eaf2] rounded-3xl overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-2xl">
                      <div className="h-[110px] relative" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 9px,#f6f7fc 9px 18px)' }}>
                        <div className={`absolute left-3.5 top-3.5 px-2.5 py-1 rounded-full text-white mono text-[10px] tracking-widest ${STATUS_STYLE[status]}`}>{status.toUpperCase()}</div>
                      </div>
                      <div className="p-4.5">
                        <div className="text-[17px] font-extrabold tracking-tight">{t.name}</div>
                        <div className="text-[13px] text-[#6b6c80] mt-1.5 font-semibold">{fmtRange(t.startDate, t.endDate)}</div>
                        <p className="text-[13px] text-[#6b6c80] mt-3 leading-relaxed">{t.sections.length} stops · {t.sections.reduce((s, sec) => s + sec.activities.length, 0)} activities</p>
                        <div className="mt-3.5 h-[7px] rounded-full bg-[#f0f1f7] overflow-hidden">
                          <div className="h-full rounded-full anim-grow" style={{ width: `${pct}%`, background: pct > 100 ? '#dc2626' : 'var(--ac)' }} />
                        </div>
                        <div className="flex justify-between items-center mt-3.5">
                          <div className="mono text-[11px] text-[#6b6c80] font-bold">{fmtMoney(spend, t.currency)} / {fmtMoney(t.budget, t.currency)}</div>
                          <div className="flex items-center gap-2">
                            <div onClick={() => navigate(`/trips/${t.id}`)} className="px-4 py-2 rounded-full bg-[var(--ink)] text-white text-xs font-bold cursor-pointer">View</div>
                            <ConfirmButton
                              label="Delete"
                              onConfirm={() => deleteTrip(t.id)}
                              className="px-3 py-2 rounded-full border border-[#f0d0d0] text-red-500 text-xs font-bold cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
