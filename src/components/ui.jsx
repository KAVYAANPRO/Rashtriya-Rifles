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
