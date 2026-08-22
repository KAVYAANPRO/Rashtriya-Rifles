import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Field, TextAreaField, PrimaryButton } from '../components/ui'

const FIELDS = [
  { key: 'email', label: 'Email', hint: 'jane@example.com', type: 'email' },
  { key: 'password', label: 'Password', hint: 'At least 8 characters', type: 'password' },
  { key: 'firstName', label: 'First name', hint: 'Jane' },
  { key: 'lastName', label: 'Last name', hint: 'Doe' },
  { key: 'phone', label: 'Phone', hint: '+1 555 010 1234' },
  { key: 'city', label: 'City', hint: 'Austin' },
  { key: 'country', label: 'Country', hint: 'United States' },
]

export default function Register() {
  const { register } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email?.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      setError('First and last name are required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password should be at least 8 characters.')
      return
    }
    setLoading(true)
    const res = await register(form)
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    // A 6-digit code was just emailed — send them straight to the OTP screen.
    navigate(`/verify-email?email=${encodeURIComponent(res.email || form.email.trim())}`)
  }

  return (
    <div className="min-h-screen py-8 md:py-14 px-4 md:px-12" style={{ background: 'radial-gradient(1100px 520px at 12% -10%, var(--ac-w) 0%, transparent 70%), #F7F9FC' }}>
      <div className="max-w-[1080px] mx-auto anim-rise">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Create account</div>
            <h1 className="text-[clamp(28px,3.8vw,40px)] font-extrabold tracking-tight mt-3">Create your traveller profile</h1>
          </div>
          <div onClick={() => navigate('/login')} className="text-sm font-bold text-[#6b6c80] cursor-pointer">Back to login</div>
        </div>

        <form onSubmit={submit} className="mt-7 bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-9 shadow-[0_40px_80px_-44px_rgba(30,26,80,0.35)] grid md:grid-cols-3 gap-7">
          <div className="flex flex-col gap-4 items-start">
            <div className="w-full max-w-[230px] aspect-square rounded-3xl grid place-items-center text-[#8b8ca0] mono text-[10px] tracking-widest uppercase border border-dashed border-[#d6d8e6]" style={{ background: 'repeating-linear-gradient(135deg,#eceef7 0 9px,#f5f6fb 9px 18px)' }}>
              photo
            </div>
            <div className="px-4 py-2.5 rounded-full border border-[#dfe1ec] text-[13px] font-bold cursor-not-allowed bg-white text-[#8b8ca0]" title="Photo upload is wired up once the backend is connected">
              Upload picture
            </div>
            <div className="text-xs text-[#8b8ca0] leading-relaxed">JPG or PNG, up to 5 MB. Enabled once photo storage is connected.</div>
          </div>

          <div className="md:col-span-2 min-w-0">
            <div className="grid sm:grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  type={f.type || 'text'}
                  placeholder={f.hint}
                  value={form[f.key] || ''}
                  onChange={set(f.key)}
                />
              ))}
            </div>
            <div className="mt-4">
              <TextAreaField
                label="Additional information"
                rows={4}
                placeholder="Travel style, dietary needs, preferred currency…"
                value={form.bio || ''}
                onChange={set('bio')}
              />
            </div>
            {error && <div className="mt-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex items-center gap-4 mt-6 flex-wrap">
              <PrimaryButton type="submit" className="px-8" disabled={loading} style={{ width: 'auto' }}>
                {loading ? 'Creating…' : 'Register user'}
              </PrimaryButton>
              <div className="text-[13px] text-[#8b8ca0] leading-snug max-w-[280px]">
                We'll email you a 6-digit code to confirm your address before your first sign-in.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
