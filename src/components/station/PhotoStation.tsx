'use client'
import { useEffect, useRef, useState } from 'react'
import { StationShell } from './StationShell'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'
import { Chip } from '@/components/glow/Chip'

type ScannedKid = {
  id: string
  first_name: string
  last_name: string
  photo_consent_app: boolean
}

const STATION_STORAGE_KEY = 'sbbq_station'

export default function PhotoStation() {
  const [station, setStation] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [scanned, setScanned] = useState<ScannedKid[]>([])
  const [volunteerName, setVolunteerName] = useState('')
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lastUpload, setLastUpload] = useState<{ photo_id: string; count: number } | null>(null)
  const viewfinderRef = useRef<PhotoViewfinderHandle>(null)

  useEffect(() => {
    try {
      setStation(localStorage.getItem(STATION_STORAGE_KEY))
    } catch {
      setStation(null)
    }
  }, [])

  async function addScan(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null)
    if (!qr.trim()) return
    if (scanned.some((k) => k.id === qr.trim())) {
      setQr('')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setLookupError(err.error ?? 'Lookup failed')
        return
      }
      const body = await res.json()
      const kid: ScannedKid = {
        id: body.child.id,
        first_name: body.child.first_name,
        last_name: body.child.last_name,
        photo_consent_app: body.child.photo_consent_app,
      }
      if (!scanned.some((k) => k.id === kid.id)) setScanned([...scanned, kid])
      setQr('')
    } finally {
      setBusy(false)
    }
  }

  function removeScan(id: string) {
    setScanned(scanned.filter((k) => k.id !== id))
  }

  const anyBlocked = scanned.some((k) => !k.photo_consent_app)

  async function capture() {
    if (!station || scanned.length === 0) return
    const blob = await viewfinderRef.current?.capture()
    if (!blob) {
      setUploadError('Capture failed — try again.')
      return
    }
    setUploadError(null)
    setBusy(true)
    try {
      const form = new FormData()
      form.set('photo', blob, 'photo.jpg')
      form.set('child_ids', JSON.stringify(scanned.map((k) => k.id)))
      form.set('station', station)
      form.set('capture_mode', 'station_scan')
      if (volunteerName.trim()) form.set('volunteer_name', volunteerName.trim())
      const res = await fetch('/api/photos/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed')
        return
      }
      setLastUpload({ photo_id: data.photo_id, count: data.tagged_child_ids.length })
      setScanned([])
    } finally {
      setBusy(false)
    }
  }

  if (!station) {
    return (
      <StationShell eyebrow="Photo" title="No station selected">
        <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
          Pick a station from the picker first. <a href="/station" className="underline">Back to picker.</a>
        </p>
      </StationShell>
    )
  }

  return (
    <StationShell
      eyebrow="Station · Photo"
      title="Scan then shoot"
      subtitle="Scan every kid in the frame, then hit shutter."
    >
      <form onSubmit={addScan} className="flex gap-2">
        <Input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="Scan or paste QR"
          aria-label="QR code"
          className="flex-1"
        />
        <Button type="submit" tone="ghost" size="md" loading={busy}>Add to frame</Button>
      </form>

      {lookupError && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{lookupError}</p>
      )}

      {scanned.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mist">In this shot</h2>
          <ul className="flex flex-wrap gap-2">
            {scanned.map((k) => (
              <li key={k.id}>
                <Chip tone={k.photo_consent_app ? 'mint' : 'danger'} glow={k.photo_consent_app}>
                  <span>{k.first_name} {k.last_name}</span>
                  <button
                    type="button"
                    onClick={() => removeScan(k.id)}
                    aria-label={`remove-${k.id}`}
                    className="ml-1 opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />

      <Input
        label="Your name (staff, optional)"
        value={volunteerName}
        onChange={(e) => setVolunteerName(e.target.value)}
        aria-label="volunteer name"
      />

      <Button
        tone="magenta"
        size="xl"
        fullWidth
        onClick={capture}
        disabled={busy || scanned.length === 0 || anyBlocked}
        loading={busy}
      >
        📸 Shutter ({scanned.length})
      </Button>

      {uploadError && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{uploadError}</p>
      )}
      {lastUpload && (
        <p className="rounded-xl border border-neon-mint/60 bg-neon-mint/10 px-3 py-2 text-sm text-neon-mint shadow-glow-mint animate-rise">
          ✨ Uploaded · tagged {lastUpload.count} {lastUpload.count === 1 ? 'kid' : 'kids'}.
        </p>
      )}

      {anyBlocked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="photo consent block"
          className="fixed inset-0 z-50 flex items-center justify-center bg-danger/90 p-6 text-white"
        >
          <div className="max-w-md space-y-4 text-center">
            <h3 className="font-display text-3xl">🚫 No Photos</h3>
            <p>
              One of the scanned kids doesn&apos;t have photo consent. Remove
              them from the list to take a shot of the others, or step out of
              frame.
            </p>
            <Button
              tone="ghost"
              size="md"
              onClick={() => setScanned(scanned.filter((k) => k.photo_consent_app))}
              className="!bg-white !text-danger !border-white"
            >
              Remove no-consent kids
            </Button>
          </div>
        </div>
      )}
    </StationShell>
  )
}
