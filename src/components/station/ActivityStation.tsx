'use client'
import { useEffect, useState } from 'react'
import { StationShell } from './StationShell'
import ChildCard from './ChildCard'
import { Input, Textarea } from '@/components/glow/Input'
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

type StationMeta = {
  slug: string
  title: string
  eyebrow: string
  tone: 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
}

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

const METERED = new Set(['drinks', 'jail'])
const ONE_TIME = new Set(['prize_wheel', 'dj_shoutout'])

export default function ActivityStation() {
  const [slug, setSlug] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Station-specific form state
  const [jailAction, setJailAction] = useState<'send' | 'release'>('send')
  const [songRequest, setSongRequest] = useState('')
  const [volunteer, setVolunteer] = useState('')

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

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null); setActionError(null); setSuccess(null); setData(null)
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
      // Update local state with new balances so the UI reflects the change
      if (slug === 'drinks') {
        setData({ ...data, child: { ...data.child, drink_tickets_remaining: body.balance.drink_tickets } })
        setSuccess(`Drink redeemed — ${body.balance.drink_tickets} left.`)
      } else if (slug === 'jail') {
        setData({ ...data, child: { ...data.child, jail_tickets_remaining: body.balance.jail_tickets } })
        setSuccess(
          body.action === 'send'
            ? `Sent to jail — ${body.balance.jail_tickets} left.`
            : `Pass redeemed — ${body.balance.jail_tickets} left.`,
        )
      } else if (slug === 'prize_wheel') {
        setData({ ...data, child: { ...data.child, prize_wheel_used_at: body.used_at } })
        setSuccess('Prize wheel spun. One per kid — done for the night.')
      } else if (slug === 'dj_shoutout') {
        setData({ ...data, child: { ...data.child, dj_shoutout_used_at: body.used_at } })
        setSuccess(`DJ shoutout queued: "${songRequest}".`)
        setSongRequest('')
      } else {
        setSuccess(`Visit logged — ${data.child.first_name} was here.`)
      }
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
      <StationShell eyebrow="Activity" title="No station selected">
        <Card tone="glow-gold" padded>
          <CardEyebrow>Heads up</CardEyebrow>
          <CardTitle className="font-sans text-sm font-normal">
            Pick a station from the picker first so the app knows which activity
            to log.
          </CardTitle>
          <div className="mt-4">
            <a
              href="/station"
              className="inline-flex items-center rounded-full border border-neon-cyan/60 px-4 py-2 text-sm font-bold text-neon-cyan hover:shadow-glow-cyan transition"
            >
              → Pick a station
            </a>
          </div>
        </Card>
      </StationShell>
    )
  }

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

  return (
    <StationShell eyebrow={meta.eyebrow} title={meta.title}>
      <form onSubmit={doLookup} className="flex gap-2">
        <Input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="Scan or paste QR"
          aria-label="QR code"
          className="flex-1"
        />
        <Button type="submit" tone="ghost" size="md" loading={busy}>
          Look up
        </Button>
      </form>

      {lookupError && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{lookupError}</p>
      )}

      {data && (
        <div className="space-y-4">
          <ChildCard
            child={data.child}
            primary_parent={data.primary_parent ?? { name: '—', phone: null }}
          />

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
            <div className="space-y-4">
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
            <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint animate-rise">
              ✨ {success}
            </p>
          )}
          {(success || actionError) && (
            <Button tone="ghost" size="md" fullWidth onClick={reset}>
              Scan next wristband
            </Button>
          )}
        </div>
      )}
    </StationShell>
  )
}
