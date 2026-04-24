'use client'
import { useState } from 'react'
import {
  PageHead,
  HelpLink,
  NeonScanner,
  SignPanel,
  Chip,
  StatTile,
  TimelineTrack,
  Input,
  Button,
  type TimelineItem,
} from '@/components/glow'
import NameSearch from './NameSearch'

// API shape returned by /api/children/by-qr/[qr]
type ChildData = {
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

// API shape returned by /api/children/by-qr/[qr]/timeline
type TimelineData = {
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

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

// Map a station name to a consistent display tone for the timeline track
function stationTone(station: string): Tone {
  const s = station.toLowerCase()
  if (s.includes('drink') || s.includes('soda'))  return 'cyan'
  if (s.includes('jail'))                          return 'magenta'
  if (s.includes('spin') || s.includes('prize'))   return 'gold'
  if (s.includes('dj') || s.includes('shoutout'))  return 'uv'
  return 'mint'
}

function toTimelineItems(data: TimelineData, lastEventId: string | null): TimelineItem[] {
  return data.events.map((e) => ({
    time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    label: `${e.event_type.replace(/_/g, ' ')} · ${e.station}`,
    state: e.id === lastEventId ? 'now' : 'done',
    tone: stationTone(e.station),
  }))
}

// Mono eyebrow shared across the five info sections — matches Phase 5 pattern
function SectionEyebrow({
  tone,
  children,
}: {
  tone: 'uv' | 'gold' | 'cyan' | 'mint'
  children: React.ReactNode
}) {
  const toneClass = {
    uv:   'text-neon-uv',
    gold: 'text-neon-gold',
    cyan: 'text-neon-cyan',
    mint: 'text-neon-mint',
  }[tone]
  return (
    <div
      className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${toneClass} [font-family:var(--font-mono),JetBrains_Mono,monospace]`}
    >
      {children}
    </div>
  )
}

// Compact timestamp formatter for the Status section
function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LookupStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<ChildData | null>(null)
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doLookup(e?: React.FormEvent, overrideQr?: string) {
    e?.preventDefault()
    setError(null); setData(null); setTimeline(null)
    const value = (overrideQr ?? qr).trim()
    if (!value) return
    setBusy(true)
    try {
      const [childRes, tlRes] = await Promise.all([
        fetch(`/api/children/by-qr/${encodeURIComponent(value)}`),
        fetch(`/api/children/by-qr/${encodeURIComponent(value)}/timeline`),
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

  // Simulate scanning: the NeonScanner shows while idle (no result yet).
  // Tapping/submitting triggers the lookup. In a real wristband setup,
  // a hardware QR reader would fire an input event — the form handles it.
  const kid = data?.child ?? null
  const kidTone: Tone = 'uv' // pref_tone not in current API; default to uv

  // Build allergy list from comma-separated string
  const allergies = kid?.allergies
    ? kid.allergies.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  // Remaining counts derived from existing API fields
  const drinksLeft = kid?.drink_tickets_remaining ?? 0
  const jailLeft   = kid?.jail_tickets_remaining ?? 0
  const spinsLeft  = kid?.prize_wheel_used_at === null ? 1 : 0
  const djLeft     = kid?.dj_shoutout_used_at === null ? 1 : 0

  // Timeline items: use the existing /timeline endpoint events if available
  const lastEventId = timeline?.events.length
    ? timeline.events[timeline.events.length - 1].id
    : null
  const timelineItems: TimelineItem[] = timeline
    ? toTimelineItems(timeline, lastEventId)
    : []

  const primary = data?.primary_parent ?? null
  const secondary = data?.secondary_parent ?? null
  const pickups = data?.pickup_authorizations ?? []

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="KID LOOKUP"
        sub="Scan any wristband to see what the kid has done tonight."
        right={<HelpLink />}
      />

      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!kid ? (
        /* Idle scanner — single render. `hint` and `scanning` vary with `busy`
           so there's no double-Scanner race between idle and loading states.
           The QR form is embedded so volunteers without a hardware reader can
           type/paste a wristband code. */
        <>
          <NeonScanner
            tone="cyan"
            aspect="portrait"
            scanning={!busy}
            hint={busy ? 'Looking up…' : 'Scan wristband or enter code'}
            onScan={(decoded) => { if (busy) return; setQr(decoded); doLookup(undefined, decoded) }}
          >
            <form
              onSubmit={doLookup}
              className="flex w-full max-w-xs flex-col gap-3"
            >
              <Input
                type="text"
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                placeholder="QR / wristband code"
                aria-label="QR code"
                autoFocus
                disabled={busy}
              />
              <Button
                type="submit"
                tone="cyan"
                fullWidth
                loading={busy}
                disabled={busy || !qr.trim()}
              >
                Look up
              </Button>
            </form>
          </NeonScanner>
          <NameSearch
            tone="cyan"
            disabled={busy}
            onSelect={(qrCode) => { setQr(qrCode); doLookup(undefined, qrCode) }}
          />
        </>
      ) : (
        <>
          <SignPanel tone={kidTone} padding="lg">
            <h2 className="font-display text-2xl font-bold text-paper">
              {kid.first_name} {kid.last_name}
            </h2>

            <div className="mt-1 flex flex-wrap gap-2">
              {allergies.length > 0 && (
                <Chip tone="gold">⚠ {allergies.join(', ')}</Chip>
              )}
              {/* photo_consent_app used as the primary "photos off" signal */}
              {!kid.photo_consent_app && (
                <Chip tone="quiet">photos off</Chip>
              )}
              {/* vision_matching_consent maps to the ai consent flag */}
              {!kid.vision_matching_consent && (
                <Chip tone="quiet">ai off</Chip>
              )}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {/* drink_tickets_remaining maps to drinks_left; max = 2 per spec */}
              <StatTile label="Drinks"   value={`${drinksLeft}/2`}  tone="cyan" />
              {/* jail_tickets_remaining maps to jail_left; max = 3 per spec */}
              <StatTile label="Jail"     value={`${jailLeft}/3`}    tone="magenta" />
              {/* prize_wheel_used_at: null = 1 remaining, truthy = 0 remaining */}
              <StatTile label="Spins"    value={`${spinsLeft}/1`}   tone="gold" />
              {/* dj_shoutout_used_at: null = 1 remaining, truthy = 0 remaining */}
              <StatTile label="Shoutout" value={`${djLeft}/1`}      tone="uv" />
            </div>

            <div className="mt-4">
              {/* TimelineTrack wired to existing /timeline endpoint events.
                  Empty array renders gracefully if no events logged yet. */}
              <TimelineTrack items={timelineItems} />
            </div>
          </SignPanel>

          {/* 1. Consents */}
          <SignPanel tone="uv" padding="md">
            <SectionEyebrow tone="uv">Consents</SectionEyebrow>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-paper">
              <dt className="text-paper/70">Photos (app)</dt>
              <dd>{kid.photo_consent_app ? 'Yes' : 'No'}</dd>
              <dt className="text-paper/70">Photos (promo)</dt>
              <dd>{kid.photo_consent_promo ? 'Yes' : 'No'}</dd>
              <dt className="text-paper/70">Vision matching</dt>
              <dd>{kid.vision_matching_consent ? 'Yes' : 'No'}</dd>
              <dt className="text-paper/70">Facts reload</dt>
              <dd>
                {kid.facts_reload_permission
                  ? `Yes · max $${kid.facts_max_amount}`
                  : 'No'}
              </dd>
            </dl>
          </SignPanel>

          {/* 2. Special instructions (conditional) */}
          {kid.special_instructions && (
            <SignPanel tone="gold" padding="md">
              <SectionEyebrow tone="gold">Special instructions</SectionEyebrow>
              <p className="mt-3 whitespace-pre-wrap text-sm text-paper">
                {kid.special_instructions}
              </p>
            </SignPanel>
          )}

          {/* 3. Contacts */}
          <SignPanel tone="cyan" padding="md">
            <SectionEyebrow tone="cyan">Contacts</SectionEyebrow>
            <div className="mt-3 flex flex-col gap-3 text-sm text-paper">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-paper/60">Primary</div>
                {primary ? (
                  <div className="mt-1">
                    <div className="font-medium">{primary.name}</div>
                    {primary.phone && <div className="text-paper/80">{primary.phone}</div>}
                    {primary.email && <div className="text-paper/80">{primary.email}</div>}
                  </div>
                ) : (
                  <div className="mt-1 text-paper/60">—</div>
                )}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-paper/60">Secondary</div>
                {secondary ? (
                  <div className="mt-1">
                    <div className="font-medium">{secondary.name}</div>
                    {secondary.phone && <div className="text-paper/80">{secondary.phone}</div>}
                    {secondary.email && <div className="text-paper/80">{secondary.email}</div>}
                  </div>
                ) : (
                  <div className="mt-1 text-paper/60">—</div>
                )}
              </div>
            </div>
          </SignPanel>

          {/* 4. Approved pickup */}
          <SignPanel tone="mint" padding="md">
            <SectionEyebrow tone="mint">Approved pickup</SectionEyebrow>
            {pickups.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-paper">
                {pickups.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.relationship && (
                      <span className="text-paper/70">{p.relationship}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-paper/60">No additional pickup authorizations.</p>
            )}
          </SignPanel>

          {/* 5. Status */}
          <SignPanel tone="gold" padding="md">
            <SectionEyebrow tone="gold">Status</SectionEyebrow>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-paper">
              <dt className="text-paper/70">Checked in</dt>
              <dd>
                {kid.checked_in_at ? (
                  <>
                    {fmtTime(kid.checked_in_at)}
                    {kid.checked_in_dropoff_type && (
                      <span className="text-paper/70"> · {kid.checked_in_dropoff_type}</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </dd>
              <dt className="text-paper/70">Checked out</dt>
              <dd>
                {kid.checked_out_at ? (
                  <>
                    {fmtTime(kid.checked_out_at)}
                    {kid.checked_out_to_name && (
                      <span className="text-paper/70"> · to {kid.checked_out_to_name}</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </dl>
          </SignPanel>
        </>
      )}
    </main>
  )
}
