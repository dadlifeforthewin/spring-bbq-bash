'use client'
import { useRef, useState } from 'react'
import PhotoViewfinder, { type PhotoViewfinderHandle } from './PhotoViewfinder'
import { Button } from '@/components/glow/Button'

/**
 * Post-scan photo capture tile for station pages.
 *
 * Starts collapsed as a neon text link so it takes near-zero vertical space
 * above the scroll fold. On tap, expands to show a viewfinder + capture
 * button and streams the camera. On successful upload, collapses back to a
 * confirmation pill the volunteer can tap again to take another shot.
 *
 * Uploads through /api/photos/upload with capture_mode=station_scan and the
 * station slug attached — same pipeline check-in uses for the jail mugshot
 * and every other station-tagged photo.
 */

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = {
  childId: string
  childFirstName: string
  station: string
  volunteerName?: string
  tone?: Tone
}

const TONE_TEXT: Record<Tone, string> = {
  magenta: 'text-neon-magenta',
  cyan:    'text-neon-cyan',
  uv:      'text-neon-uv',
  gold:    'text-neon-gold',
  mint:    'text-neon-mint',
}
const TONE_RING: Record<Tone, string> = {
  magenta: 'hover:shadow-glow-magenta focus-visible:shadow-glow-magenta',
  cyan:    'hover:shadow-glow-cyan    focus-visible:shadow-glow-cyan',
  uv:      'hover:shadow-glow-uv      focus-visible:shadow-glow-uv',
  gold:    'hover:shadow-glow-gold    focus-visible:shadow-glow-gold',
  mint:    'hover:shadow-glow-mint    focus-visible:shadow-glow-mint',
}

export default function StationPhotoCapture({
  childId,
  childFirstName,
  station,
  volunteerName,
  tone = 'cyan',
}: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTakenAt, setLastTakenAt] = useState<string | null>(null)
  const viewfinderRef = useRef<PhotoViewfinderHandle>(null)

  async function doCapture() {
    setError(null)
    setBusy(true)
    try {
      const blob = await viewfinderRef.current?.capture()
      if (!blob) {
        setError('Capture failed — try again.')
        return
      }
      const form = new FormData()
      form.set('photo', blob, `${station}-${childId}.jpg`)
      form.set('child_ids', JSON.stringify([childId]))
      form.set('station', station)
      form.set('capture_mode', 'station_scan')
      if (volunteerName?.trim()) form.set('volunteer_name', volunteerName.trim())

      const res = await fetch('/api/photos/upload', { method: 'POST', body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error ?? 'Upload failed')
        return
      }
      setLastTakenAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-ink-hair bg-ink-2/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${TONE_TEXT[tone]} ${TONE_RING[tone]} [font-family:var(--font-mono),JetBrains_Mono,monospace]`}
        >
          📸 {lastTakenAt ? `Snap another of ${childFirstName}` : `Snap a photo of ${childFirstName}`}
        </button>
        {lastTakenAt && (
          <p className="mt-1 text-[10px] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
            Last saved at {lastTakenAt}
          </p>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 p-4">
      <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${TONE_TEXT[tone]} [font-family:var(--font-mono),JetBrains_Mono,monospace]`}>
        Photo · {childFirstName}
      </div>
      <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />
      <div className="grid grid-cols-2 gap-2">
        <Button tone="ghost" size="md" fullWidth onClick={() => { setOpen(false); setError(null) }} disabled={busy}>
          Cancel
        </Button>
        <Button tone={tone} size="md" fullWidth onClick={doCapture} disabled={busy} loading={busy}>
          {busy ? 'Uploading…' : '📸 Take photo'}
        </Button>
      </div>
      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
