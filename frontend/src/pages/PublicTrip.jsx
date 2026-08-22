import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { share } from '../lib/api'
import { adaptPublicTrip } from '../lib/adapt'
import { EmptyState, PageLoader, Chip } from '../components/ui'
import Logo from '../components/Logo'
import { fmtMoney, fmtRange, fmtDate, dayCount, fmtTimeRange } from '../lib/format'

/** Read-only view behind a share link. No auth, and never any budget figures. */
export default function PublicTrip() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', trip: null })

  useEffect(() => {
    let alive = true
    share.publicTrip(slug)
      .then((data) => alive && setState({ loading: false, error: '', trip: adaptPublicTrip(data) }))
      .catch((err) => alive && setState({ loading: false, error: err.message, trip: null }))
    return () => { alive = false }
  }, [slug])

  if (state.loading) return <PageLoader label="Opening shared trip…" />

  if (state.error || !state.trip) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 md:px-10 py-14">
        <div className="max-w-[1320px] mx-auto">
          <Logo dark={false} size={30} textSize={18} className="mb-10" onClick={() => navigate('/')} />
          <EmptyState
            title="This trip isn't available"
            subtitle={state.error || 'The link may have been revoked or never existed.'}
            action={
              <div onClick={() => navigate('/')} className="px-6 py-3 rounded-full text-white text-sm font-bold cursor-pointer" style={{ background: 'var(--ac)' }}>
                Go to GlobalTrotter
              </div>
            }
          />
        </div>
      </div>
    )
  }

  const trip = state.trip
  const days = dayCount(trip.startDate, trip.endDate)
  const owner = trip.owner ? `${trip.owner.firstName} ${trip.owner.lastName}`.trim() : null
  const activityCount = trip.sections.reduce((n, s) => n + s.activities.length, 0)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="relative bg-[var(--ink)] overflow-hidden py-10 md:py-16">
        <div className="absolute w-[760px] h-[760px] -left-[180px] -top-[320px] rounded-full opacity-45 blur-xl" style={{ background: 'radial-gradient(circle at 45% 45%, var(--ac) 0%, transparent 66%)' }} />
        <div className="absolute w-[560px] h-[560px] -right-[120px] -bottom-[260px] rounded-full opacity-40 blur-2xl" style={{ background: 'radial-gradient(circle at 50% 50%, var(--ac2) 0%, transparent 64%)' }} />
        <div className="relative max-w-[1320px] mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Logo size={30} textSize={17} onClick={() => navigate('/')} />
            <div onClick={() => navigate('/register')} className="px-5 py-2.5 rounded-full text-white text-sm font-bold cursor-pointer transition-colors hover:brightness-110" style={{ background: 'var(--ac)' }}>
              Plan your own
            </div>
          </div>

          <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold mt-10 text-[color:color-mix(in_oklch,var(--ac)_55%,white)]">
            Shared itinerary{owner ? ` · by ${owner}` : ''}
          </div>
          <h1 className="text-white text-[clamp(32px,4.6vw,54px)] font-extrabold tracking-tight leading-[1.04] mt-4">{trip.name}</h1>
          {trip.description && (
            <p className="text-white/60 text-[17px] leading-relaxed max-w-[560px] mt-4">{trip.description}</p>
          )}
          <div className="text-white/60 text-sm font-semibold mt-4">
            {fmtRange(trip.startDate, trip.endDate)} · {trip.sections.length} stops · {days} days · {activityCount} activities
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-10 md:py-14">
        {trip.sections.length === 0 ? (
          <EmptyState title="Nothing planned yet" subtitle="This trip doesn't have any stops on it." />
        ) : (
          <div className="flex flex-col gap-4">
            {trip.sections.map((s, i) => (
              <div key={s.id} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7">
                <div className="flex gap-4 items-start flex-wrap">
                  <div className="w-[46px] h-[46px] shrink-0 rounded-2xl grid place-items-center mono font-bold text-sm" style={{ background: 'var(--ac-w)', color: 'var(--ac-d)' }}>{i + 1}</div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="text-[19px] font-extrabold tracking-tight">{s.title}</div>
                      <Chip>{s.cityName}{s.country ? `, ${s.country}` : ''}</Chip>
                    </div>
                    <div className="text-[#6b6c80] text-sm mt-2">
                      {dayCount(s.startDate, s.endDate)} days · {fmtRange(s.startDate, s.endDate)}
                    </div>

                    {s.activities.length === 0 ? (
                      <div className="text-sm text-[#8b8ca0] mt-4">No activities scheduled for this stop.</div>
                    ) : (
                      <div className="flex flex-col gap-2 mt-4">
                        {s.activities.map((a) => (
                          <div key={a.id} className="flex items-center justify-between gap-3 border border-[#eceef4] rounded-xl px-3.5 py-2.5">
                            <div className="min-w-0">
                              <div className="text-sm font-bold truncate">{a.name}</div>
                              <div className="text-xs text-[#8b8ca0] mt-0.5">
                                {a.category} · {fmtDate(a.date)}{a.startTime ? ` · ${fmtTimeRange(a.startTime, a.endTime)}` : ''}
                              </div>
                            </div>
                            <div className="mono text-xs font-bold shrink-0" style={{ color: 'var(--ac-d)' }}>
                              {fmtMoney(a.cost, trip.currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center text-[13px] text-[#8b8ca0]">
          Shared from GlobalTrotter · budgets stay private
        </div>
      </div>
    </div>
  )
}
