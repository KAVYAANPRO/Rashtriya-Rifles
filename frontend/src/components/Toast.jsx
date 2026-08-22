import { useApp } from '../store/AppContext'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  const colors = {
    success: 'bg-[var(--ink)] text-white',
    info: 'bg-[var(--ink)] text-white',
    error: 'bg-red-600 text-white',
  }
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] anim-fade">
      <div className={`px-5 py-3 rounded-full text-sm font-semibold shadow-2xl ${colors[toast.kind] || colors.info}`}>
        {toast.message}
      </div>
    </div>
  )
}
