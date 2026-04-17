'use client'
import { useEffect, useRef, useState } from 'react'
import PhotoViewfinder, { PhotoViewfinderHandle } from './PhotoViewfinder'

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
      if (!scanned.some((k) => k.id === kid.id)) {
        setScanned([...scanned, kid])
      }
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
      <main className="mx-auto max-w-xl p-6">
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No station selected. <a href="/station" className="underline">Pick a station.</a>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Photo station</h1>
        <p className="text-slate-600">Scan the kids in frame, then press the shutter.</p>
      </header>

      <form onSubmit={addScan} className="flex gap-2">
        <input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="Scan or paste QR"
          aria-label="QR code"
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50">
          Add to frame
        </button>
      </form>

      {lookupError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{lookupError}</p>}

      {scanned.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">In this shot</h2>
          <ul className="flex flex-wrap gap-2">
            {scanned.map((k) => (
              <li key={k.id}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                  k.photo_consent_app ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                }`}>
                <span>{k.first_name} {k.last_name}</span>
                <button type="button" onClick={() => removeScan(k.id)} aria-label={`remove-${k.id}`}
                  className="text-xs font-bold">✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PhotoViewfinder ref={viewfinderRef} facingMode="environment" />

      <label className="block">
        <span className="block text-sm">Your name (staff, optional)</span>
        <input type="text" value={volunteerName}
          onChange={(e) => setVolunteerName(e.target.value)}
          aria-label="volunteer name"
          className="w-full rounded border px-3 py-2" />
      </label>

      <button type="button" onClick={capture}
        disabled={busy || scanned.length === 0 || anyBlocked}
        className="w-full rounded bg-fuchsia-600 py-4 text-lg font-black text-white disabled:opacity-50">
        {busy ? 'Uploading…' : `📸 Shutter (${scanned.length})`}
      </button>

      {uploadError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p>}
      {lastUpload && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Uploaded · tagged {lastUpload.count} {lastUpload.count === 1 ? 'kid' : 'kids'}.
        </p>
      )}

      {anyBlocked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="photo consent block"
          className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 p-6 text-white"
        >
          <div className="max-w-md space-y-4 text-center">
            <h3 className="text-3xl font-black">🚫 NO PHOTOS</h3>
            <p>
              One of the scanned kids doesn&apos;t have photo consent. Remove them from the list to take a
              shot of the others, or step out of frame.
            </p>
            <button type="button"
              onClick={() => setScanned(scanned.filter((k) => k.photo_consent_app))}
              className="rounded bg-white px-4 py-2 font-bold text-red-900">
              Remove no-consent kids
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
