'use client'
import { useRef, useState } from 'react'
import { StationShell } from './StationShell'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'
import { Input } from '@/components/glow/Input'
import { Button } from '@/components/glow/Button'

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

  async function capture() {
    setBusy(true)
    try {
      const blob = await viewfinderRef.current?.capture()
      if (!blob) {
        setBusy(false)
        return
      }
      const takenAt = new Date().toISOString()
      const placeholderId = `tmp-${Date.now()}`
      setShots((s) => [{ photo_id: placeholderId, taken_at: takenAt, state: 'uploading' as const }, ...s].slice(0, 10))

      const form = new FormData()
      form.set('photo', blob, 'roaming.jpg')
      form.set('child_ids', '[]')
      form.set('station', 'roaming')
      form.set('capture_mode', 'roaming_vision')
      if (volunteerName.trim()) form.set('volunteer_name', volunteerName.trim())

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
    <StationShell
      eyebrow="Station · Roaming photographer"
      title="Shoot candids"
      subtitle="Claude vision will try to tag kids with matching consent. You just keep shooting."
    >
      <Input
        label="Your name (staff, optional)"
        value={volunteerName}
        onChange={(e) => setVolunteerName(e.target.value)}
        aria-label="volunteer name"
      />

      <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />

      <Button tone="uv" size="xl" fullWidth onClick={capture} disabled={busy} loading={busy}>
        📸 Shutter
      </Button>

      {shots.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mist">Recent shots</h2>
          <ul className="space-y-1.5">
            {shots.map((s) => (
              <li key={s.photo_id} className="rounded-xl border border-ink-hair bg-ink-2/60 px-3 py-2 text-sm">
                <span className="text-faint tabular-nums">{new Date(s.taken_at).toLocaleTimeString()}</span>{' '}
                {s.state === 'uploading' && <span className="text-mist">uploading…</span>}
                {s.state === 'processing' && <span className="text-mist">analyzing…</span>}
                {s.state === 'error' && <span className="text-danger">error: {s.error}</span>}
                {s.state === 'done' && (
                  <>
                    {s.match_status === 'auto' && (
                      <span className="text-neon-mint font-semibold">✅ tagged {s.matched_name ?? ''}</span>
                    )}
                    {s.match_status === 'pending_review' && (
                      <span className="text-neon-gold font-semibold">🔍 pending review</span>
                    )}
                    {s.match_status === 'unmatched' && (
                      <span className="text-faint">❓ unmatched</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </StationShell>
  )
}
