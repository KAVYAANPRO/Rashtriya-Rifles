import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Field, PrimaryButton } from '../components/ui'
import Logo from '../components/Logo'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ananya.rao@example.com')
  const [password, setPassword] = useState('travel2026')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const stageRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const onMove = (e) => {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x, y })
  }
  const onLeave = () => setTilt({ x: 0, y: 0 })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter both an email and a password.')
      return
    }
    setLoading(true)
    const res = await login({ email, password })
    setLoading(false)
    if (res.ok) {
      navigate('/')
      return
    }
    // An unverified account needs the OTP screen, not an error message.
    if (res.code === 'EMAIL_NOT_VERIFIED') {
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`)
      return
    }
    setError(res.error)
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 items-stretch">
      <div className="relative bg-[var(--ink)] overflow-hidden min-h-[280px] p-8 md:p-14 flex flex-col gap-10">
        <div className="absolute w-[620px] h-[620px] -left-[180px] -top-[160px] rounded-full opacity-50 blur-2xl anim-drift" style={{ background: 'radial-gradient(circle at 40% 40%, var(--ac) 0%, transparent 68%)' }} />
        <div className="absolute w-[520px] h-[520px] -right-[160px] -bottom-[180px] rounded-full opacity-40 blur-2xl anim-drift" style={{ background: 'radial-gradient(circle at 50% 50%, var(--ac2) 0%, transparent 66%)', animationDirection: 'reverse', animationDuration: '21s' }} />

        <Logo size={32} textSize={19} className="relative shrink-0" />

        <div
          ref={stageRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative hidden md:block shrink-0 mx-auto"
          style={{ perspective: '1200px', height: 'min(40vh, 320px)', width: 'min(100%, 380px)' }}
        >
          <div className="absolute left-0 top-0 anim-bob" style={{ width: 'min(50%, 220px)', animationDuration: '7s' }}>
            <div
              className="rounded-[20px] p-5"
              style={{
                background: 'linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 50px 80px -40px rgba(0,0,0,0.9)',
                transform: `rotateY(${-6 + tilt.x * 22}deg) rotateX(${3 - tilt.y * 22}deg) translateZ(20px)`,
                transition: 'transform .4s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <div className="flex justify-between items-center text-white/50 mono text-[10px] tracking-[0.16em]">
                <span>BOARDING PASS</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ac2)' }} />
                  GT-1042
                </span>
              </div>
              <div className="flex items-end gap-3.5 mt-4 text-white">
                <div className="text-[30px] font-extrabold tracking-tight">CDG</div>
                <div className="flex-1 h-px mb-2.5" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.12))' }} />
                <div className="text-[30px] font-extrabold tracking-tight">KIX</div>
              </div>
              <div className="mt-3.5 text-white/60 mono text-xs leading-relaxed">12 MAR · 08:45 · GATE 22B</div>
            </div>
          </div>

          <div className="absolute right-0 top-4 anim-bob" style={{ width: 'min(42%, 190px)', animationDuration: '8.5s', animationDelay: '-2.5s' }}>
            <div
              className="bg-white rounded-2xl p-4.5"
              style={{
                boxShadow: '0 50px 90px -40px rgba(0,0,0,0.95)',
                transform: `rotateY(${6 + tilt.x * 18}deg) rotateX(${-2 - tilt.y * 18}deg) translateZ(30px)`,
                transition: 'transform .4s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <div className="mono text-[10px] tracking-[0.16em] text-[#8b8ca0]">TRIP BUDGET</div>
              <div className="text-[28px] font-extrabold tracking-tight mt-2">$3,200</div>
              <div className="h-[7px] rounded-full bg-[#eceef6] mt-3 overflow-hidden">
                <div className="h-full rounded-full anim-grow" style={{ width: '57%', background: 'var(--ac)' }} />
              </div>
              <div className="mt-2.5 text-xs text-[#6b6c80] font-semibold">57% spent · 4 stops</div>
            </div>
          </div>

          <div className="absolute left-0 anim-bob" style={{ top: '180px', width: 'min(58%, 250px)', animationDuration: '9.5s', animationDelay: '-5s' }}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 40px 80px -36px rgba(0,0,0,0.9)',
                transform: `rotateY(${-4 + tilt.x * 14}deg) rotateX(${2 - tilt.y * 14}deg) translateZ(10px)`,
                transition: 'transform .4s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <div className="h-[120px] grid place-items-center text-white/45 mono text-[10px] tracking-[0.14em] uppercase" style={{ background: 'repeating-linear-gradient(135deg,#25253a 0 9px,#2e2e46 9px 18px)' }}>
                city photo
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-white/55 text-sm leading-relaxed max-w-[420px] shrink-0">
          Plan multi-city trips, build day-by-day itineraries and keep the whole budget in one place.
          <div className="mt-6 text-white/35 text-xs mono">Demo login: ananya.rao@example.com / travel2026</div>
        </div>
      </div>

      <div className="grid place-items-center p-8 md:p-14 bg-[var(--bg)]">
        <form onSubmit={submit} className="w-full max-w-[420px] anim-rise">
          <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>Sign in</div>
          <h1 className="text-[clamp(32px,4.4vw,44px)] font-extrabold tracking-tight mt-3 mb-1.5">Welcome back.</h1>
          <p className="text-[#6b6c80] text-[15px] leading-relaxed mb-7">Your trips, stops and budgets are exactly where you left them.</p>
          <div className="flex flex-col gap-4">
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {error && <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <PrimaryButton type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</PrimaryButton>
            <GoogleSignInButton onError={setError} />
            <div className="text-center text-sm text-[#6b6c80]">
              <span onClick={() => navigate('/forgot-password')} className="font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>
                Forgot your password?
              </span>
            </div>
            <div className="text-center text-sm text-[#6b6c80]">
              New here?{' '}
              <span onClick={() => navigate('/register')} className="font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>
                Create an account
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
