'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChildCard from './ChildCard'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { Card, CardEyebrow } from '@/components/glow/Card'
import { PageHead } from '@/components/glow/PageHead'
import { NeonScanner } from '@/components/glow/NeonScanner'
import { Chip } from '@/components/glow/Chip'
import { SectionHeading } from '@/components/glow/SectionHeading'
import NameSearch from './NameSearch'

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
  const [staffName, setStaffName] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [mugshotError, setMugshotError] = useState<string | null>(null)
  const [mugshotTaken, setMugshotTaken] = useState(false)
  const [mugshotUploading, setMugshotUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [recentArrivals, setRecentArrivals] = useState<Arrival[]>([])
  const viewfinderRef = useRef<PhotoViewfinderHandle>(null)

  const checkedInCount = recentArrivals.length

  function handleWalkin() {
    router.push('/register')
  }

  function handleManualLookup() {
    router.push('/station/lookup')
  }

  async function doLookup(e?: React.FormEvent, overrideQr?: string) {
    e?.preventDefault()
    setLookupError(null); setCheckInError(null); setMugshotError(null)
    setSuccess(false); setMugshotTaken(false)
    setData(null); setDropoff(null)
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

  async function takeMugshot() {
    if (!data) return
    setMugshotError(null)
    setMugshotUploading(true)
    try {
      const blob = await viewfinderRef.current?.capture()
      if (!blob) {
        setMugshotError('Capture failed — try again.')
        return
      }
      const form = new FormData()
      form.set('photo', blob, 'mugshot.jpg')
      form.set('child_ids', JSON.stringify([data.child.id]))
      form.set('station', 'jail')
      form.set('capture_mode', 'station_scan')
      if (staffName.trim()) form.set('volunteer_name', staffName.trim())
      const res = await fetch('/api/photos/upload', { method: 'POST', body: form })
      const body = await res.json()
      if (!res.ok) {
        setMugshotError(body.error ?? 'Upload failed')
        return
      }
      setMugshotTaken(true)
    } finally {
      setMugshotUploading(false)
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
    setStaffName('')
    setLookupError(null)
    setCheckInError(null)
    setMugshotError(null)
    setMugshotTaken(false)
    setSuccess(false)
  }

  const needsMugshot = !!data && data.child.photo_consent_app && !data.child.checked_in_at
  const mugshotReady = !needsMugshot || mugshotTaken

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="CHECK-IN STATION"
        sub="Scan a family's QR, or tap Walk-in to register a new kid."
        right={<Chip tone="cyan" glow>LIVE · {checkedInCount}</Chip>}
      />

      <NeonScanner tone="cyan" aspect="portrait" hint="Align QR · auto-capture" scanning={!data && !lookupError}>
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
      {!data && (
        <NameSearch
          tone="cyan"
          disabled={busy}
          onSelect={(qrCode) => { setQr(qrCode); doLookup(undefined, qrCode) }}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button tone="magenta" size="lg" fullWidth onClick={handleWalkin}>Walk-in</Button>
        <Button tone="ghost" size="lg" fullWidth onClick={handleManualLookup}>Manual lookup</Button>
      </div>

      {data && (
        <div className="space-y-4">
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

              {needsMugshot ? (
                <section className="space-y-3 rounded-2xl border border-neon-magenta/30 bg-ink-2/70 p-4 shadow-[0_0_30px_-10px_rgba(255,46,147,.5)]">
                  <CardEyebrow className="text-neon-magenta">Jail mugshot</CardEyebrow>
                  <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />
                  <Button
                    tone={mugshotTaken ? 'mint' : 'magenta'}
                    size="lg"
                    fullWidth
                    onClick={takeMugshot}
                    disabled={mugshotUploading || mugshotTaken}
                  >
                    {mugshotTaken ? '📸 Mugshot saved' : mugshotUploading ? 'Uploading…' : '📸 Take mugshot'}
                  </Button>
                  {mugshotError && (
                    <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{mugshotError}</p>
                  )}
                </section>
              ) : !data.child.photo_consent_app ? (
                <Card tone="glow-magenta" padded className="text-sm text-danger">
                  🚫 No photo consent — mugshot is skipped. Check-in still completes.
                </Card>
              ) : null}

              <fieldset className="space-y-2 rounded-2xl border border-ink-hair bg-ink-2/70 p-4">
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
              </fieldset>

              <Button
                type="button"
                tone="magenta"
                size="xl"
                fullWidth
                onClick={doCheckIn}
                disabled={!dropoff || !mugshotReady || busy}
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
            <>
              <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint animate-rise">
                ✨ Checked in! Next kid?
              </p>
              <Button tone="ghost" size="md" fullWidth onClick={reset}>
                Scan next wristband
              </Button>
            </>
          )}
        </div>
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
