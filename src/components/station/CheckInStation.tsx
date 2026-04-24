'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChildCard from './ChildCard'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { PageHead } from '@/components/glow/PageHead'
import { NeonScanner } from '@/components/glow/NeonScanner'
import { Chip } from '@/components/glow/Chip'
import { HelpLink } from '@/components/glow/HelpLink'
import { SectionHeading } from '@/components/glow/SectionHeading'
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
    drink_tickets_remaining: number
    jail_tickets_remaining: number
    prize_wheel_used_at: string | null
    dj_shoutout_used_at: string | null
  }
  primary_parent: { name: string; phone: string | null } | null
}

type DropoffType = 'both_parents' | 'one_parent' | 'grandparent' | 'other_approved_adult'

const DROPOFF_OPTIONS: { value: DropoffType; label: string }[] = [
  { value: 'both_parents', label: 'Both parents' },
  { value: 'one_parent', label: 'One parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other_approved_adult', label: 'Other approved adult' },
]

type Arrival = { name: string; time: string }

export default function CheckInStation() {
  const router = useRouter()
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [dropoff, setDropoff] = useState<DropoffType | null>(null)
  const [dropoffPersonName, setDropoffPersonName] = useState('')
  const [staffName, setStaffName] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [recentArrivals, setRecentArrivals] = useState<Arrival[]>([])
  const [showNameSearch, setShowNameSearch] = useState(false)

  const checkedInCount = recentArrivals.length

  function handleWalkin() {
    router.push('/register')
  }

  function handleManualLookup() {
    router.push('/station/lookup')
  }

  async function doLookup(e?: React.FormEvent, overrideQr?: string) {
    e?.preventDefault()
    setLookupError(null); setCheckInError(null)
    setSuccess(false)
    setData(null); setDropoff(null); setDropoffPersonName('')
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

  async function doCheckIn() {
    if (!data || !dropoff) return
    setCheckInError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: data.child.id,
          dropoff_type: dropoff,
          dropoff_person_name:
            dropoff === 'other_approved_adult' ? dropoffPersonName.trim() : undefined,
          staff_name: staffName,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setCheckInError(body.error ?? 'Check-in failed')
        return
      }
      setSuccess(true)
      setRecentArrivals((prev) => [
        {
          name: `${data.child.first_name} ${data.child.last_name}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setQr('')
    setData(null)
    setDropoff(null)
    setDropoffPersonName('')
    setLookupError(null)
    setCheckInError(null)
    setSuccess(false)
    // staffName persists across scans — volunteer types it once per shift.
  }

  const otherAdultNameMissing =
    dropoff === 'other_approved_adult' && dropoffPersonName.trim().length === 0
  const canCheckIn = !!dropoff && !otherAdultNameMissing && !busy

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="CHECK-IN STATION"
        sub="Scan a family's QR, or tap Walk-in to register a new kid."
        right={<><Chip tone="cyan" glow>LIVE · {checkedInCount}</Chip><HelpLink /></>}
      />

      {!data ? (
        <>
          {/* Manual name-search toggle — compact neon link above the scanner.
              Collapsed by default so the QR camera stays the primary surface. */}
          <div className="flex justify-center">
            {showNameSearch ? (
              <div className="w-full">
                <NameSearch
                  tone="cyan"
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
                className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neon-cyan hover:shadow-glow-cyan transition [font-family:var(--font-mono),JetBrains_Mono,monospace]"
              >
                Can&apos;t scan? Search by name →
              </button>
            )}
          </div>

          <NeonScanner
            tone="cyan"
            aspect="portrait"
            hint="Align QR · auto-capture"
            scanning
            onScan={(decoded) => { if (busy) return; setQr(decoded); doLookup(undefined, decoded) }}
          >
            <div className="flex w-full flex-col gap-3 px-4">
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
            </div>
          </NeonScanner>

          <div className="grid grid-cols-2 gap-3">
            <Button tone="magenta" size="lg" fullWidth onClick={handleWalkin}>Walk-in</Button>
            <Button tone="ghost" size="lg" fullWidth onClick={handleManualLookup}>Manual lookup</Button>
          </div>
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

          <ChildCard child={data.child} primary_parent={data.primary_parent ?? { name: '—', phone: null }} />

          {data.child.checked_in_at ? (
            <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
              Already checked in at {new Date(data.child.checked_in_at).toLocaleTimeString()}.
            </p>
          ) : (
            <>
              <Input
                label="Your name (staff)"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                aria-label="staff name"
              />

              <fieldset className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 p-4">
                <legend className="text-xs font-semibold uppercase tracking-widest text-mist">Dropoff</legend>
                <div className="grid grid-cols-2 gap-2">
                  {DROPOFF_OPTIONS.map((o) => (
                    <label key={o.value} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dropoff"
                        value={o.value}
                        checked={dropoff === o.value}
                        onChange={() => setDropoff(o.value)}
                        className="mt-0.5 appearance-none h-5 w-5 rounded-full border border-ink-hair bg-ink-2 checked:border-neon-cyan checked:bg-neon-cyan/20 checked:shadow-[0_0_14px_rgba(0,230,247,.45)]"
                      />
                      <span className="text-sm text-paper">{o.label}</span>
                    </label>
                  ))}
                </div>

                {dropoff === 'other_approved_adult' && (
                  <Input
                    label="Name of approved adult"
                    value={dropoffPersonName}
                    onChange={(e) => setDropoffPersonName(e.target.value)}
                    placeholder="Full name of the person dropping off"
                    aria-label="dropoff person name"
                    required
                    autoFocus
                  />
                )}
              </fieldset>

              <Button
                type="button"
                tone="magenta"
                size="xl"
                fullWidth
                onClick={doCheckIn}
                disabled={!canCheckIn}
                loading={busy}
              >
                Check In
              </Button>

              {checkInError && (
                <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{checkInError}</p>
              )}
            </>
          )}

          {success && (
            <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint animate-rise">
              ✨ Checked in! Tap Done above to scan the next wristband.
            </p>
          )}

          {/* Inline per-kid photo capture — tag the shot to the check-in station. */}
          <StationPhotoCapture
            childId={data.child.id}
            childFirstName={data.child.first_name}
            station="check_in"
            tone="cyan"
            volunteerName={staffName}
          />
        </>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeading num="LOG" title="Recent arrivals" tone="cyan" />
        {recentArrivals.length === 0 ? (
          <p className="text-sm text-mist px-1">No arrivals yet this session.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentArrivals.map((arrival, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-ink-hair bg-ink-2/60 px-3 py-2 text-sm">
                <span className="text-paper">{arrival.name}</span>
                <span className="text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace] text-xs">{arrival.time}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
