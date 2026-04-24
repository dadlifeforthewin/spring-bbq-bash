'use client'
import { useEffect, useState } from 'react'
import { PageHead, SectionHeading, Input, Textarea, Checkbox, Button } from '@/components/glow'

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
  raffle_prize_name: string | null
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

  if (error) return <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
  if (!data) return <p className="text-mist">Loading…</p>

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
        raffle_prize_name: c.raffle_prize_name?.trim() || null,
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

  const subParts = [
    c.age ? `age ${c.age}` : null,
    c.grade ? `grade ${c.grade}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6">
      <PageHead
        back={{ href: '/admin/children', label: 'children' }}
        title={`${c.first_name} ${c.last_name}`}
        sub={subParts || undefined}
      />

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="01" title="Identity" tone="cyan" />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={c.first_name}
            onChange={(e) => setChild({ first_name: e.target.value })}
          />
          <Input
            label="Last name"
            value={c.last_name}
            onChange={(e) => setChild({ last_name: e.target.value })}
          />
          <Input
            type="number"
            label="Age"
            min={1}
            max={25}
            value={c.age ?? ''}
            onChange={(e) => setChild({ age: e.target.value === '' ? null : Number(e.target.value) })}
          />
          <Input
            label="Grade"
            value={c.grade ?? ''}
            onChange={(e) => setChild({ grade: e.target.value })}
          />
        </div>
        <Textarea
          label="Allergies"
          rows={2}
          value={c.allergies ?? ''}
          onChange={(e) => setChild({ allergies: e.target.value })}
        />
        <Textarea
          label="Special instructions"
          rows={2}
          value={c.special_instructions ?? ''}
          onChange={(e) => setChild({ special_instructions: e.target.value })}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="02" title="Consents (every change is audited)" tone="uv" />
        <Checkbox
          checked={c.photo_consent_app}
          onChange={(e) => setChild({ photo_consent_app: e.target.checked })}
          label="App keepsake photos"
        />
        <Checkbox
          checked={c.photo_consent_promo}
          onChange={(e) => setChild({ photo_consent_promo: e.target.checked })}
          label="Promotional / social media"
        />
        <Checkbox
          checked={c.vision_matching_consent}
          onChange={(e) => setChild({ vision_matching_consent: e.target.checked })}
          label="Vision matching"
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="03" title="Perks & FACTS" tone="gold" />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            label="Drink tickets remaining"
            min={0}
            max={10}
            value={c.drink_tickets_remaining}
            onChange={(e) => setChild({ drink_tickets_remaining: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
          />
          <Input
            type="number"
            label="Jail / pass tickets remaining"
            min={0}
            max={10}
            value={c.jail_tickets_remaining}
            onChange={(e) => setChild({ jail_tickets_remaining: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
          />
        </div>
        <p className="text-xs text-faint">
          Prize wheel {c.prize_wheel_used_at ? `used · ${new Date(c.prize_wheel_used_at).toLocaleTimeString()}` : 'unused'} ·
          DJ shoutout {c.dj_shoutout_used_at ? `used · ${new Date(c.dj_shoutout_used_at).toLocaleTimeString()}` : 'unused'}
        </p>
        <Checkbox
          checked={c.facts_reload_permission}
          onChange={(e) => setChild({
            facts_reload_permission: e.target.checked,
            facts_max_amount: e.target.checked ? (c.facts_max_amount || 10) : 0,
          })}
          label="FACTS reload permission"
        />
        <Input
          type="number"
          label="FACTS max amount ($0–$10)"
          min={0}
          max={10}
          value={c.facts_max_amount}
          disabled={!c.facts_reload_permission}
          onChange={(e) => setChild({ facts_max_amount: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
          className="max-w-[10rem]"
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="03b" title="Raffle winner" tone="gold" />
        <p className="text-xs text-mist">
          For the 3 raffle winners only. Check the box and type the prize they won.
        </p>
        <Checkbox
          checked={c.raffle_prize_name !== null}
          onChange={(e) => setChild({ raffle_prize_name: e.target.checked ? (c.raffle_prize_name ?? '') : null })}
          label="Won the raffle"
        />
        {c.raffle_prize_name !== null && (
          <Input
            label="Prize won"
            value={c.raffle_prize_name}
            onChange={(e) => setChild({ raffle_prize_name: e.target.value })}
            placeholder="e.g. Glow scooter, $25 gift card"
            aria-label="raffle prize name"
            autoFocus
          />
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="04" title="Guardians" tone="mint" />
        {data.guardians.map((g, i) => (
          <div
            key={g.id ?? `new-${i}`}
            className={`grid grid-cols-2 gap-2 rounded-xl border border-ink-hair/70 bg-ink-3/40 p-3 ${g._delete ? 'opacity-50' : ''}`}
          >
            <Input
              label="Name"
              value={g.name}
              onChange={(e) => setGuardian(i, { name: e.target.value })}
            />
            <Input
              label="Phone"
              value={g.phone ?? ''}
              onChange={(e) => setGuardian(i, { phone: e.target.value })}
            />
            <Input
              label="Email"
              value={g.email ?? ''}
              onChange={(e) => setGuardian(i, { email: e.target.value })}
            />
            <div className="flex items-end">
              <Checkbox
                checked={g.is_primary}
                onChange={(e) => setGuardian(i, { is_primary: e.target.checked })}
                label="Primary"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <Button
                type="button"
                tone="danger"
                size="sm"
                onClick={() => setGuardian(i, { _delete: !g._delete })}
              >
                {g._delete ? 'Undo delete' : 'Remove guardian'}
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" tone="ghost" size="sm" onClick={addGuardian}>
          + Add guardian
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="05" title="Approved pickup" tone="cyan" />
        {data.pickup_authorizations.map((p, i) => (
          <div
            key={p.id ?? `new-${i}`}
            className={`flex flex-wrap items-end gap-2 ${p._delete ? 'opacity-50' : ''}`}
          >
            <Input
              value={p.name}
              onChange={(e) => setPickup(i, { name: e.target.value })}
              placeholder="Name"
              className="flex-1 min-w-[10rem]"
            />
            <Input
              value={p.relationship ?? ''}
              onChange={(e) => setPickup(i, { relationship: e.target.value })}
              placeholder="Relationship"
              className="w-40"
            />
            <Button
              type="button"
              tone="danger"
              size="sm"
              onClick={() => setPickup(i, { _delete: !p._delete })}
            >
              {p._delete ? 'Undo' : '✕'}
            </Button>
          </div>
        ))}
        <Button type="button" tone="ghost" size="sm" onClick={addPickup}>
          + Add pickup person
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="06" title="Timeline" tone="uv" />
        {data.events.length === 0 ? (
          <p className="text-sm text-mist">No events yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.events.map((e) => (
              <li key={e.id} className="text-paper">
                <span className="text-faint">{new Date(e.created_at).toLocaleString()}</span>{' '}
                <strong>{e.event_type}</strong> at {e.station}
                {e.item_name && ` · ${e.item_name}`}
                {e.tickets_delta !== 0 && ` · ${e.tickets_delta > 0 ? '+' : ''}${e.tickets_delta} 🎟`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 rounded-t-2xl border border-ink-hair border-b-0 bg-ink-2/80 backdrop-blur-sm p-3 shadow-[0_-8px_20px_rgba(0,0,0,.25)]">
        <Button
          type="button"
          tone="magenta"
          size="lg"
          onClick={save}
          disabled={saving}
          loading={saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && <span className="text-sm text-neon-mint">Saved.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  )
}
