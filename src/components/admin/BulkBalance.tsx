'use client'
import { useState } from 'react'
import { Button, Checkbox, Input, PageHead, SectionHeading, SignPanel } from '@/components/glow'

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
      <PageHead title="Bulk actions" sub="One-shot operations across every registered child." />

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="01" title="Set initial ticket balance" tone="cyan" />
        <p className="text-sm text-mist">
          Overwrites the ticket balance for every matching child and writes a comp reload row so the audit
          trail + stats reflect the top-up.
        </p>
        <div className="flex items-end gap-3">
          <label className="block"><span className="block text-sm">New balance</span>
            <Input type="number" min={0} max={100} value={balance}
              onChange={(e) => setBalance(e.target.value)}
              aria-label="new balance"
              className="w-32" /></label>
          <Checkbox
            label="Only not-yet-checked-in kids"
            checked={onlyNotCheckedIn}
            onChange={(e) => setOnlyNotCheckedIn(e.target.checked)}
          />
        </div>
        <Button type="button" tone="magenta" size="lg" onClick={() => setConfirming(true)} disabled={busy}>
          Apply…
        </Button>
        {error && <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        {result && (
          <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint">
            Updated {result.updated} {result.updated === 1 ? 'child' : 'children'}.
          </p>
        )}
      </section>

      {confirming && (
        <div role="dialog" aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <SignPanel tone="magenta" padding="lg" className="w-full max-w-sm space-y-4">
            <h3 className="font-display text-xl font-bold text-paper">Confirm bulk update</h3>
            <p className="text-paper">
              Set ticket balance to <strong>{balance}</strong> for{' '}
              {onlyNotCheckedIn ? 'every not-yet-checked-in' : 'every'} child.
            </p>
            <p className="text-sm text-mist">This cannot be undone in one click — you&apos;d have to fix children individually.</p>
            <div className="flex gap-2">
              <Button type="button" tone="ghost" fullWidth onClick={() => setConfirming(false)}>Cancel</Button>
              <Button type="button" tone="magenta" fullWidth loading={busy} disabled={busy} onClick={run}>
                Confirm
              </Button>
            </div>
          </SignPanel>
        </div>
      )}
    </div>
  )
}
