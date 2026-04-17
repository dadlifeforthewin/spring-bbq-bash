'use client'
import { useState } from 'react'

export default function BulkBalance() {
  const [balance, setBalance] = useState('10')
  const [onlyNotCheckedIn, setOnlyNotCheckedIn] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ updated: number } | null>(null)

  async function run() {
    setBusy(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/bulk/set-initial-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: Number(balance) || 0,
          only_not_checked_in: onlyNotCheckedIn,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Bulk failed')
        return
      }
      setResult({ updated: body.updated })
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">Bulk actions</h1>
        <p className="text-slate-500">One-shot operations across every registered child.</p>
      </header>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Set initial ticket balance</h2>
        <p className="text-sm text-slate-600">
          Overwrites the ticket balance for every matching child and writes a comp reload row so the audit
          trail + stats reflect the top-up.
        </p>
        <div className="flex items-end gap-3">
          <label className="block"><span className="block text-sm">New balance</span>
            <input type="number" min={0} max={100} value={balance}
              onChange={(e) => setBalance(e.target.value)}
              aria-label="new balance"
              className="w-32 rounded border px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyNotCheckedIn}
              onChange={(e) => setOnlyNotCheckedIn(e.target.checked)} />
            Only not-yet-checked-in kids
          </label>
        </div>
        <button type="button" onClick={() => setConfirming(true)} disabled={busy}
          className="rounded bg-fuchsia-600 px-6 py-2 font-bold text-white disabled:opacity-50">
          Apply…
        </button>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {result && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            Updated {result.updated} {result.updated === 1 ? 'child' : 'children'}.
          </p>
        )}
      </section>

      {confirming && (
        <div role="dialog" aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-5">
            <h3 className="text-xl font-bold">Confirm bulk update</h3>
            <p>
              Set ticket balance to <strong>{balance}</strong> for{' '}
              {onlyNotCheckedIn ? 'every not-yet-checked-in' : 'every'} child.
            </p>
            <p className="text-sm text-slate-500">This cannot be undone in one click — you&apos;d have to fix children individually.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming(false)}
                className="flex-1 rounded bg-slate-200 py-2 font-bold">Cancel</button>
              <button type="button" onClick={run} disabled={busy}
                className="flex-1 rounded bg-fuchsia-600 py-2 font-bold text-white disabled:opacity-50">
                {busy ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
