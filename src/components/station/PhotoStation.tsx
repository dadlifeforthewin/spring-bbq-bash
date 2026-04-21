'use client'
import { useEffect, useRef, useState } from 'react'
import { clsx } from '@/components/glow/clsx'
import {
  PageHead,
  NeonScanner,
  Chip,
  Button,
  GlyphGlow,
  Input,
} from '@/components/glow'
import { PhotoGlyph } from '@/components/glow/glyphs'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'
import NameSearch from './NameSearch'

type ScannedKid = {
  id: string
  first_name: string
  last_name: string
  photo_consent_app: boolean
}

const STATION_STORAGE_KEY = 'sbbq_station'

const FRAME_OPTIONS = ['Classic', 'Glow', 'Polaroid', 'Neon', 'Raw'] as const
type Frame = typeof FRAME_OPTIONS[number]

export default function PhotoStation() {
  const [station, setStation] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [scanned, setScanned] = useState<ScannedKid[]>([])
  const [volunteerName, setVolunteerName] = useState('')
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lastUpload, setLastUpload] = useState<{ photo_id: string; count: number } | null>(null)
  const [takenCount, setTakenCount] = useState(0)
  const [frame, setFrame] = useState<Frame>('Classic')
  const [cameraReady, setCameraReady] = useState(false)
  const viewfinderRef = useRef<PhotoViewfinderHandle>(null)

  // Mirror RoamingStation camera-boot pattern: flip ready after 2 s so the
  // polaroid placeholder GlyphGlow dismisses once the viewfinder should be live.
  useEffect(() => {
    const t = setTimeout(() => setCameraReady(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // Derived state
  const capturing = busy
  const anyBlocked = scanned.some((k) => !k.photo_consent_app)
  const consentGranted = scanned.length > 0 && !anyBlocked

  useEffect(() => {
    try {
      setStation(localStorage.getItem(STATION_STORAGE_KEY))
    } catch {
      setStation(null)
    }
  }, [])

  async function addScan(e?: React.FormEvent, overrideQr?: string) {
    e?.preventDefault()
    setLookupError(null)
    const value = (overrideQr ?? qr).trim()
    if (!value) return
    if (scanned.some((k) => k.id === value)) {
      setQr('')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(value)}`)
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

  async function handleSnap() {
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
      const uploaded = { photo_id: data.photo_id, count: data.tagged_child_ids.length }
      setLastUpload(uploaded)
      setTakenCount((n) => n + uploaded.count)
      setScanned([])
    } finally {
      setBusy(false)
    }
  }

  function handleRetake() {
    setLastUpload(null)
    setScanned([])
    setUploadError(null)
  }

  if (!station) {
    return (
      <main className="flex flex-col gap-5">
        <PageHead
          back={{ href: '/station', label: 'stations' }}
          title="PHOTO BOOTH"
          sub="No station selected."
        />
        <p className="rounded-xl border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-warn">
          Pick a station from the picker first.{' '}
          <a href="/station" className="underline">Back to picker.</a>
        </p>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="PHOTO BOOTH"
        sub="Tap to snap. Consent-off kids get text-only receipts."
        right={<Chip tone="magenta" glow>TAKEN · {takenCount}</Chip>}
      />

      <NeonScanner tone="magenta" aspect="portrait" hint="Tap to snap · 3-2-1" scanning={!capturing}>
        {!cameraReady ? (
          <GlyphGlow tone="magenta" size={96}><PhotoGlyph size={72} /></GlyphGlow>
        ) : null}
        <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />
      </NeonScanner>

      {/* QR scan input */}
      <form onSubmit={addScan} className="flex gap-2">
        <Input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="Scan or paste QR"
          aria-label="QR code"
          className="flex-1"
        />
        <Button type="submit" tone="ghost" size="md" loading={capturing}>Add to frame</Button>
      </form>

      <NameSearch
        tone="magenta"
        disabled={capturing}
        onSelect={(qrCode) => { setQr(qrCode); addScan(undefined, qrCode) }}
      />

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

      {/* Frame-style filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FRAME_OPTIONS.map((f) => (
          <Chip
            key={f}
            tone={frame === f ? 'magenta' : 'quiet'}
            glow={frame === f}
            role="button"
            tabIndex={0}
            aria-pressed={frame === f}
            onClick={() => setFrame(f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setFrame(f)
              }
            }}
          >
            {f}
          </Chip>
        ))}
      </div>

      {/* Consent status banner */}
      <div className={clsx(
        'rounded-xl border px-4 py-3 text-sm',
        consentGranted
          ? 'border-neon-mint/50 text-neon-mint'
          : 'border-neon-gold/50 text-neon-gold'
      )}>
        {consentGranted
          ? "CONSENT ON · Photos sync to the family's album after the event."
          : 'CONSENT OFF · Text-only receipt. No photos saved.'}
      </div>

      <Input
        label="Your name (staff, optional)"
        value={volunteerName}
        onChange={(e) => setVolunteerName(e.target.value)}
        aria-label="volunteer name"
      />

      <div className="grid grid-cols-2 gap-3">
        <Button
          tone="magenta"
          size="lg"
          fullWidth
          onClick={handleSnap}
          disabled={capturing || scanned.length === 0 || anyBlocked}
          loading={capturing}
        >
          Snap!
        </Button>
        <Button tone="ghost" size="lg" fullWidth onClick={handleRetake}>Retake last</Button>
      </div>

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
    </main>
  )
}
