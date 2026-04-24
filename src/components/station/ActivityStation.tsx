'use client'
import { useEffect, useState } from 'react'
import ChildCard from './ChildCard'
import { Input, Textarea } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { Chip } from '@/components/glow/Chip'
import { PageHead } from '@/components/glow/PageHead'
import { HelpLink } from '@/components/glow/HelpLink'
import { NeonScanner } from '@/components/glow/NeonScanner'
import { GlyphGlow } from '@/components/glow/GlyphGlow'
import { SectionHeading } from '@/components/glow/SectionHeading'
import {
  DrinksGlyph,
  JailGlyph,
  PrizeWheelGlyph,
  DJGlyph,
  SparkGlyph,
} from '@/components/glow/glyphs'
import NameSearch from './NameSearch'
import StationPhotoCapture from './StationPhotoCapture'

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
}

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

const NEON_LINK_BY_TONE: Record<Tone, string> = {
  magenta: 'text-neon-magenta hover:shadow-glow-magenta',
  cyan:    'text-neon-cyan    hover:shadow-glow-cyan',
  uv:      'text-neon-uv      hover:shadow-glow-uv',
  gold:    'text-neon-gold    hover:shadow-glow-gold',
  mint:    'text-neon-mint    hover:shadow-glow-mint',
}

type StationMeta = {
  slug: string
  title: string
  eyebrow: string
  tone: Tone
}

type GlyphComponent = React.ComponentType<{ size?: number }>

const STATION_STORAGE_KEY = 'sbbq_station'

const STATION_META: Record<string, StationMeta> = {
  drinks:            { slug: 'drinks',            title: 'Drinks',            eyebrow: 'Metered · 2 per kid',           tone: 'cyan'    },
  jail:              { slug: 'jail',              title: 'Jail',              eyebrow: 'Metered · 3 sends or passes',   tone: 'magenta' },
  prize_wheel:       { slug: 'prize_wheel',       title: 'Prize Wheel',       eyebrow: 'One spin per kid',              tone: 'gold'    },
  dj_shoutout:       { slug: 'dj_shoutout',       title: 'DJ Shoutout',       eyebrow: 'One request per kid',           tone: 'uv'      },
  cornhole:          { slug: 'cornhole',          title: 'Cornhole',          eyebrow: 'Free · log the visit',          tone: 'magenta' },
  face_painting:     { slug: 'face_painting',     title: 'Face Painting',     eyebrow: 'Free · log the visit',          tone: 'uv'      },
  arts_crafts:       { slug: 'arts_crafts',       title: 'Arts & Crafts',     eyebrow: 'Free · log the visit',          tone: 'gold'    },
  video_games:       { slug: 'video_games',       title: 'Video Games',       eyebrow: 'Free · log the visit',          tone: 'cyan'    },
  dance_competition: { slug: 'dance_competition', title: 'Dance Competition', eyebrow: 'Free · log the visit',          tone: 'magenta' },
  pizza:             { slug: 'pizza',             title: 'Pizza',             eyebrow: 'Free · log the visit',          tone: 'gold'    },
  cake_walk:         { slug: 'cake_walk',         title: 'Cake Walk',         eyebrow: 'Free · log the visit',          tone: 'magenta' },
  quiet_corner:      { slug: 'quiet_corner',      title: 'Quiet Room · Movie',eyebrow: 'Free · log the visit',          tone: 'uv'      },
}

const STATION_GLYPH: Record<string, GlyphComponent> = {
  drinks:            DrinksGlyph,
  jail:              JailGlyph,
  prize_wheel:       PrizeWheelGlyph,
  dj_shoutout:       DJGlyph,
  cornhole:          SparkGlyph,
  face_painting:     SparkGlyph,
  arts_crafts:       SparkGlyph,
  video_games:       SparkGlyph,
  dance_competition: SparkGlyph,
  pizza:             SparkGlyph,
  cake_walk:         SparkGlyph,
  quiet_corner:      SparkGlyph,
}

const METERED = new Set(['drinks', 'jail'])
const ONE_TIME = new Set(['prize_wheel', 'dj_shoutout'])

type LogEntry = { name: string; label: string; ts: string }

export default function ActivityStation() {
  const [slug, setSlug] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  // Station-specific form state
  const [jailAction, setJailAction] = useState<'send' | 'release'>('send')
  const [songRequest, setSongRequest] = useState('')
  const [volunteer, setVolunteer] = useState('')
  const [showNameSearch, setShowNameSearch] = useState(false)

  useEffect(() => {
    try {
      setSlug(localStorage.getItem(STATION_STORAGE_KEY))
    } catch {
      setSlug(null)
    }
  }, [])

  const meta = slug ? STATION_META[slug] ?? {
    slug,
    title: slug.replace(/_/g, ' '),
    eyebrow: 'Free · log the visit',
    tone: 'cyan' as const,
  } : null

  async function doLookup(e?: React.FormEvent, overrideQr?: string) {
    e?.preventDefault()
    setLookupError(null); setActionError(null); setSuccess(null); setData(null)
    const value = (overrideQr ?? qr).trim()
    if (!value) return
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(value)}`)
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

  async function doActivity() {
    if (!data || !slug) return
    setActionError(null); setSuccess(null)
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        child_id: data.child.id,
        station: slug,
        volunteer_name: volunteer || undefined,
      }
      if (slug === 'jail') payload.activity_type = jailAction
      if (slug === 'dj_shoutout') payload.song_request = songRequest
      const res = await fetch('/api/stations/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setActionError(body.error ?? 'Activity failed')
        return
      }

      let successMsg: string
      // Update local state with new balances so the UI reflects the change
      if (slug === 'drinks') {
        setData({ ...data, child: { ...data.child, drink_tickets_remaining: body.balance.drink_tickets } })
        successMsg = `Drink redeemed — ${body.balance.drink_tickets} left.`
        setSuccess(successMsg)
      } else if (slug === 'jail') {
        setData({ ...data, child: { ...data.child, jail_tickets_remaining: body.balance.jail_tickets } })
        successMsg = body.action === 'send'
          ? `Sent to jail — ${body.balance.jail_tickets} left.`
          : `Pass redeemed — ${body.balance.jail_tickets} left.`
        setSuccess(successMsg)
      } else if (slug === 'prize_wheel') {
        setData({ ...data, child: { ...data.child, prize_wheel_used_at: body.used_at } })
        successMsg = 'Prize wheel spun. One per kid — done for the night.'
        setSuccess(successMsg)
      } else if (slug === 'dj_shoutout') {
        setData({ ...data, child: { ...data.child, dj_shoutout_used_at: body.used_at } })
        successMsg = `DJ shoutout queued: "${songRequest}".`
        setSuccess(successMsg)
        setSongRequest('')
      } else {
        successMsg = `Visit logged — ${data.child.first_name} was here.`
        setSuccess(successMsg)
      }

      // Append to local session log (cap at 10)
      setLog((prev) => [
        { name: `${data.child.first_name} ${data.child.last_name}`, label: successMsg, ts: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 10))
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setQr('')
    setData(null)
    setLookupError(null)
    setActionError(null)
    setSuccess(null)
    setJailAction('send')
    setSongRequest('')
  }

  if (!slug || !meta) {
    return (
      <main className="flex flex-col gap-5">
        <PageHead
          back={{ href: '/station', label: 'Stations' }}
          title="NO STATION"
          sub="Pick a station from the picker first so the app knows which activity to log."
          right={<HelpLink />}
        />
        <div className="rounded-2xl border border-neon-gold/40 bg-ink-2/70 p-5 space-y-3">
          <p className="text-sm text-mist">No station is selected for this device.</p>
          <a
            href="/station"
            className="inline-flex items-center rounded-full border border-neon-cyan/60 px-4 py-2 text-sm font-bold text-neon-cyan hover:shadow-glow-cyan transition"
          >
            Pick a station →
          </a>
        </div>
      </main>
    )
  }

  const Glyph = STATION_GLYPH[slug] ?? SparkGlyph

  const checkedOut = data?.child.checked_out_at
  const notCheckedIn = data && !data.child.checked_in_at
  const alreadyOneTime =
    (slug === 'prize_wheel' && data?.child.prize_wheel_used_at) ||
    (slug === 'dj_shoutout' && data?.child.dj_shoutout_used_at)
  const metered = METERED.has(slug)
  const oneTime = ONE_TIME.has(slug)
  const remaining =
    slug === 'drinks' ? data?.child.drink_tickets_remaining :
    slug === 'jail'   ? data?.child.jail_tickets_remaining   :
    undefined
  const meterExhausted = metered && (remaining ?? 0) <= 0

  const ctaDisabled =
    busy ||
    !data ||
    !!checkedOut ||
    !!notCheckedIn ||
    !!alreadyOneTime ||
    !!meterExhausted ||
    (slug === 'dj_shoutout' && !songRequest.trim())

  const ctaLabel = (() => {
    if (slug === 'drinks')      return `Redeem drink ticket`
    if (slug === 'jail')        return jailAction === 'send' ? 'Send to jail' : 'Use get-out pass'
    if (slug === 'prize_wheel') return 'Spin the wheel'
    if (slug === 'dj_shoutout') return 'Queue shoutout'
    return `Log visit`
  })()

  // Chip label summarising redemption count for metered/one-time slugs
  const redeemedLabel = (() => {
    if (!data) return meta.eyebrow
    if (slug === 'drinks') return `${data.child.drink_tickets_remaining} left`
    if (slug === 'jail') return `${data.child.jail_tickets_remaining} left`
    if (slug === 'prize_wheel') return data.child.prize_wheel_used_at ? 'used' : '1 spin'
    if (slug === 'dj_shoutout') return data.child.dj_shoutout_used_at ? 'used' : '1 request'
    return meta.eyebrow
  })()

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'Stations' }}
        title={meta.title.toUpperCase()}
        sub={meta.eyebrow}
        right={<><Chip tone={meta.tone} glow>{redeemedLabel}</Chip><HelpLink /></>}
      />

      <div className="flex justify-center py-2">
        <GlyphGlow tone={meta.tone} size={140}>
          <Glyph size={120} />
        </GlyphGlow>
      </div>

      {!data ? (
        <>
          {/* Manual name-search toggle — compact neon link above the scanner.
              Collapsed by default so the QR camera stays the primary surface. */}
          <div className="flex justify-center">
            {showNameSearch ? (
              <div className="w-full">
                <NameSearch
                  tone={meta.tone}
                  disabled={busy}
                  onSelect={(qrCode) => { setQr(qrCode); doLookup(undefined, qrCode) }}
                />
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowNameSearch(false)}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-mist hover:text-paper transition [font-family:var(--font-mono),JetBrains_Mono,monospace]"
                  >
                    Hide search ↑
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNameSearch(true)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] transition [font-family:var(--font-mono),JetBrains_Mono,monospace] ${NEON_LINK_BY_TONE[meta.tone]}`}
              >
                Can&apos;t scan? Search by name →
              </button>
            )}
          </div>

          <NeonScanner
            tone={meta.tone}
            aspect="portrait"
            hint="Scan wristband"
            scanning
            onScan={(decoded) => { if (busy) return; setQr(decoded); doLookup(undefined, decoded) }}
          >
            <form onSubmit={doLookup} className="flex w-full max-w-xs flex-col gap-3 px-4">
              <Input
                type="text"
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                placeholder="Scan or paste QR"
                aria-label="QR code"
              />
              <Button type="submit" tone={meta.tone} size="md" loading={busy} fullWidth>
                Look up
              </Button>
              {lookupError && (
                <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger text-center">{lookupError}</p>
              )}
            </form>
          </NeonScanner>
        </>
      ) : (
        <>
          {/* Post-scan: scanner unmounts, kid details take the stage. */}
          <Button
            type="button"
            tone="ghost"
            size="lg"
            fullWidth
            onClick={reset}
          >
            ✓ Done — Scan next wristband
          </Button>

          <ChildCard
            child={data.child}
            primary_parent={data.primary_parent ?? { name: '—', phone: null }}
          />

          {/* Jail-only: mugshot capture is the first thing the jail volunteer
              should do on a kid's first visit. Promoted above the Send/Pass
              controls so the photo happens BEFORE the ticket decrement. The
              mugshot itself does not consume one of the 3 jail tickets. */}
          {slug === 'jail' && data.child.photo_consent_app && !notCheckedIn && !checkedOut && (
            <StationPhotoCapture
              childId={data.child.id}
              childFirstName={data.child.first_name}
              station="jail"
              tone="magenta"
              volunteerName={volunteer}
              ctaLabel={`Take jail mugshot · ${data.child.first_name}`}
              eyebrowLabel="Jail mugshot · separate from the 3 tickets"
            />
          )}

          {checkedOut && (
            <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
              Already checked out at {new Date(data.child.checked_out_at!).toLocaleTimeString()}.
            </p>
          )}
          {notCheckedIn && !checkedOut && (
            <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
              Not checked in yet — send them to the check-in station first.
            </p>
          )}
          {alreadyOneTime && !notCheckedIn && !checkedOut && (
            <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
              Already used tonight — one per kid.
            </p>
          )}
          {meterExhausted && !notCheckedIn && !checkedOut && (
            <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
              No {slug === 'drinks' ? 'drink' : 'jail'} tickets left on this wristband.
            </p>
          )}

          {!checkedOut && !notCheckedIn && !alreadyOneTime && !meterExhausted && (
            <div className="space-y-3">
              {slug === 'jail' && (
                <fieldset className="space-y-2 rounded-2xl border border-ink-hair bg-ink-2/70 p-4">
                  <legend className="text-xs font-semibold uppercase tracking-widest text-mist">
                    Which way?
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setJailAction('send')}
                      aria-pressed={jailAction === 'send'}
                      className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
                        jailAction === 'send'
                          ? 'border-neon-magenta bg-neon-magenta/10 text-neon-magenta shadow-glow-magenta'
                          : 'border-ink-hair bg-ink-2 text-mist hover:border-neon-magenta/50'
                      }`}
                    >
                      🚨 Send to jail
                    </button>
                    <button
                      type="button"
                      onClick={() => setJailAction('release')}
                      aria-pressed={jailAction === 'release'}
                      className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
                        jailAction === 'release'
                          ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan'
                          : 'border-ink-hair bg-ink-2 text-mist hover:border-neon-cyan/50'
                      }`}
                    >
                      🗝️ Use pass
                    </button>
                  </div>
                </fieldset>
              )}

              {slug === 'dj_shoutout' && (
                <Textarea
                  label="Song request (kid-appropriate, please)"
                  rows={2}
                  value={songRequest}
                  onChange={(e) => setSongRequest(e.target.value)}
                  placeholder="e.g. Mr. Brightside"
                  hint="Shown to the DJ. Keep it clean."
                />
              )}

              <Input
                label="Your name (staff, optional)"
                value={volunteer}
                onChange={(e) => setVolunteer(e.target.value)}
                aria-label="volunteer name"
              />

              <Button
                type="button"
                tone={meta.tone}
                size="xl"
                fullWidth
                disabled={ctaDisabled}
                loading={busy}
                onClick={doActivity}
              >
                {ctaLabel}
              </Button>
            </div>
          )}

          {actionError && (
            <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{actionError}</p>
          )}
          {success && (
            <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint motion-safe:animate-rise">
              ✨ {success}
            </p>
          )}

          {/* Generic per-kid photo capture — tag the shot to whatever station
              this volunteer is working. Suppressed on 'jail' so the dedicated
              jail-mugshot tile above doesn't get visually duplicated. */}
          {slug !== 'jail' && (
            <StationPhotoCapture
              childId={data.child.id}
              childFirstName={data.child.first_name}
              station={slug}
              tone={meta.tone}
              volunteerName={volunteer}
            />
          )}
        </>
      )}

      {log.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeading num="LIVE" title="Last 10 redemptions" tone={meta.tone} />
          <ul className="space-y-1.5">
            {log.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-hair bg-ink-2/50 px-3 py-2"
              >
                <span className="font-semibold text-paper text-sm truncate">{entry.name}</span>
                <span className="text-xs text-mist shrink-0">{entry.label}</span>
                <span className="text-[10px] text-faint shrink-0 font-mono">{entry.ts}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
