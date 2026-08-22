import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Field, PrimaryButton, InlineError, InlineNote } from '../components/ui'
import Logo from '../components/Logo'

export default function ForgotPassword() {
  const { forgotPassword, resetPassword, notify } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState('request') // request | reset
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async (e) => {
    e.preventDefault()
    setError('')
    setNote('')
    if (!email.trim()) return setError('Enter the email on your account.')

    setLoading(true)
    const res = await forgotPassword(email)
    setLoading(false)
    if (!res.ok) return setError(res.error)
    setNote('If that email exists, a reset code has been sent.')
    setStep('reset')
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setError('')
    setNote('')
    if (code.trim().length !== 6) return setError('Enter the 6-digit code from your email.')
    if (newPassword.length < 8) return setError('New password should be at least 8 characters.')

    setLoading(true)
    const res = await resetPassword({ email, code, newPassword })
    setLoading(false)
    if (!res.ok) return setError(res.error)
    notify('Password reset — sign in with your new password.', 'success')
    navigate('/login')
  }

  return (
    <div
      className="min-h-screen py-8 md:py-14 px-4 md:px-12 grid place-items-center"
      style={{ background: 'radial-gradient(1100px 520px at 12% -10%, var(--ac-w) 0%, transparent 70%), #F7F9FC' }}
    >
      <div className="w-full max-w-[460px] anim-rise">
        <Logo dark={false} size={30} textSize={18} className="mb-8" />

        <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: 'var(--ac)' }}>
          Reset password
        </div>
        <h1 className="text-[clamp(28px,3.8vw,40px)] font-extrabold tracking-tight mt-3 mb-1.5">
          {step === 'request' ? 'Forgot your password?' : 'Set a new password.'}
        </h1>
        <p className="text-[#6b6c80] text-[15px] leading-relaxed mb-7">
          {step === 'request'
            ? "Tell us your email and we'll send a 6-digit reset code."
            : 'Enter the code we sent, then choose a new password.'}
        </p>

        {step === 'request' ? (
          <form onSubmit={requestCode} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7 shadow-[0_40px_80px_-50px_rgba(30,26,80,0.35)] flex flex-col gap-4">
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            <InlineError>{error}</InlineError>
            <PrimaryButton type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset code'}</PrimaryButton>
            <div className="text-center text-sm text-[#6b6c80]">
              <span onClick={() => navigate('/login')} className="font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>
                Back to login
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={submitReset} className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-7 shadow-[0_40px_80px_-50px_rgba(30,26,80,0.35)] flex flex-col gap-4">
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field
              label="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
            />
            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <InlineNote>{note}</InlineNote>
            <InlineError>{error}</InlineError>
            <PrimaryButton type="submit" disabled={loading}>{loading ? 'Saving…' : 'Reset password'}</PrimaryButton>
            <div className="text-center text-sm text-[#6b6c80]">
              <span onClick={() => setStep('request')} className="font-bold cursor-pointer" style={{ color: 'var(--ac)' }}>
                Send another code
              </span>
            </div>
          </form>
        )}

        <div className="mt-5 text-xs text-[#8b8ca0] leading-relaxed">
          No email configured on the server? The code is printed in the backend terminal.
        </div>
      </div>
    </div>
  )
}
