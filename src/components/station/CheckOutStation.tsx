'use client'
import { useState } from 'react'
import { StationShell } from './StationShell'
import ChildCard from './ChildCard'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'

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
  secondary_parent: { name: string; phone: string | null } | null
  pickup_authorizations: { name: string; relationship: string | null }[]
}

type PickupOption = { name: string; relationship: string | null; kind: 'primary' | 'secondary' | 'approved' }

export default function CheckOutStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [selected, setSelected] = useState<PickupOption | null>(null)
  const [staffName, setStaffName] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null); setSubmitError(null); setSuccess(false)
    setData(null); setSelected(null)
    if (!qr.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setLookupError(err.error ?? 'Lookup failed')
        return
      }
      setData(await res.json())
    } finally {
      setBusy(false)
    }
  }

  async function doCheckOut() {
    if (!data || !selected || !staffName.trim()) return
    setSubmitError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: data.child.id,
          checked_out_to_name: selected.name,
          checked_out_by_staff_name: staffName.trim(),
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setSubmitError(body.error ?? 'Check-out failed')
        return
      }
      setSuccess(true)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setQr('')
    setData(null)
    setSelected(null)
    setStaffName('')
    setLookupError(null)
    setSubmitError(null)
    setSuccess(false)
  }

  const options: PickupOption[] = data
    ? [
        ...(data.primary_parent ? [{ name: data.primary_parent.name, relationship: 'Primary parent', kind: 'primary' as const }] : []),
        ...(data.secondary_parent ? [{ name: data.secondary_parent.name, relationship: 'Secondary parent', kind: 'secondary' as const }] : []),
        ...data.pickup_authorizations.map((p) => ({ name: p.name, relationship: p.relationship, kind: 'approved' as const })),
      ]
    : []

  return (
    <StationShell
      eyebrow="Station · Check-out"
      title="Send them home safely"
      subtitle="Scan the wristband, confirm who&apos;s picking up, type your name."
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

      {data && (
        <div className="space-y-4">
          <ChildCard child={data.child} primary_parent={data.primary_parent ?? { name: '—', phone: null }} />

          {data.child.checked_out_at ? (
            <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
              Already checked out at {new Date(data.child.checked_out_at).toLocaleTimeString()}.
            </p>
          ) : !data.child.checked_in_at ? (
            <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
              This kid isn&apos;t checked in yet — send them to check-in first.
            </p>
          ) : (
            <>
              <fieldset className="space-y-2 rounded-2xl border border-ink-hair bg-ink-2/70 p-4">
                <legend className="text-xs font-semibold uppercase tracking-widest text-mist">
                  Who&apos;s picking up?
                </legend>
                <div className="grid gap-2">
                  {options.map((o) => {
                    const active = selected?.name === o.name && selected?.kind === o.kind
                    return (
                      <button
                        key={`${o.kind}:${o.name}`}
                        type="button"
                        onClick={() => setSelected(o)}
                        aria-pressed={active}
                        className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                          active
                            ? 'border-neon-magenta bg-neon-magenta/10 shadow-glow-magenta'
                            : 'border-ink-hair bg-ink-2 hover:border-neon-magenta/40'
                        }`}
                      >
                        <div className={`text-sm font-semibold ${active ? 'text-neon-magenta' : 'text-paper'}`}>{o.name}</div>
                        {o.relationship && <div className="text-xs text-faint mt-0.5">{o.relationship}</div>}
                      </button>
                    )
                  })}
                </div>
                {options.length === 0 && (
                  <p className="text-sm text-faint">No pickup options on file — contact the school admin.</p>
                )}
              </fieldset>

              <Input
                label="Your name (staff)"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                aria-label="staff name"
              />

              <Button
                type="button"
                tone="mint"
                size="xl"
                fullWidth
                onClick={doCheckOut}
                disabled={!selected || !staffName.trim() || busy}
                loading={busy}
              >
                Release to selected
              </Button>

              {submitError && (
                <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{submitError}</p>
              )}
            </>
          )}

          {success && (
            <>
              <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint animate-rise">
                ✨ Checked out safely. See them next time.
              </p>
              <Button tone="ghost" size="md" fullWidth onClick={reset}>Next kid</Button>
            </>
          )}
        </div>
      )}
    </StationShell>
  )
}
