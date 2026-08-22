import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Field, EmptyState } from '../components/ui'
import { fmtRange, tripStatus } from '../lib/format'

const PROFILE_FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
]

export default function Profile() {
  const { currentUser, updateProfile, userTrips, logout } = useApp()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(currentUser)

  const startEdit = () => { setForm(currentUser); setEditing(true) }
  const save = () => { updateProfile(form); setEditing(false) }

  const initials = `${currentUser.firstName?.[0] || currentUser.username[0]}${currentUser.lastName?.[0] || ''}`.toUpperCase()
  const upcoming = userTrips.filter((t) => tripStatus(t) !== 'Past')
  const past = userTrips.filter((t) => tripStatus(t) === 'Past')

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-10 py-8 md:py-14 anim-fade">
      <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Profile</div>
      <h1 className="text-[clamp(28px,3.8vw,42px)] font-extrabold tracking-tight mt-3 mb-6">Your profile</h1>

      <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-8 grid md:grid-cols-3 gap-7 items-start">
        <div className="max-w-[230px]">
          <div className="aspect-square rounded-3xl grid place-items-center text-white text-3xl font-extrabold" style={{ background: 'var(--ac)' }}>{initials}</div>
          <div className="text-[19px] font-extrabold tracking-tight mt-4">{currentUser.firstName || currentUser.username} {currentUser.lastName}</div>
          <div className="text-[13px] text-[#6b6c80] font-semibold mt-1">{[currentUser.city, currentUser.country].filter(Boolean).join(', ') || 'No location set'}</div>
          <div onClick={() => { logout(); navigate('/login') }} className="mt-5 px-4 py-2.5 rounded-full border border-[#dfe1ec] text-xs font-bold text-[#6b6c80] cursor-pointer text-center hover:border-red-300 hover:text-red-500">
            Log out
          </div>
        </div>

        <div className="md:col-span-2 min-w-0">
          <div className="flex items-center justify-between gap-3.5 flex-wrap">
            <div className="text-[17px] font-extrabold tracking-tight">User details</div>
            {!editing && (
              <div onClick={startEdit} className="px-4.5 py-2.5 rounded-full border border-[#dfe1ec] text-[13px] font-bold cursor-pointer transition-all hover:border-[color:var(--ac)]" style={{ color: 'var(--ac-d)' }}>
                Edit
              </div>
            )}
          </div>

          {editing ? (
            <>
              <div className="grid sm:grid-cols-2 gap-4 mt-4.5">
                {PROFILE_FIELDS.map((f) => (
                  <Field
                    key={f.key}
                    label={f.label}
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4.5">
                <div onClick={save} className="px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer" style={{ background: 'var(--ac)' }}>Save changes</div>
                <div onClick={() => setEditing(false)} className="px-6 py-3 rounded-xl border border-[#dfe1ec] text-sm font-bold text-[#6b6c80] cursor-pointer">Cancel</div>
              </div>
            </>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3.5 mt-4.5">
              {PROFILE_FIELDS.map((f) => (
                <div key={f.key} className="p-3.5 rounded-2xl bg-[#f7f8fc] border border-[#eceef4]">
                  <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">{f.label.toUpperCase()}</div>
                  <div className="text-[15px] font-bold mt-1.5">{currentUser[f.key] || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-tight">Upcoming &amp; ongoing trips</h2>
        <TripGrid trips={upcoming} navigate={navigate} />
      </div>

      <div className="mt-10">
        <h2 className="text-[clamp(20px,2.4vw,26px)] font-extrabold tracking-tight">Previous trips</h2>
        <TripGrid trips={past} navigate={navigate} />
      </div>
    </div>
  )
}

function TripGrid({ trips, navigate }) {
  if (trips.length === 0) return <div className="mt-4"><EmptyState title="Nothing here yet" /></div>
  return (
    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
      {trips.map((t) => (
        <div key={t.id} className="bg-white border border-[#e9eaf2] rounded-3xl p-4.5 transition-transform hover:-translate-y-2 hover:shadow-2xl">
          <div className="h-24 rounded-2xl" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 8px,#f6f7fc 8px 16px)' }} />
          <div className="text-[16px] font-extrabold tracking-tight mt-3.5">{t.name}</div>
          <div className="text-[13px] text-[#6b6c80] mt-1 font-semibold">{fmtRange(t.startDate, t.endDate)}</div>
          <div onClick={() => navigate(`/trips/${t.id}`)} className="mt-3.5 py-2 rounded-full border border-[#dfe1ec] text-center text-[13px] font-bold cursor-pointer transition-all hover:bg-[var(--ink)] hover:text-white hover:border-transparent">
            View
          </div>
        </div>
      ))}
    </div>
  )
}
