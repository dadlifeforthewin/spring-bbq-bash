'use client'
import { useEffect, useRef, useState } from 'react'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'
import {
  PageHead,
  NeonScanner,
  SignPanel,
  Chip,
  SectionHeading,
  GlyphGlow,
  RoamingGlyph,
} from '@/components/glow'
import NameSearch from './NameSearch'

type Shot = {
  photo_id: string
  taken_at: string
  state: 'uploading' | 'processing' | 'done' | 'error'
  match_status?: 'auto' | 'pending_review' | 'unmatched'
  matched_name?: string | null
  error?: string
}

export default function RoamingStation() {
  const viewfinderRef = useRef<PhotoViewfinderHandle>(null)
  const [volunteerName, setVolunteerName] = useState('')
  const [busy, setBusy] = useState(false)
  const [shots, setShots] = useState<Shot[]>([])
  const [cameraReady, setCameraReady] = useState(false)
  const [taggedKid, setTaggedKid] = useState<{ id: string; name: string } | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)

  // Name-search fallback: resolve the chosen kid so the next capture tags them.
  async function doLookup(_e?: React.FormEvent, overrideQr?: string) {
    const value = (overrideQr ?? '').trim()
    if (!value) return
    setTagError(null)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(value)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setTagError(err.error ?? 'Lookup failed')
        return
      }
      const body = await res.json()
      setTaggedKid({
        id: body.child.id,
        name: `${body.child.first_name} ${body.child.last_name}`,
      })
    } catch {
      setTagError('Lookup failed')
    }
  }

  // Mark camera ready after brief boot window; confirmed on first successful capture
  useEffect(() => {
    const t = setTimeout(() => setCameraReady(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const uploading = busy
  const queuedCount = shots.length
  const lastShot = shots[0]
  const lastUploadStatus = lastShot?.state === 'done' || lastShot?.state === 'processing'
    ? lastShot.match_status ?? null
    : null

  async function capture() {
    setBusy(true)
    try {
      const blob = await viewfinderRef.current?.capture()
      if (!blob) {
        setBusy(false)
        return
      }
      setCameraReady(true)
      const takenAt = new Date().toISOString()
      const placeholderId = `tmp-${Date.now()}`
      setShots((s) => [{ photo_id: placeholderId, taken_at: takenAt, state: 'uploading' as const }, ...s].slice(0, 10))

      const form = new FormData()
      form.set('photo', blob, 'roaming.jpg')
      form.set('child_ids', JSON.stringify(taggedKid ? [taggedKid.id] : []))
      form.set('station', 'roaming')
      form.set('capture_mode', 'roaming_vision')
      if (volunteerName.trim()) form.set('volunteer_name', volunteerName.trim())
      // One-shot tag: consumed by this capture, cleared for the next.
      if (taggedKid) setTaggedKid(null)

      const res = await fetch('/api/photos/upload', { method: 'POST', body: form })
      const body = await res.json()

      if (!res.ok) {
        setShots((s) =>
          s.map((shot) => shot.photo_id === placeholderId
            ? { ...shot, state: 'error' as const, error: body.error ?? 'Upload failed' }
            : shot),
        )
        return
      }

      setShots((s) =>
        s.map((shot) => shot.photo_id === placeholderId
          ? { ...shot, photo_id: body.photo_id, state: 'processing' as const }
          : shot),
      )

      void pollMatch(body.photo_id)
    } finally {
      setBusy(false)
    }
  }

  async function pollMatch(photoId: string) {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      const res = await fetch(`/api/admin/photos/status?photo_id=${encodeURIComponent(photoId)}`)
      if (!res.ok) continue
      const body = await res.json()
      const terminal = body.match_status === 'auto' || body.match_status === 'unmatched'
      setShots((s) =>
        s.map((shot) => shot.photo_id === photoId
          ? { ...shot, state: 'done' as const, match_status: body.match_status, matched_name: body.matched_name ?? null }
          : shot),
      )
      if (terminal || body.match_status === 'pending_review') return
    }
  }

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="ROAMING"
        sub="Shoot freely. We'll sort the matches after the event."
        right={<Chip tone="uv" glow>QUEUE · {queuedCount}</Chip>}
      />

      <NeonScanner
        tone="uv"
        aspect="portrait"
        hint="Tap to snap · auto-upload"
        scanning={!uploading}
        onClick={capture}
        style={{ cursor: 'pointer' }}
      >
        {!cameraReady ? (
          <GlyphGlow tone="uv" size={96}>
            <RoamingGlyph size={72} />
          </GlyphGlow>
        ) : (
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
            <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />
          </div>
        )}
      </NeonScanner>

      {/* Hidden name input preserved for volunteer attribution */}
      <input
        type="text"
        className="sr-only"
        aria-label="volunteer name"
        value={volunteerName}
        onChange={(e) => setVolunteerName(e.target.value)}
      />

      {/* Name-search fallback: pre-tag the next capture when a wristband won't scan. */}
      <NameSearch
        tone="uv"
        disabled={uploading}
        onSelect={(qrCode) => { doLookup(undefined, qrCode) }}
      />

      {taggedKid && (
        <SignPanel tone="uv" padding="md">
          <div className="flex items-center justify-between gap-3 text-sm text-paper">
            <span>
              Next shot will tag <strong className="text-neon-uv">{taggedKid.name}</strong>.
            </span>
            <button
              type="button"
              onClick={() => setTaggedKid(null)}
              className="text-[11px] font-semibold uppercase tracking-wider text-neon-cyan hover:text-paper transition [font-family:var(--font-mono),JetBrains_Mono,monospace]"
            >
              [ clear ]
            </button>
          </div>
        </SignPanel>
      )}

      {tagError && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{tagError}</p>
      )}

      {lastUploadStatus && (
        <SignPanel tone="uv" padding="md">
          <div className="text-sm text-paper">Sent to queue. Photos sync after the event.</div>
          <div className="mt-2 flex items-center gap-2">
            <Chip tone={
              lastUploadStatus === 'auto' ? 'mint' :
              lastUploadStatus === 'pending_review' ? 'gold' : 'quiet'
            }>
              {lastUploadStatus.toUpperCase()}
            </Chip>
          </div>
        </SignPanel>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeading num="LAST 5" title="Recent captures" tone="uv" />
        {shots.length > 0 && (
          <ul className="space-y-1.5">
            {shots.slice(0, 5).map((s) => (
              <li key={s.photo_id} className="rounded-xl border border-ink-hair bg-ink-2/60 px-3 py-2 text-sm">
                <span className="text-faint tabular-nums">{new Date(s.taken_at).toLocaleTimeString()}</span>{' '}
                {s.state === 'uploading' && <span className="text-mist">uploading…</span>}
                {s.state === 'processing' && <span className="text-mist">analyzing…</span>}
                {s.state === 'error' && <span className="text-danger">error: {s.error}</span>}
                {s.state === 'done' && (
                  <>
                    {s.match_status === 'auto' && (
                      <span className="text-neon-mint font-semibold">tagged {s.matched_name ?? ''}</span>
                    )}
                    {s.match_status === 'pending_review' && (
                      <span className="text-neon-gold font-semibold">pending review</span>
                    )}
                    {s.match_status === 'unmatched' && (
                      <span className="text-faint">unmatched</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
