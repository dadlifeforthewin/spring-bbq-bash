'use client'
import { useEffect, useState } from 'react'

type Photo = {
  id: string
  storage_path: string
  signed_url: string | null
  taken_at: string
  volunteer_name: string | null
  capture_mode: string
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [captureMode, setCaptureMode] = useState<'all' | 'station_scan' | 'roaming_vision'>('all')
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
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">Photos</h1>
        <p className="text-slate-500">Signed URLs expire every hour. Delete removes the image from Storage too.</p>
      </header>

      <div className="flex gap-3">
        <select value={captureMode} onChange={(e) => setCaptureMode(e.target.value as typeof captureMode)}
          aria-label="filter capture mode"
          className="rounded border px-3 py-2">
          <option value="all">All modes</option>
          <option value="station_scan">Station scan</option>
          <option value="roaming_vision">Roaming vision</option>
        </select>
        <button type="button" onClick={load} disabled={busy}
          className="rounded bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
          Refresh
        </button>
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-slate-500">No photos yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded border border-slate-200 bg-white">
              {p.signed_url ? (
                <a href={p.signed_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.signed_url} alt="" className="h-48 w-full object-cover" />
                </a>
              ) : (
                <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">No preview</div>
              )}
              <div className="space-y-2 p-3 text-xs text-slate-600">
                <div>
                  {new Date(p.taken_at).toLocaleString()}
                  {p.volunteer_name && ` · ${p.volunteer_name}`}
                </div>
                <div className="capitalize">{p.capture_mode.replace(/_/g, ' ')}</div>
                <button type="button" onClick={() => deletePhoto(p.id)}
                  className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
