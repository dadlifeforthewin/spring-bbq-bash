'use client'
import { useEffect, useState } from 'react'
import { Button, Chip, GlyphGlow, PageHead, PhotoGlyph } from '@/components/glow'

type Photo = {
  id: string
  storage_path: string
  signed_url: string | null
  taken_at: string
  volunteer_name: string | null
  capture_mode: string
}

type CaptureFilter = 'all' | 'station_scan' | 'roaming_vision'

const CAPTURE_FILTERS: { key: CaptureFilter; label: string }[] = [
  { key: 'all', label: 'All modes' },
  { key: 'station_scan', label: 'Station scan' },
  { key: 'roaming_vision', label: 'Roaming vision' },
]

const CAPTURE_TONE: Record<string, 'cyan' | 'uv' | 'gold'> = {
  station_scan: 'cyan',
  roaming_vision: 'uv',
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [captureMode, setCaptureMode] = useState<CaptureFilter>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setBusy(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (captureMode !== 'all') params.set('capture_mode', captureMode)
      const res = await fetch(`/api/admin/photos?${params.toString()}`)
      if (!res.ok) { setError('Load failed'); return }
      const body = await res.json()
      setPhotos(body.photos)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [captureMode])

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo for good?')) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/photos/${id}`, { method: 'DELETE' })
      if (!res.ok) { setError('Delete failed'); return }
      setPhotos(photos.filter((p) => p.id !== id))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Photos"
        sub="Signed URLs expire every hour. Delete removes the image from Storage too."
        right={
          <Chip tone="cyan" glow>
            TOTAL · {photos.length}
          </Chip>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {CAPTURE_FILTERS.map((f) => {
          const active = captureMode === f.key
          return (
            <Chip
              key={f.key}
              tone={active ? 'cyan' : 'quiet'}
              glow={active}
              onClick={() => setCaptureMode(f.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setCaptureMode(f.key)
                }
              }}
              className="cursor-pointer select-none"
            >
              {f.label}
            </Chip>
          )
        })}
        <div className="ml-auto">
          <Button tone="ghost" size="sm" onClick={load} disabled={busy}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-mist text-sm [font-family:var(--font-mono),JetBrains_Mono,monospace] uppercase tracking-[0.12em]">
          {busy ? 'Loading…' : 'No photos yet.'}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => {
            const tone = CAPTURE_TONE[p.capture_mode] ?? 'gold'
            const captureLabel = p.capture_mode.replace(/_/g, ' ')
            return (
              <li key={p.id}>
                <div className="flex flex-col gap-2 rounded-xl border border-ink-hair bg-ink-2/60 p-1.5">
                  <div
                    className={`relative overflow-hidden rounded-lg aspect-square border bg-ink/60 ${
                      tone === 'cyan'
                        ? 'border-neon-cyan/40'
                        : tone === 'uv'
                        ? 'border-neon-uv/40'
                        : 'border-neon-gold/40'
                    }`}
                  >
                    {p.signed_url ? (
                      <a
                        href={p.signed_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-full w-full"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.signed_url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <GlyphGlow tone={tone} size={72}>
                          <PhotoGlyph size={72} />
                        </GlyphGlow>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace] truncate">
                      {new Date(p.taken_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      {new Date(p.taken_at).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <Chip tone={tone}>{captureLabel}</Chip>
                  </div>

                  {p.volunteer_name && (
                    <p className="px-1.5 text-[11px] text-mist truncate">by {p.volunteer_name}</p>
                  )}

                  <div className="flex justify-end px-1 pb-1">
                    <Button
                      tone="danger"
                      size="sm"
                      onClick={() => deletePhoto(p.id)}
                      disabled={busy}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
