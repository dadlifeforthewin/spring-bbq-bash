'use client'
import { useRef, useState } from 'react'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'

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
          s.map((shot) => (shot.photo_id === placeholderId
            ? { ...shot, state: 'error', error: body.error ?? 'Upload failed' }
            : shot)),
        )
        return
      }

      setShots((s) =>
        s.map((shot) => (shot.photo_id === placeholderId
          ? { ...shot, photo_id: body.photo_id, state: 'processing' }
          : shot)),
      )

      // Poll for match status a few times
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
      const final = body.match_status && body.match_status !== 'pending_review' && body.match_status !== 'unmatched'
      setShots((s) =>
        s.map((shot) => (shot.photo_id === photoId
          ? { ...shot, state: 'done', match_status: body.match_status, matched_name: body.matched_name ?? null }
          : shot)),
      )
      if (body.match_status === 'auto' || body.match_status === 'unmatched' || final) return
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Roaming photographer</h1>
        <p className="text-slate-500">
          Shoot candid moments — Claude vision will auto-tag kids with matching consent.
        </p>
      </header>

      <label className="block">
        <span className="block text-sm">Your name (staff, optional)</span>
        <input type="text" value={volunteerName}
          onChange={(e) => setVolunteerName(e.target.value)}
          aria-label="volunteer name"
          className="w-full rounded border px-3 py-2" />
      </label>

      <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />

      <button type="button" onClick={capture} disabled={busy}
        className="w-full rounded bg-fuchsia-600 py-4 text-lg font-black text-white disabled:opacity-50">
        {busy ? 'Uploading…' : '📸 Shutter'}
      </button>

      {shots.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-600">Recent shots</h2>
          <ul className="space-y-1">
            {shots.map((s) => (
              <li key={s.photo_id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="text-slate-500">{new Date(s.taken_at).toLocaleTimeString()}</span>{' '}
                {s.state === 'uploading' && <span>uploading…</span>}
                {s.state === 'processing' && <span>analyzing…</span>}
                {s.state === 'error' && <span className="text-red-600">error: {s.error}</span>}
                {s.state === 'done' && (
                  <span>
                    {s.match_status === 'auto' && <span className="text-green-700 font-semibold">✅ tagged {s.matched_name ?? ''}</span>}
                    {s.match_status === 'pending_review' && <span className="text-amber-700 font-semibold">🔍 pending review</span>}
                    {s.match_status === 'unmatched' && <span className="text-slate-500">❓ unmatched</span>}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
