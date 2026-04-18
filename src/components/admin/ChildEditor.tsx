'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Guardian = {
  id?: string
  name: string
  phone: string | null
  email: string | null
  is_primary: boolean
  _delete?: boolean
}

type Pickup = { id?: string; name: string; relationship: string | null; _delete?: boolean }

type ChildRow = {
  id: string
  qr_code: string
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
  checked_out_at: string | null
}

type Loaded = {
  child: ChildRow
  guardians: Guardian[]
  pickup_authorizations: Pickup[]
  events: {
    id: string
    station: string
    event_type: string
    tickets_delta: number
    item_name: string | null
    created_at: string
  }[]
  photos: { photo_id: string; photos: { id: string; storage_path: string; taken_at: string } | null }[]
}

export default function ChildEditor({ id }: { id: string }) {
  const [data, setData] = useState<Loaded | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function load() {
    const res = await fetch(`/api/children/${id}`)
    if (!res.ok) { setError('Load failed'); return }
    const body = await res.json()
    setData(body)
    setError(null)
  }

  useEffect(() => { load() }, [id])

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>
  if (!data) return <p className="text-slate-500">Loading…</p>

  const c = data.child

  function setChild(patch: Partial<ChildRow>) {
    setData({ ...data!, child: { ...c, ...patch } })
  }
  function setGuardian(i: number, patch: Partial<Guardian>) {
    setData({
      ...data!,
      guardians: data!.guardians.map((g, idx) => idx === i ? { ...g, ...patch } : g),
    })
  }
  function addGuardian() {
    setData({
      ...data!,
      guardians: [...data!.guardians, { name: '', phone: '', email: '', is_primary: false }],
    })
  }
  function setPickup(i: number, patch: Partial<Pickup>) {
    setData({
      ...data!,
      pickup_authorizations: data!.pickup_authorizations.map((p, idx) => idx === i ? { ...p, ...patch } : p),
    })
  }
  function addPickup() {
    setData({
      ...data!,
      pickup_authorizations: [...data!.pickup_authorizations, { name: '', relationship: '' }],
    })
  }

  async function save() {
    if (!data) return
    setSaving(true); setSaved(false); setError(null)
    try {
      const payload = {
        first_name: c.first_name,
        last_name: c.last_name,
        age: c.age,
        grade: c.grade || null,
        allergies: c.allergies || null,
        special_instructions: c.special_instructions || null,
        photo_consent_app: c.photo_consent_app,
        photo_consent_promo: c.photo_consent_promo,
        vision_matching_consent: c.vision_matching_consent,
        facts_reload_permission: c.facts_reload_permission,
        facts_max_amount: c.facts_max_amount,
        drink_tickets_remaining: c.drink_tickets_remaining,
        jail_tickets_remaining: c.jail_tickets_remaining,
        guardians: data.guardians,
        pickup_authorizations: data.pickup_authorizations,
      }
      const res = await fetch(`/api/children/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Save failed')
        return
      }
      setSaved(true)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-black">
          {c.first_name} {c.last_name}
        </h1>
        <span className="text-sm text-slate-500">
          {c.age ? `age ${c.age}` : ''}{c.grade ? ` · grade ${c.grade}` : ''}
        </span>
        <span className="ml-auto">
          <Link href="/admin/children" className="text-sm text-slate-500">← Back to list</Link>
        </span>
      </header>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Identity</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm">First name</span>
            <input value={c.first_name} onChange={(e) => setChild({ first_name: e.target.value })}
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Last name</span>
            <input value={c.last_name} onChange={(e) => setChild({ last_name: e.target.value })}
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Age</span>
            <input type="number" min={1} max={25} value={c.age ?? ''}
              onChange={(e) => setChild({ age: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Grade</span>
            <input value={c.grade ?? ''} onChange={(e) => setChild({ grade: e.target.value })}
              className="w-full rounded border px-3 py-2" /></label>
        </div>
        <label className="block"><span className="text-sm">Allergies</span>
          <textarea rows={2} value={c.allergies ?? ''} onChange={(e) => setChild({ allergies: e.target.value })}
            className="w-full rounded border px-3 py-2" /></label>
        <label className="block"><span className="text-sm">Special instructions</span>
          <textarea rows={2} value={c.special_instructions ?? ''}
            onChange={(e) => setChild({ special_instructions: e.target.value })}
            className="w-full rounded border px-3 py-2" /></label>
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Consents (every change is audited)</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={c.photo_consent_app}
            onChange={(e) => setChild({ photo_consent_app: e.target.checked })} />
          <span>App keepsake photos</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={c.photo_consent_promo}
            onChange={(e) => setChild({ photo_consent_promo: e.target.checked })} />
          <span>Promotional / social media</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={c.vision_matching_consent}
            onChange={(e) => setChild({ vision_matching_consent: e.target.checked })} />
          <span>Vision matching</span>
        </label>
      </section>

      <section className="space-y-3 rounded border border-ink-hair bg-ink-2/70 p-4">
        <h2 className="text-lg font-bold text-paper">Perks &amp; FACTS</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm text-mist">Drink tickets remaining</span>
            <input type="number" min={0} max={10} value={c.drink_tickets_remaining}
              onChange={(e) => setChild({ drink_tickets_remaining: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
              className="w-full rounded-xl border border-ink-hair bg-ink-3 px-3 py-2 text-paper focus:border-neon-cyan/70 focus:ring-4 focus:ring-neon-cyan/20" /></label>
          <label className="block"><span className="text-sm text-mist">Jail / pass tickets remaining</span>
            <input type="number" min={0} max={10} value={c.jail_tickets_remaining}
              onChange={(e) => setChild({ jail_tickets_remaining: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
              className="w-full rounded-xl border border-ink-hair bg-ink-3 px-3 py-2 text-paper focus:border-neon-magenta/70 focus:ring-4 focus:ring-neon-magenta/20" /></label>
        </div>
        <p className="text-xs text-faint">
          Prize wheel {c.prize_wheel_used_at ? `used · ${new Date(c.prize_wheel_used_at).toLocaleTimeString()}` : 'unused'} ·
          DJ shoutout {c.dj_shoutout_used_at ? `used · ${new Date(c.dj_shoutout_used_at).toLocaleTimeString()}` : 'unused'}
        </p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={c.facts_reload_permission}
            onChange={(e) => setChild({
              facts_reload_permission: e.target.checked,
              facts_max_amount: e.target.checked ? (c.facts_max_amount || 10) : 0,
            })} />
          <span>FACTS reload permission</span>
        </label>
        <label className="block"><span className="text-sm">FACTS max amount ($0–$10)</span>
          <input type="number" min={0} max={10} value={c.facts_max_amount}
            disabled={!c.facts_reload_permission}
            onChange={(e) => setChild({ facts_max_amount: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
            className="w-32 rounded border px-3 py-2 disabled:bg-slate-100" /></label>
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Guardians</h2>
        {data.guardians.map((g, i) => (
          <div key={g.id ?? `new-${i}`} className={`grid grid-cols-2 gap-2 rounded border p-2 ${g._delete ? 'opacity-50' : ''}`}>
            <label className="block"><span className="text-xs">Name</span>
              <input value={g.name} onChange={(e) => setGuardian(i, { name: e.target.value })}
                className="w-full rounded border px-2 py-1" /></label>
            <label className="block"><span className="text-xs">Phone</span>
              <input value={g.phone ?? ''} onChange={(e) => setGuardian(i, { phone: e.target.value })}
                className="w-full rounded border px-2 py-1" /></label>
            <label className="block"><span className="text-xs">Email</span>
              <input value={g.email ?? ''} onChange={(e) => setGuardian(i, { email: e.target.value })}
                className="w-full rounded border px-2 py-1" /></label>
            <label className="flex items-end gap-2 text-sm">
              <input type="checkbox" checked={g.is_primary}
                onChange={(e) => setGuardian(i, { is_primary: e.target.checked })} />
              Primary
            </label>
            <div className="col-span-2 flex justify-end">
              <button type="button" onClick={() => setGuardian(i, { _delete: !g._delete })}
                className="text-xs text-red-600">
                {g._delete ? 'Undo delete' : 'Remove guardian'}
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addGuardian} className="text-sm text-blue-600">+ Add guardian</button>
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Approved pickup</h2>
        {data.pickup_authorizations.map((p, i) => (
          <div key={p.id ?? `new-${i}`} className={`flex gap-2 ${p._delete ? 'opacity-50' : ''}`}>
            <input value={p.name} onChange={(e) => setPickup(i, { name: e.target.value })}
              placeholder="Name" className="flex-1 rounded border px-2 py-1" />
            <input value={p.relationship ?? ''} onChange={(e) => setPickup(i, { relationship: e.target.value })}
              placeholder="Relationship" className="w-40 rounded border px-2 py-1" />
            <button type="button" onClick={() => setPickup(i, { _delete: !p._delete })}
              className="rounded bg-slate-200 px-2 text-xs">{p._delete ? 'Undo' : '✕'}</button>
          </div>
        ))}
        <button type="button" onClick={addPickup} className="text-sm text-blue-600">+ Add pickup person</button>
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Timeline</h2>
        {data.events.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.events.map((e) => (
              <li key={e.id} className="text-slate-700">
                <span className="text-slate-400">{new Date(e.created_at).toLocaleString()}</span>{' '}
                <strong>{e.event_type}</strong> at {e.station}
                {e.item_name && ` · ${e.item_name}`}
                {e.tickets_delta !== 0 && ` · ${e.tickets_delta > 0 ? '+' : ''}${e.tickets_delta} 🎟`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 rounded-t bg-slate-50 p-3 shadow">
        <button type="button" onClick={save} disabled={saving}
          className="rounded bg-fuchsia-600 px-6 py-2 font-bold text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-700">Saved.</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  )
}
