'use client'
import { useEffect, useState } from 'react'
import { Button, Chip, GlyphGlow, PageHead, PhotoGlyph, SignPanel } from '@/components/glow'

type Candidate = {
  child_id: string
  first_name: string
  confidence: number
  reasoning: string
}

type QueuePhoto = {
  id: string
  signed_url: string | null
  taken_at: string
  match_status: string
  match_confidence: number | null
  candidates: Candidate[]
}

type FilterKey = 'pending_review' | 'unmatched' | 'rejected' | 'auto' | 'confirmed'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'pending_review', label: 'Pending' },
  { key: 'unmatched', label: 'Unmatched' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'auto', label: 'Auto' },
  { key: 'confirmed', label: 'Confirmed' },
]

type ChipTone = 'gold' | 'cyan' | 'danger' | 'uv' | 'mint'
type PanelTone = 'gold' | 'cyan' | 'magenta' | 'uv' | 'mint'

const CHIP_TONE: Record<FilterKey, ChipTone> = {
  pending_review: 'gold',
  unmatched: 'cyan',
  rejected: 'danger',
  auto: 'uv',
  confirmed: 'mint',
}

const PANEL_TONE: Record<FilterKey, PanelTone> = {
  pending_review: 'gold',
  unmatched: 'cyan',
  rejected: 'magenta',
  auto: 'uv',
  confirmed: 'mint',
}

export default function PhotoQueue() {
  const [status, setStatus] = useState<FilterKey>('pending_review')
  const [photos, setPhotos] = useState<QueuePhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/photos/queue?status=${encodeURIComponent(status)}`)
      if (!res.ok) { setError('Load failed'); return }
      const body = await res.json()
      setPhotos(body.photos)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [status])

  async function decide(photoId: string, action: 'confirm' | 'reject', childId?: string) {
    setBusy(true)
    try {
      await fetch('/api/admin/photos/queue/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, action, child_id: childId }),
      })
      setPhotos(photos.filter((p) => p.id !== photoId))
    } finally {
      setBusy(false)
    }
  }

  const chipTone = CHIP_TONE[status]
  const panelTone = PANEL_TONE[status]
  const headLabel = FILTERS.find((f) => f.key === status)?.label.toUpperCase() ?? 'QUEUE'

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Photo queue"
        sub="Confirm vision-suggested matches, or tag unmatched photos manually."
        right={
          <Chip tone={chipTone} glow>
            {headLabel} · {photos.length}
          </Chip>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.key
          return (
            <Chip
              key={f.key}
              tone={active ? CHIP_TONE[f.key] : 'quiet'}
              glow={active}
              onClick={() => setStatus(f.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setStatus(f.key)
                }
              }}
              className="cursor-pointer select-none"
            >
              {f.label}
            </Chip>
          )
        })}
      </div>

      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-mist text-sm [font-family:var(--font-mono),JetBrains_Mono,monospace] uppercase tracking-[0.12em]">
          {busy ? 'Loading…' : 'Nothing here.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {photos.map((p) => (
            <li key={p.id}>
              <SignPanel tone={panelTone} padding="sm">
                <div className="flex flex-col gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-ink-hair bg-ink-2/60 aspect-video">
                    {p.signed_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.signed_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <GlyphGlow tone={panelTone} size={96}>
                          <PhotoGlyph size={96} />
                        </GlyphGlow>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                      {new Date(p.taken_at).toLocaleString()}
                    </span>
                    <Chip tone={chipTone}>
                      {p.match_confidence != null
                        ? `BEST ${Math.round(p.match_confidence * 100)}%`
                        : headLabel}
                    </Chip>
                  </div>

                  {p.candidates.length === 0 ? (
                    <p className="text-sm text-mist">
                      No vision candidates — tag manually below (coming soon).
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {p.candidates.map((c) => (
                        <li
                          key={c.child_id}
                          className="flex items-start gap-3 rounded-lg border border-ink-hair bg-ink/40 px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-semibold text-paper">{c.first_name}</span>
                              <Chip tone={c.confidence >= 0.75 ? 'mint' : c.confidence >= 0.5 ? 'gold' : 'quiet'}>
                                {Math.round(c.confidence * 100)}%
                              </Chip>
                            </div>
                            <p className="mt-1 text-xs text-mist leading-snug">{c.reasoning}</p>
                          </div>
                          {status === 'pending_review' && (
                            <Button
                              tone="mint"
                              size="sm"
                              onClick={() => decide(p.id, 'confirm', c.child_id)}
                              disabled={busy}
                            >
                              Confirm
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {status === 'pending_review' && (
                    <div className="flex justify-end">
                      <Button
                        tone="danger"
                        size="sm"
                        onClick={() => decide(p.id, 'reject')}
                        disabled={busy}
                      >
                        Reject all
                      </Button>
                    </div>
                  )}
                </div>
              </SignPanel>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
