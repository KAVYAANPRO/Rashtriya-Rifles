import { useState } from 'react'

export function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-[#3c3d52]">{label}</span>
      <input
        {...props}
        className="h-[52px] px-4 border border-[#dfe1ec] rounded-xl bg-[#fbfbfe] text-[15px] outline-none transition-all focus:border-[color:var(--ac)] focus:bg-white focus:shadow-[0_0_0_4px_var(--ac-w)]"
      />
    </label>
  )
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-[#3c3d52]">{label}</span>
      <select
        {...props}
        className="h-[52px] px-3.5 border border-[#dfe1ec] rounded-xl bg-[#fbfbfe] text-[15px] outline-none appearance-none focus:border-[color:var(--ac)]"
      >
        {children}
      </select>
    </label>
  )
}

export function TextAreaField({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-[#3c3d52]">{label}</span>
      <textarea
        {...props}
        className="p-3.5 border border-[#dfe1ec] rounded-xl bg-[#fbfbfe] text-[15px] outline-none resize-y focus:border-[color:var(--ac)] focus:bg-white focus:shadow-[0_0_0_4px_var(--ac-w)]"
      />
    </label>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`h-[54px] rounded-xl text-white text-[15px] font-bold cursor-pointer transition-colors hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: 'var(--ac)' }}
    >
      {children}
    </button>
  )
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="border border-dashed border-[#d6d8e6] rounded-3xl py-16 px-6 text-center bg-white/60">
      <div className="text-lg font-extrabold text-[var(--ink)]">{title}</div>
      {subtitle && <div className="text-sm text-[#6b6c80] mt-2 max-w-md mx-auto">{subtitle}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function ConfirmButton({ label, confirmLabel = 'Confirm delete', onConfirm, className = '' }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setConfirming(false); onConfirm() }}
          className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold cursor-pointer"
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-full border border-[#dfe1ec] text-xs font-bold cursor-pointer text-[#6b6c80]"
        >
          Cancel
        </button>
      </div>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className={className}>
      {label}
    </button>
  )
}

/* ── shared bits used by the screens added for the API-backed features ──
   These reuse the same tokens and shapes as the components above so new
   panels sit inside the existing design rather than beside it. */

export function InlineError({ children }) {
  if (!children) return null
  return (
    <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      {children}
    </div>
  )
}

export function InlineNote({ children }) {
  if (!children) return null
  return (
    <div className="text-sm font-semibold rounded-lg px-3 py-2" style={{ background: 'var(--ac2-w)', color: 'var(--ac2-d)' }}>
      {children}
    </div>
  )
}

export function Panel({ children, className = '' }) {
  return <div className={`bg-[#f7f8fc] rounded-2xl p-4 ${className}`}>{children}</div>
}

export function Chip({ children, tone = 'muted' }) {
  const tones = {
    muted: { background: '#f2f3f8', color: '#6b6c80' },
    accent: { background: 'var(--ac-w)', color: 'var(--ac-d)' },
    green: { background: 'var(--green-w)', color: 'var(--ac2-d)' },
  }
  return (
    <div className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={tones[tone] || tones.muted}>
      {children}
    </div>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`px-5 py-2.5 rounded-full border border-[#dfe1ec] bg-white text-sm font-bold cursor-pointer transition-all hover:border-[color:var(--ac)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ color: 'var(--ac-d)' }}
    >
      {children}
    </button>
  )
}

export function LinkButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ color: 'var(--ac)' }}
    >
      {children}
    </button>
  )
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2.5 text-[#6b6c80] text-sm font-semibold py-3">
      <span
        className="w-3.5 h-3.5 rounded-full border-2 border-[#e2e4ee]"
        style={{ borderTopColor: 'var(--ac)', animation: 'gt-spin .8s linear infinite' }}
      />
      {label}
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-3">
        <span
          className="w-7 h-7 rounded-full border-[3px] border-[#e2e4ee]"
          style={{ borderTopColor: 'var(--ac)', animation: 'gt-spin .8s linear infinite' }}
        />
        <div className="mono text-[11px] tracking-[0.18em] uppercase font-bold text-[#8b8ca0]">{label}</div>
      </div>
    </div>
  )
}
