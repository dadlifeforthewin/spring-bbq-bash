'use client'
import { useEffect, useState } from 'react'

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

const FILTERS = ['pending_review', 'unmatched', 'rejected', 'auto', 'confirmed'] as const

export default function PhotoQueue() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]>('pending_review')
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

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">Photo queue</h1>
        <p className="text-slate-500">Confirm vision-suggested matches, or tag unmatched photos manually.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`rounded px-3 py-1 text-sm font-bold ${
              status === s ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-slate-500">{busy ? 'Loading…' : 'Nothing here.'}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded border border-slate-200 bg-white">
              {p.signed_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.signed_url} alt="" className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center bg-slate-100 text-slate-400">No preview</div>
              )}
              <div className="space-y-2 p-3 text-sm">
                <div className="text-xs text-slate-500">
                  {new Date(p.taken_at).toLocaleString()}
                  {p.match_confidence != null && ` · best ${Math.round(p.match_confidence * 100)}%`}
                </div>
                {p.candidates.length === 0 ? (
                  <p className="text-slate-500">No vision candidates — tag manually below (coming soon).</p>
                ) : (
                  <ul className="space-y-1">
                    {p.candidates.map((c) => (
                      <li key={c.child_id} className="flex items-center gap-2">
                        <span className="flex-1">
                          <strong>{c.first_name}</strong> · {Math.round(c.confidence * 100)}%
                          <div className="text-xs text-slate-500">{c.reasoning}</div>
                        </span>
                        {status === 'pending_review' && (
                          <button type="button" onClick={() => decide(p.id, 'confirm', c.child_id)}
                            disabled={busy}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50">
                            Confirm
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {status === 'pending_review' && (
                  <button type="button" onClick={() => decide(p.id, 'reject')}
                    disabled={busy}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50">
                    Reject all
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
