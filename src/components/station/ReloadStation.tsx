'use client'
import { useState } from 'react'
import { StationShell } from './StationShell'
import ChildCard from './ChildCard'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { Card, CardEyebrow } from '@/components/glow/Card'

type Lookup = {
  child: {
    id: string
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
    allergies: string | null
    photo_consent_app: boolean
    checked_in_at: string | null
    checked_out_at: string | null
    drink_tickets_remaining: number
    jail_tickets_remaining: number
    prize_wheel_used_at: string | null
    dj_shoutout_used_at: string | null
  }
  primary_parent: { name: string; phone: string | null } | null
}

type FactsInfo = {
  drink_tickets: number
  facts_reload_permission: boolean
  facts_max_amount: number
  facts_spent: number
  facts_remaining: number
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'facts', label: 'FACTS' },
  { value: 'comp', label: 'Comp' },
] as const

type PaymentMethod = typeof PAYMENT_METHODS[number]['value']

export default function ReloadStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [facts, setFacts] = useState<FactsInfo | null>(null)
  const [tickets, setTickets] = useState('1')
  const [amount, setAmount] = useState('1.00')
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
      if (method !== 'comp') {
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
      setSuccess(`+${ticketsNum} drink ticket${ticketsNum === 1 ? '' : 's'} · balance now ${body.drink_tickets}`)
      setData({ ...data, child: { ...data.child, drink_tickets_remaining: body.drink_tickets } })
      const fRes = await fetch(`/api/reload?child_id=${encodeURIComponent(data.child.id)}`)
      if (fRes.ok) setFacts(await fRes.json())
    } finally {
      setBusy(false)
    }
  }

  const factsDisabled = facts ? !facts.facts_reload_permission || facts.facts_remaining <= 0 : false

  return (
    <StationShell
      eyebrow="Station · Reload"
      title="Top up drink tickets"
      subtitle="Only drink tickets reload — jail, prize wheel, and DJ are fixed at the start."
    >
      <form onSubmit={doLookup} className="flex gap-2">
        <Input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="Scan or paste QR"
          aria-label="QR code"
          className="flex-1"
        />
        <Button type="submit" tone="ghost" size="md" loading={busy}>Look up</Button>
      </form>

      {lookupError && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{lookupError}</p>
      )}

      {data && facts && (
        <div className="space-y-4">
          <ChildCard child={data.child} primary_parent={data.primary_parent ?? { name: '—', phone: null }} />

          <Card tone="default" padded className="text-sm">
            <CardEyebrow className="text-neon-cyan">FACTS allowance</CardEyebrow>
            <div className="mt-1 text-mist">
              {facts.facts_reload_permission ? (
                <>
                  ${facts.facts_spent.toFixed(2)} used of ${facts.facts_max_amount.toFixed(2)} —{' '}
                  <span className="text-paper font-semibold">${facts.facts_remaining.toFixed(2)} left</span>
                </>
              ) : (
                <span className="text-faint">Not permitted</span>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tickets to add"
              type="number"
              min={1}
              max={20}
              value={tickets}
              onChange={(e) => setTickets(e.target.value)}
              aria-label="tickets to add"
            />
            <Input
              label="Amount charged ($)"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={method === 'comp'}
              aria-label="amount charged"
            />
          </div>

          <fieldset className="space-y-2 rounded-2xl border border-ink-hair bg-ink-2/70 p-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-mist">Payment method</legend>
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
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:opacity-40 ${
                      active
                        ? 'border-neon-magenta bg-neon-magenta/10 text-neon-magenta shadow-glow-magenta'
                        : 'border-ink-hair bg-ink-2 text-paper hover:border-neon-magenta/40'
                    }`}
                  >
                    {m.label}
                    {m.value === 'facts' && facts.facts_reload_permission && (
                      <span className="block text-[10px] font-normal text-faint mt-0.5">
                        ${facts.facts_remaining.toFixed(2)} left
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Input
            label="Your name (staff)"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            aria-label="staff name"
          />

          <Button
            type="button"
            tone="magenta"
            size="xl"
            fullWidth
            onClick={doReload}
            disabled={busy}
            loading={busy}
          >
            Add {tickets} drink ticket{Number(tickets) === 1 ? '' : 's'}
          </Button>

          {submitError && (
            <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{submitError}</p>
          )}
          {success && (
            <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint animate-rise">
              ✨ {success}
            </p>
          )}
        </div>
      )}
    </StationShell>
  )
}
