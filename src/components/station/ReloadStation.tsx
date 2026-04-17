'use client'
import { useState } from 'react'
import ChildCard from './ChildCard'

type Lookup = {
  child: {
    id: string
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
    allergies: string | null
    photo_consent_app: boolean
    ticket_balance: number
    checked_in_at: string | null
    checked_out_at: string | null
  }
  primary_parent: { name: string; phone: string | null } | null
}

type FactsInfo = {
  balance: number
  facts_reload_permission: boolean
  facts_max_amount: number
  facts_spent: number
  facts_remaining: number
}

const PAYMENT_METHODS = [
  { value: 'facts', label: 'FACTS' },
  { value: 'cash', label: 'Cash' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'comp', label: 'Comp' },
] as const

type PaymentMethod = typeof PAYMENT_METHODS[number]['value']

export default function ReloadStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [facts, setFacts] = useState<FactsInfo | null>(null)
  const [tickets, setTickets] = useState('5')
  const [amount, setAmount] = useState('5.00')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [staffName, setStaffName] = useState('')
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null); setSubmitError(null); setSuccess(null)
    setData(null); setFacts(null)
    if (!qr.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setLookupError(err.error ?? 'Lookup failed')
        return
      }
      const body = (await res.json()) as Lookup
      setData(body)
      const fRes = await fetch(`/api/reload?child_id=${encodeURIComponent(body.child.id)}`)
      if (fRes.ok) setFacts(await fRes.json())
    } finally {
      setBusy(false)
    }
  }

  async function doReload() {
    if (!data) return
    setSubmitError(null); setSuccess(null)
    const ticketsNum = Number(tickets)
    if (!Number.isInteger(ticketsNum) || ticketsNum <= 0) {
      setSubmitError('Enter a whole number of tickets.')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        child_id: data.child.id,
        tickets_added: ticketsNum,
        payment_method: method,
        staff_name: staffName,
      }
      if (method === 'facts' || method === 'cash' || method === 'venmo') {
        const amt = Number(amount)
        if (!Number.isFinite(amt) || amt < 0) {
          setSubmitError('Enter a valid amount.')
          setBusy(false)
          return
        }
        payload.amount_charged = amt
      }
      const res = await fetch('/api/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setSubmitError(body.error ?? 'Reload failed')
        return
      }
      setSuccess(`+${ticketsNum} 🎟 · balance ${body.balance}`)
      // Refresh facts info
      const fRes = await fetch(`/api/reload?child_id=${encodeURIComponent(data.child.id)}`)
      if (fRes.ok) setFacts(await fRes.json())
    } finally {
      setBusy(false)
    }
  }

  const factsDisabled = facts ? !facts.facts_reload_permission || facts.facts_remaining <= 0 : false

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Reload</h1>
        <p className="text-slate-600">Top up a wristband with tickets. FACTS caps per child.</p>
      </header>

      <form onSubmit={doLookup} className="flex gap-2">
        <input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="QR code / child UUID"
          aria-label="QR code"
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50">
          Look up
        </button>
      </form>

      {lookupError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{lookupError}</p>}

      {data && facts && (
        <div className="space-y-4">
          <ChildCard
            child={{
              first_name: data.child.first_name,
              last_name: data.child.last_name,
              age: data.child.age,
              grade: data.child.grade,
              allergies: data.child.allergies,
              photo_consent_app: data.child.photo_consent_app,
              ticket_balance: facts.balance,
            }}
            primary_parent={data.primary_parent ?? { name: '—', phone: null }}
          />

          <div className="rounded bg-slate-50 p-3 text-sm">
            FACTS: {facts.facts_reload_permission ? (
              <span>${facts.facts_spent.toFixed(2)} used of ${facts.facts_max_amount.toFixed(2)} · ${facts.facts_remaining.toFixed(2)} left</span>
            ) : (
              <span className="text-slate-500">not permitted</span>
            )}
          </div>

          <label className="block">
            <span className="block text-sm">Tickets to add</span>
            <input type="number" min={1} max={100} value={tickets}
              onChange={(e) => setTickets(e.target.value)}
              aria-label="tickets to add"
              className="w-full rounded border px-3 py-2" />
          </label>

          <label className="block">
            <span className="block text-sm">Amount charged ($)</span>
            <input type="number" min={0} step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="amount charged"
              disabled={method === 'comp'}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-100" />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">Payment method</legend>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const disabled = m.value === 'facts' && factsDisabled
                const active = method === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    disabled={disabled}
                    aria-pressed={active}
                    className={`rounded border-2 px-3 py-2 font-bold disabled:opacity-40 ${
                      active ? 'border-fuchsia-600 bg-fuchsia-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {m.label}
                    {m.value === 'facts' && facts.facts_reload_permission && (
                      <span className="block text-xs font-normal text-slate-500">
                        ${facts.facts_remaining.toFixed(2)} left
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="block text-sm">Your name (staff)</span>
            <input type="text" value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              aria-label="staff name"
              className="w-full rounded border px-3 py-2" />
          </label>

          <button type="button" onClick={doReload} disabled={busy}
            className="w-full rounded bg-fuchsia-600 py-3 font-bold text-white disabled:opacity-50">
            {busy ? 'Reloading…' : `Add ${tickets} 🎟`}
          </button>

          {submitError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
          {success && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
        </div>
      )}
    </main>
  )
}
