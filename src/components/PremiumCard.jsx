import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { payment } from '../lib/api'
import { Chip, Loading, InlineError } from './ui'

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()

  const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'))
    document.head.appendChild(script)
  })
}

const money = (amount, currency) =>
  `${currency === 'INR' ? '₹' : `${currency} `}${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

/**
 * Wraps the /payment endpoints: create-order, verify and history.
 * Premium lifts the 3-trip cap on free accounts.
 */
export default function PremiumCard() {
  const { currentUser, refreshUser, notify } = useApp()
  const [history, setHistory] = useState(null)
  const [historyError, setHistoryError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadHistory = () => {
    payment.history()
      .then(setHistory)
      .catch((err) => { setHistory([]); setHistoryError(err.message) })
  }

  useEffect(loadHistory, [])

  const upgrade = async () => {
    setError('')
    setBusy(true)
    try {
      const order = await payment.createOrder()
      await loadCheckout()

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'GlobalTrotter',
        description: 'Premium — unlimited trips',
        prefill: {
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          email: currentUser.email,
          contact: currentUser.phone || '',
        },
        theme: { color: '#FF6B35' },
        handler: async (response) => {
          try {
            await payment.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            await refreshUser()
            loadHistory()
            notify('You are Premium — plan as many trips as you like.', 'success')
          } catch (err) {
            setError(err.message)
          } finally {
            setBusy(false)
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false)
            loadHistory()
          },
        },
      })

      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed.')
        setBusy(false)
      })

      rzp.open()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const isPremium = currentUser.isPremium
  const used = currentUser.tripCount ?? 0
  const limit = currentUser.tripLimit

  return (
    <div className="bg-white border border-[#e6e7f0] rounded-3xl p-5 md:p-8">
      <div className="flex items-center justify-between gap-3.5 flex-wrap">
        <div className="text-[17px] font-extrabold tracking-tight">Plan</div>
        <Chip tone={isPremium ? 'green' : 'muted'}>{isPremium ? 'Premium' : 'Free'}</Chip>
      </div>

      {isPremium ? (
        <p className="text-[13px] text-[#6b6c80] mt-2.5 leading-relaxed max-w-[560px]">
          Premium is active — unlimited trips, no caps.
        </p>
      ) : (
        <>
          <p className="text-[13px] text-[#6b6c80] mt-2.5 leading-relaxed max-w-[560px]">
            Free accounts can plan up to {limit ?? 3} trips. Premium is a one-time ₹999 upgrade
            for unlimited trips.
          </p>
          <div className="flex gap-1.5 flex-wrap mt-3.5">
            <Chip tone="accent">{used} of {limit ?? 3} trips used</Chip>
          </div>
          <button
            onClick={upgrade}
            disabled={busy}
            className="mt-4 px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--ac)' }}
          >
            {busy ? 'Opening checkout…' : 'Upgrade to Premium — ₹999'}
          </button>
        </>
      )}

      {error && <div className="mt-3"><InlineError>{error}</InlineError></div>}

      <div className="mt-6">
        <div className="mono text-[10px] text-[#8b8ca0] tracking-widest">PAYMENT HISTORY</div>
        {history === null && <Loading label="Loading payments…" />}
        {historyError && <div className="mt-2"><InlineError>{historyError}</InlineError></div>}
        {history && history.length === 0 && !historyError && (
          <div className="text-sm text-[#8b8ca0] mt-2">No payments yet.</div>
        )}
        {history && history.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#f7f8fc] border border-[#eceef4]">
                <div className="min-w-0">
                  <div className="text-sm font-bold">{money(p.amount, p.currency)}</div>
                  <div className="mono text-[11px] text-[#8b8ca0] mt-0.5 truncate">{p.razorpayOrderId}</div>
                </div>
                <Chip tone={p.status === 'success' ? 'green' : 'muted'}>{p.status}</Chip>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
