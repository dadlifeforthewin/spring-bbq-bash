'use client'
import { useState } from 'react'
import {
  PageHead,
  NeonScanner,
  SignPanel,
  Chip,
  StatTile,
  TimelineTrack,
  type TimelineItem,
} from '@/components/glow'

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

export default function LookupStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<ChildData | null>(null)
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
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

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="KID LOOKUP"
        sub="Scan any wristband to see what the kid has done tonight."
      />

      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Hidden form for QR input — hardware scanners submit as keyboard events */}
      <form onSubmit={doLookup} className="sr-only" aria-hidden>
        <input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { void doLookup() } }}
          aria-label="QR code"
          autoFocus
        />
      </form>

      {!kid ? (
        <NeonScanner tone="cyan" aspect="portrait" hint="Scan wristband" scanning />
      ) : (
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
      )}

      {/* Loading state: show scanner with a brief busy indication */}
      {busy && !kid && (
        <NeonScanner tone="cyan" aspect="portrait" hint="Looking up…" scanning />
      )}
    </main>
  )
}
