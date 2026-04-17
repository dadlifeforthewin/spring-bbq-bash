'use client'
import { useState } from 'react'
import ChildCard from './ChildCard'

type Lookup = {
  child: {
    id: string
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
    allergies: string | null
    photo_consent_app: boolean
    ticket_balance: number
    checked_in_at: string | null
  }
  primary_parent: { name: string; phone: string | null } | null
}

type DropoffType = 'both_parents' | 'one_parent' | 'grandparent' | 'other_approved_adult'

const DROPOFF_OPTIONS: { value: DropoffType; label: string }[] = [
  { value: 'both_parents', label: 'Both parents' },
  { value: 'one_parent', label: 'One parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other_approved_adult', label: 'Other approved adult' },
]

export default function CheckInStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [dropoff, setDropoff] = useState<DropoffType | null>(null)
  const [staffName, setStaffName] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null)
    setCheckInError(null)
    setSuccess(false)
    setData(null)
    setDropoff(null)
    if (!qr.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setLookupError(err.error ?? 'Lookup failed')
        return
      }
      const body = (await res.json()) as Lookup
      setData(body)
    } finally {
      setBusy(false)
    }
  }

  async function doCheckIn() {
    if (!data || !dropoff) return
    setCheckInError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: data.child.id,
          dropoff_type: dropoff,
          staff_name: staffName,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setCheckInError(body.error ?? 'Check-in failed')
        return
      }
      setSuccess(true)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setQr('')
    setData(null)
    setDropoff(null)
    setStaffName('')
    setLookupError(null)
    setCheckInError(null)
    setSuccess(false)
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Check-In</h1>
        <p className="text-slate-600">Scan wristband or paste QR code below.</p>
      </header>

      <form onSubmit={doLookup} className="flex gap-2">
        <input
          type="text"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
          placeholder="QR code / child UUID"
          aria-label="QR code"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Look up
        </button>
      </form>

      {lookupError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{lookupError}</p>
      )}

      {data && (
        <div className="space-y-4">
          <ChildCard
            child={{
              first_name: data.child.first_name,
              last_name: data.child.last_name,
              age: data.child.age,
              grade: data.child.grade,
              allergies: data.child.allergies,
              photo_consent_app: data.child.photo_consent_app,
              ticket_balance: data.child.ticket_balance,
            }}
            primary_parent={data.primary_parent ?? { name: '—', phone: null }}
          />

          {data.child.checked_in_at ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Already checked in at {new Date(data.child.checked_in_at).toLocaleString()}.
            </p>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">Dropoff</legend>
                {DROPOFF_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="dropoff"
                      value={o.value}
                      checked={dropoff === o.value}
                      onChange={() => setDropoff(o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </fieldset>

              <label className="block">
                <span className="block text-sm">Your name (staff)</span>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  aria-label="staff name"
                  className="w-full rounded border px-3 py-2"
                />
              </label>

              <button
                type="button"
                onClick={doCheckIn}
                disabled={!dropoff || busy}
                className="w-full rounded bg-fuchsia-600 py-3 font-bold text-white disabled:opacity-50"
              >
                {busy ? 'Checking in…' : 'Check In'}
              </button>

              {checkInError && (
                <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{checkInError}</p>
              )}
            </>
          )}

          {success && (
            <>
              <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                Checked in! Next kid?
              </p>
              <button
                type="button"
                onClick={reset}
                className="w-full rounded bg-slate-900 py-3 font-bold text-white"
              >
                Scan next wristband
              </button>
            </>
          )}
        </div>
      )}
    </main>
  )
}
