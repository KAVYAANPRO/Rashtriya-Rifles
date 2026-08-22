import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Field, PrimaryButton, InlineError, InlineNote } from '../components/ui'
import Logo from '../components/Logo'

export default function VerifyEmail() {
  const { verifyEmail, resendOtp } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNote('')
    if (!email.trim()) return setError('Enter the email you registered with.')
    if (code.trim().length !== 6) return setError('Enter the 6-digit code from your email.')

    setLoading(true)
    const res = await verifyEmail({ email, code })
    setLoading(false)
    if (!res.ok) return setError(res.error)
    navigate('/')
  }

  const resend = async () => {
    setError('')
    setNote('')
    if (!email.trim()) return setError('Enter your email first.')
    setResending(true)
    const res = await resendOtp(email)
    setResending(false)
    if (!res.ok) return setError(res.error)
    setNote('A new code is on its way.')
  }

  return (
    <div
      className="min-h-screen py-8 md:py-14 px-4 md:px-12 grid place-items-center"
      style={{ background: 'radial-gradient(1100px 520px at 12% -10%, var(--ac-w) 0%, transparent 70%), #F7F9FC' }}
    >
      <div className="w-full max-w-[460px] anim-rise">
        <Logo dark={false} size={30} textSize={18} className="mb-8" />

        <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>
          Verify email
        </div>
        <h1 className="text-[clamp(28px,3.8vw,40px)] font-extrabold tracking-tight mt-3 mb-1.5">Check your inbox.</h1>
        <p className="text-[#6b6c80] text-[15px] leading-relaxed mb-7">
          We sent a 6-digit code to your email address. It expires in 15 minutes.
        </p>

        <form onSubmit={submit} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7 shadow-[0_40px_80px_-50px_rgba(30,26,80,0.35)] flex flex-col gap-4">
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          <Field
            label="6-digit code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
          />
          <InlineError>{error}</InlineError>
          <InlineNote>{note}</InlineNote>
          <PrimaryButton type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify and continue'}</PrimaryButton>
          <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-[#6b6c80]">
            <span onClick={resending ? undefined : resend} className="font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>
              {resending ? 'Sending…' : 'Resend code'}
            </span>
            <span onClick={() => navigate('/login')} className="font-bold cursor-pointer text-[#6b6c80]">
              Back to login
            </span>
          </div>
        </form>

        <div className="mt-5 text-xs text-[#8b8ca0] leading-relaxed">
          No email configured on the server? The code is printed in the backend terminal.
        </div>
      </div>
    </div>
  )
}
