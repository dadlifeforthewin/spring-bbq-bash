'use client'
import { useRef, useState } from 'react'
import { StationShell } from './StationShell'
import ChildCard from './ChildCard'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { Card, CardEyebrow } from '@/components/glow/Card'

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

export default function CheckInStation() {
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
  const viewfinderRef = useRef<PhotoViewfinderHandle>(null)

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null); setCheckInError(null); setMugshotError(null)
    setSuccess(false); setMugshotTaken(false)
    setData(null); setDropoff(null)
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
    <StationShell
      eyebrow="Station · Check-in"
      title="Welcome the kid in"
      subtitle="Scan their wristband, take the jail mugshot, assign a dropoff, check them in."
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

      {lookupError && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{lookupError}</p>
      )}

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
    </StationShell>
  )
}
