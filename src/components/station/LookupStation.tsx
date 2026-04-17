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
    special_instructions: string | null
    photo_consent_app: boolean
    photo_consent_promo: boolean
    vision_matching_consent: boolean
    facts_reload_permission: boolean
    facts_max_amount: number
    ticket_balance: number
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
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Profile lookup</h1>
        <p className="text-slate-600">Read-only view. Use for questions or check-in verification.</p>
      </header>

      <form onSubmit={doLookup} className="flex gap-2">
        <input type="text" value={qr} onChange={(e) => setQr(e.target.value)}
          placeholder="QR code / child UUID" aria-label="QR code"
          className="flex-1 rounded border px-3 py-2" />
        <button type="submit" disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50">
          Look up
        </button>
      </form>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="space-y-4">
          <ChildCard
            child={{
              first_name: data.child.first_name,
              last_name: data.child.last_name,
              age: data.child.age,
              grade: data.child.grade,
              allergies: data.child.allergies,
              photo_consent_app: data.child.photo_consent_app,
              ticket_balance: data.child.ticket_balance,
            }}
            primary_parent={data.primary_parent ?? { name: '—', phone: null }}
          />

          <section className="rounded border border-slate-200 p-3 text-sm">
            <h2 className="mb-2 font-bold">Consents</h2>
            <ul className="space-y-1">
              <li>App photos: {data.child.photo_consent_app ? 'YES' : 'NO'}</li>
              <li>Promo/social: {data.child.photo_consent_promo ? 'YES' : 'NO'}</li>
              <li>Vision matching: {data.child.vision_matching_consent ? 'YES' : 'NO'}</li>
              <li>FACTS: {data.child.facts_reload_permission ? `up to $${data.child.facts_max_amount.toFixed(2)}` : 'no'}</li>
            </ul>
          </section>

          {data.child.special_instructions && (
            <section className="rounded border border-slate-200 p-3 text-sm">
              <h2 className="mb-1 font-bold">Special instructions</h2>
              <p>{data.child.special_instructions}</p>
            </section>
          )}

          <section className="rounded border border-slate-200 p-3 text-sm">
            <h2 className="mb-2 font-bold">Contacts</h2>
            {data.primary_parent && (
              <div className="mb-1">
                <span className="font-semibold">Primary:</span> {data.primary_parent.name} · {data.primary_parent.phone ?? '—'} · {data.primary_parent.email ?? '—'}
              </div>
            )}
            {data.secondary_parent && (
              <div>
                <span className="font-semibold">Secondary:</span> {data.secondary_parent.name} · {data.secondary_parent.phone ?? '—'} · {data.secondary_parent.email ?? '—'}
              </div>
            )}
          </section>

          <section className="rounded border border-slate-200 p-3 text-sm">
            <h2 className="mb-2 font-bold">Approved pickup</h2>
            {data.pickup_authorizations.length === 0 ? (
              <p className="text-slate-500">None besides parents.</p>
            ) : (
              <ul className="space-y-1">
                {data.pickup_authorizations.map((p, i) => (
                  <li key={i}>{p.name}{p.relationship ? ` · ${p.relationship}` : ''}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded border border-slate-200 p-3 text-sm">
            <h2 className="mb-2 font-bold">Status</h2>
            <ul className="space-y-1">
              <li>Balance: {data.child.ticket_balance} 🎟</li>
              <li>Checked in: {data.child.checked_in_at ? new Date(data.child.checked_in_at).toLocaleString() : 'no'} {data.child.checked_in_dropoff_type && `(${data.child.checked_in_dropoff_type.replace(/_/g, ' ')})`}</li>
              <li>Checked out: {data.child.checked_out_at ? `${new Date(data.child.checked_out_at).toLocaleString()} to ${data.child.checked_out_to_name}` : 'no'}</li>
            </ul>
          </section>

          {timeline && (timeline.events.length > 0 || timeline.reloads.length > 0) && (
            <section className="rounded border border-slate-200 p-3 text-sm">
              <h2 className="mb-2 font-bold">Timeline</h2>
              <ul className="space-y-1">
                {timeline.events.map((e) => (
                  <li key={e.id} className="text-slate-700">
                    <span className="text-slate-400">{new Date(e.created_at).toLocaleTimeString()}</span>{' '}
                    <span className="font-semibold">{e.event_type}</span> at {e.station}
                    {e.item_name && ` · ${e.item_name}`}
                    {e.tickets_delta !== 0 && ` · ${e.tickets_delta > 0 ? '+' : ''}${e.tickets_delta} 🎟`}
                    {e.volunteer_name && ` · ${e.volunteer_name}`}
                  </li>
                ))}
              </ul>
              {timeline.reloads.length > 0 && (
                <>
                  <h3 className="mt-3 mb-1 font-bold">Reload history</h3>
                  <ul className="space-y-1">
                    {timeline.reloads.map((r, i) => (
                      <li key={i} className="text-slate-700">
                        <span className="text-slate-400">{new Date(r.created_at).toLocaleTimeString()}</span>{' '}
                        +{r.tickets_added} 🎟 · {r.payment_method}
                        {r.amount_charged != null && ` · $${Number(r.amount_charged).toFixed(2)}`}
                        {r.staff_name && ` · ${r.staff_name}`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  )
}
