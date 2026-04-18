'use client'
import { useState } from 'react'
import { StationShell } from './StationShell'
import ChildCard from './ChildCard'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'

type Lookup = {
  child: {
    id: string
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
    allergies: string | null
    special_instructions: string | null
    photo_consent_app: boolean
    photo_consent_promo: boolean
    vision_matching_consent: boolean
    facts_reload_permission: boolean
    facts_max_amount: number
    drink_tickets_remaining: number
    jail_tickets_remaining: number
    prize_wheel_used_at: string | null
    dj_shoutout_used_at: string | null
    checked_in_at: string | null
    checked_in_dropoff_type: string | null
    checked_out_at: string | null
    checked_out_to_name: string | null
  }
  primary_parent: { name: string; phone: string | null; email: string | null } | null
  secondary_parent: { name: string; phone: string | null; email: string | null } | null
  pickup_authorizations: { name: string; relationship: string | null }[]
}

type Timeline = {
  events: {
    id: string
    station: string
    event_type: string
    tickets_delta: number
    item_name: string | null
    volunteer_name: string | null
    created_at: string
  }[]
  reloads: {
    tickets_added: number
    payment_method: string
    amount_charged: number | null
    staff_name: string | null
    created_at: string
  }[]
}

export default function LookupStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null); setData(null); setTimeline(null)
    if (!qr.trim()) return
    setBusy(true)
    try {
      const [childRes, tlRes] = await Promise.all([
        fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}`),
        fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}/timeline`),
      ])
      if (!childRes.ok) {
        const err = await childRes.json().catch(() => ({}))
        setError(err.error ?? 'Lookup failed')
        return
      }
      setData(await childRes.json())
      if (tlRes.ok) setTimeline(await tlRes.json())
    } finally {
      setBusy(false)
    }
  }

  return (
    <StationShell
      eyebrow="Station · Profile lookup"
      title="Who is this kid?"
      subtitle="Read-only view — useful for questions, allergies, or check-in checks."
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

      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {data && (
        <div className="space-y-4">
          <ChildCard child={data.child} primary_parent={data.primary_parent ?? { name: '—', phone: null }} />

          <Card tone="default" padded className="text-sm space-y-2">
            <CardEyebrow className="text-neon-cyan">Consents</CardEyebrow>
            <ul className="space-y-1 text-paper">
              <li className="flex justify-between"><span className="text-mist">App photos</span><span>{data.child.photo_consent_app ? 'YES' : 'NO'}</span></li>
              <li className="flex justify-between"><span className="text-mist">Promo / social</span><span>{data.child.photo_consent_promo ? 'YES' : 'NO'}</span></li>
              <li className="flex justify-between"><span className="text-mist">Vision matching</span><span>{data.child.vision_matching_consent ? 'YES' : 'NO'}</span></li>
              <li className="flex justify-between"><span className="text-mist">FACTS</span><span>{data.child.facts_reload_permission ? `up to $${data.child.facts_max_amount.toFixed(2)}` : 'no'}</span></li>
            </ul>
          </Card>

          {data.child.special_instructions && (
            <Card tone="default" padded className="text-sm">
              <CardEyebrow className="text-neon-uv">Special instructions</CardEyebrow>
              <p className="mt-1 text-paper">{data.child.special_instructions}</p>
            </Card>
          )}

          <Card tone="default" padded className="text-sm space-y-2">
            <CardEyebrow className="text-neon-gold">Contacts</CardEyebrow>
            {data.primary_parent && (
              <div className="text-paper">
                <span className="font-semibold">Primary:</span> {data.primary_parent.name} · {data.primary_parent.phone ?? '—'} · {data.primary_parent.email ?? '—'}
              </div>
            )}
            {data.secondary_parent && (
              <div className="text-paper">
                <span className="font-semibold">Secondary:</span> {data.secondary_parent.name} · {data.secondary_parent.phone ?? '—'} · {data.secondary_parent.email ?? '—'}
              </div>
            )}
          </Card>

          <Card tone="default" padded className="text-sm space-y-2">
            <CardEyebrow className="text-neon-magenta">Approved pickup</CardEyebrow>
            {data.pickup_authorizations.length === 0 ? (
              <p className="text-faint">None besides parents.</p>
            ) : (
              <ul className="space-y-1 text-paper">
                {data.pickup_authorizations.map((p, i) => (
                  <li key={i}>{p.name}{p.relationship ? ` · ${p.relationship}` : ''}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card tone="default" padded className="text-sm space-y-2">
            <CardEyebrow className="text-neon-mint">Status</CardEyebrow>
            <ul className="space-y-1 text-paper">
              <li>Checked in: {data.child.checked_in_at ? new Date(data.child.checked_in_at).toLocaleString() : 'no'} {data.child.checked_in_dropoff_type && <span className="text-faint">({data.child.checked_in_dropoff_type.replace(/_/g, ' ')})</span>}</li>
              <li>Checked out: {data.child.checked_out_at ? `${new Date(data.child.checked_out_at).toLocaleString()} to ${data.child.checked_out_to_name}` : 'no'}</li>
            </ul>
          </Card>

          {timeline && (timeline.events.length > 0 || timeline.reloads.length > 0) && (
            <Card tone="default" padded className="text-sm space-y-2">
              <CardEyebrow>Timeline</CardEyebrow>
              <ul className="space-y-1 text-paper">
                {timeline.events.map((e) => (
                  <li key={e.id}>
                    <span className="text-faint">{new Date(e.created_at).toLocaleTimeString()}</span>{' '}
                    <span className="font-semibold">{e.event_type}</span> at {e.station}
                    {e.item_name && ` · ${e.item_name}`}
                    {e.tickets_delta !== 0 && ` · ${e.tickets_delta > 0 ? '+' : ''}${e.tickets_delta} 🎟`}
                    {e.volunteer_name && ` · ${e.volunteer_name}`}
                  </li>
                ))}
              </ul>
              {timeline.reloads.length > 0 && (
                <>
                  <CardTitle className="mt-3 text-sm font-semibold font-sans text-mist">Reload history</CardTitle>
                  <ul className="space-y-1 text-paper">
                    {timeline.reloads.map((r, i) => (
                      <li key={i}>
                        <span className="text-faint">{new Date(r.created_at).toLocaleTimeString()}</span>{' '}
                        +{r.tickets_added} 🎟 · {r.payment_method}
                        {r.amount_charged != null && ` · $${Number(r.amount_charged).toFixed(2)}`}
                        {r.staff_name && ` · ${r.staff_name}`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}
        </div>
      )}
    </StationShell>
  )
}
