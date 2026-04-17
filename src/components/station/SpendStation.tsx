'use client'
import { useEffect, useState } from 'react'
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

type CatalogItem = {
  id: string
  name: string
  ticket_cost: number
  station_slug: string
}

const STATION_STORAGE_KEY = 'sbbq_station'

export default function SpendStation() {
  const [station, setStation] = useState<string | null>(null)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [pending, setPending] = useState<CatalogItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [spendError, setSpendError] = useState<string | null>(null)
  const [lastSpend, setLastSpend] = useState<{ name: string; cost: number; balance: number } | null>(null)

  useEffect(() => {
    try {
      setStation(localStorage.getItem(STATION_STORAGE_KEY))
    } catch {
      setStation(null)
    }
  }, [])

  useEffect(() => {
    if (!station) return
    let cancelled = false
    fetch(`/api/catalog?station=${encodeURIComponent(station)}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setItems(j.items ?? []) })
    return () => { cancelled = true }
  }, [station])

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null); setSpendError(null); setLastSpend(null); setPending(null)
    setData(null); setBalance(null)
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
      setBalance(body.child.ticket_balance)
    } finally {
      setBusy(false)
    }
  }

  async function confirmSpend(item: CatalogItem) {
    if (!data || !station) return
    setSpendError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: data.child.id,
          station,
          catalog_item_id: item.id,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setSpendError(body.error === 'insufficient tickets'
          ? `Not enough tickets (has ${body.balance}, needs ${body.cost})`
          : body.error ?? 'Spend failed')
        return
      }
      setBalance(body.balance)
      setLastSpend({ name: body.item.name, cost: body.item.cost, balance: body.balance })
      setPending(null)
    } finally {
      setBusy(false)
    }
  }

  if (!station) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No station selected. <a href="/station" className="underline">Pick a station.</a>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black capitalize">{station.replace(/_/g, ' ')}</h1>
        <p className="text-slate-600">Scan wristband, pick an item, tickets deduct automatically.</p>
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

      {data && balance != null && (
        <div className="space-y-4">
          <ChildCard
            child={{
              first_name: data.child.first_name,
              last_name: data.child.last_name,
              age: data.child.age,
              grade: data.child.grade,
              allergies: data.child.allergies,
              photo_consent_app: data.child.photo_consent_app,
              ticket_balance: balance,
            }}
            primary_parent={data.primary_parent ?? { name: '—', phone: null }}
          />

          {data.child.checked_out_at ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">Already checked out.</p>
          ) : !data.child.checked_in_at ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">Not checked in yet.</p>
          ) : (
            <section className="space-y-2">
              <h2 className="text-lg font-bold">Items</h2>
              {items.length === 0 && (
                <p className="text-sm text-slate-500">No active items for this station.</p>
              )}
              <div className="grid gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPending(item)}
                    disabled={busy || balance < item.ticket_cost}
                    className="flex items-center justify-between rounded border-2 border-slate-200 bg-white px-4 py-3 text-left font-semibold disabled:opacity-50"
                  >
                    <span>{item.name}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-sm">{item.ticket_cost} 🎟</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {spendError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{spendError}</p>}
          {lastSpend && (
            <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
              Spent {lastSpend.cost} 🎟 on {lastSpend.name} · balance now {lastSpend.balance}.
            </p>
          )}
        </div>
      )}

      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
        >
          <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-5">
            <h3 className="text-xl font-bold">Confirm purchase</h3>
            <p>
              Spend <strong>{pending.ticket_cost} 🎟</strong> on <strong>{pending.name}</strong>?
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPending(null)}
                className="flex-1 rounded bg-slate-200 py-2 font-bold">
                Cancel
              </button>
              <button type="button" onClick={() => confirmSpend(pending)} disabled={busy}
                className="flex-1 rounded bg-fuchsia-600 py-2 font-bold text-white disabled:opacity-50">
                {busy ? 'Spending…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
