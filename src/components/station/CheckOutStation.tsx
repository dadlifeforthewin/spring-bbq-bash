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
    checked_out_at: string | null
  }
  primary_parent: { name: string; phone: string | null } | null
  secondary_parent: { name: string; phone: string | null } | null
  pickup_authorizations: { name: string; relationship: string | null }[]
}

type PickupOption = { name: string; relationship: string | null; kind: 'primary' | 'secondary' | 'approved' }

export default function CheckOutStation() {
  const [qr, setQr] = useState('')
  const [data, setData] = useState<Lookup | null>(null)
  const [selected, setSelected] = useState<PickupOption | null>(null)
  const [staffName, setStaffName] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    setLookupError(null)
    setSubmitError(null)
    setSuccess(false)
    setData(null)
    setSelected(null)
    if (!qr.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/children/by-qr/${encodeURIComponent(qr.trim())}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setLookupError(err.error ?? 'Lookup failed')
        return
      }
      setData(await res.json())
    } finally {
      setBusy(false)
    }
  }

  async function doCheckOut() {
    if (!data || !selected || !staffName.trim()) return
    setSubmitError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: data.child.id,
          checked_out_to_name: selected.name,
          checked_out_by_staff_name: staffName.trim(),
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setSubmitError(body.error ?? 'Check-out failed')
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
    setSelected(null)
    setStaffName('')
    setLookupError(null)
    setSubmitError(null)
    setSuccess(false)
  }

  const options: PickupOption[] = data
    ? [
        ...(data.primary_parent ? [{ name: data.primary_parent.name, relationship: 'Primary parent', kind: 'primary' as const }] : []),
        ...(data.secondary_parent ? [{ name: data.secondary_parent.name, relationship: 'Secondary parent', kind: 'secondary' as const }] : []),
        ...data.pickup_authorizations.map((p) => ({ name: p.name, relationship: p.relationship, kind: 'approved' as const })),
      ]
    : []

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Check-Out</h1>
        <p className="text-slate-600">Scan wristband, confirm who&apos;s picking up, enter your name.</p>
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
        <button type="submit" disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50">
          Look up
        </button>
      </form>

      {lookupError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{lookupError}</p>}

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

          {data.child.checked_out_at ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Already checked out at {new Date(data.child.checked_out_at).toLocaleString()}.
            </p>
          ) : !data.child.checked_in_at ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This kid isn&apos;t checked in yet — send them to the check-in station.
            </p>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">Who&apos;s picking up?</legend>
                <div className="grid gap-2">
                  {options.map((o) => {
                    const active = selected?.name === o.name && selected?.kind === o.kind
                    return (
                      <button
                        key={`${o.kind}:${o.name}`}
                        type="button"
                        onClick={() => setSelected(o)}
                        aria-pressed={active}
                        className={`rounded border-2 px-3 py-2 text-left font-semibold ${
                          active ? 'border-fuchsia-600 bg-fuchsia-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>{o.name}</div>
                        {o.relationship && <div className="text-xs text-slate-500">{o.relationship}</div>}
                      </button>
                    )
                  })}
                </div>
                {options.length === 0 && (
                  <p className="text-sm text-slate-500">No pickup options on file — contact the school admin.</p>
                )}
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
                onClick={doCheckOut}
                disabled={!selected || !staffName.trim() || busy}
                className="w-full rounded bg-fuchsia-600 py-3 font-bold text-white disabled:opacity-50"
              >
                {busy ? 'Checking out…' : 'Release to selected'}
              </button>

              {submitError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
            </>
          )}

          {success && (
            <>
              <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                Checked out safely. See you next time!
              </p>
              <button type="button" onClick={reset}
                className="w-full rounded bg-slate-900 py-3 font-bold text-white">
                Next kid
              </button>
            </>
          )}
        </div>
      )}
    </main>
  )
}
