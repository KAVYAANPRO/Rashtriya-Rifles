import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load Google Sign-In.'))
    document.head.appendChild(script)
  })
}

/**
 * Renders Google's own button when VITE_GOOGLE_CLIENT_ID is configured.
 * Without that key it renders nothing, so the sign-in form stays as designed.
 */
export default function GoogleSignInButton({ onError }) {
  const { googleLogin } = useApp()
  const navigate = useNavigate()
  const holder = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return
    let alive = true

    loadGoogleScript()
      .then(() => {
        if (!alive || !holder.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            const res = await googleLogin(response.credential)
            if (res.ok) navigate('/')
            else onError?.(res.error)
          },
        })
        window.google.accounts.id.renderButton(holder.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
          shape: 'pill',
        })
        setReady(true)
      })
      .catch((err) => onError?.(err.message))

    return () => { alive = false }
  }, [googleLogin, navigate, onError])

  if (!CLIENT_ID) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e6e7f0]" />
        <span className="mono text-[10px] tracking-[0.16em] uppercase text-[#8b8ca0]">or</span>
        <div className="flex-1 h-px bg-[#e6e7f0]" />
      </div>
      <div ref={holder} className="flex justify-center min-h-[44px]" />
      {!ready && <div className="text-center text-xs text-[#8b8ca0]">Loading Google Sign-In…</div>}
    </div>
  )
}
