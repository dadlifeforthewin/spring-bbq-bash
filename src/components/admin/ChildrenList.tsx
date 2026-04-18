'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Row = {
  id: string
  qr_code: string
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
  allergies: string | null
  photo_consent_app: boolean
  drink_tickets_remaining: number
  jail_tickets_remaining: number
  prize_wheel_used_at: string | null
  dj_shoutout_used_at: string | null
  checked_in_at: string | null
  checked_out_at: string | null
}

export default function ChildrenList() {
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'not_arrived' | 'checked_in' | 'checked_out'>('all')
  const [allergiesOnly, setAllergiesOnly] = useState(false)
  const [consentFilter, setConsentFilter] = useState<'any' | 'yes' | 'no'>('any')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      params.set('status', status)
      if (allergiesOnly) params.set('allergies', '1')
      if (consentFilter !== 'any') params.set('photo_consent', consentFilter)
      const res = await fetch(`/api/admin/children?${params.toString()}`)
      if (!res.ok) {
        if (!cancelled) setError('Load failed')
        return
      }
      const body = await res.json()
      if (!cancelled) { setError(null); setRows(body.children) }
    }
    const t = setTimeout(load, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, status, allergiesOnly, consentFilter])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">Children</h1>
        <p className="text-slate-500">Search, filter, tap a row to edit the profile.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or QR"
          aria-label="search children"
          className="col-span-2 rounded border px-3 py-2"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label="filter status"
          className="rounded border px-3 py-2">
          <option value="all">All</option>
          <option value="not_arrived">Not arrived</option>
          <option value="checked_in">Checked in</option>
          <option value="checked_out">Checked out</option>
        </select>
        <select value={consentFilter} onChange={(e) => setConsentFilter(e.target.value as typeof consentFilter)}
          aria-label="filter photo consent"
          className="rounded border px-3 py-2">
          <option value="any">Any consent</option>
          <option value="yes">Photos OK</option>
          <option value="no">No photos</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allergiesOnly} onChange={(e) => setAllergiesOnly(e.target.checked)} />
          <span>Allergies only</span>
        </label>
      </div>

      {error && <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink-3/60 text-left uppercase tracking-widest text-[10px] text-faint">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Age/Grade</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Perks left</th>
              <th className="px-3 py-2">Consent</th>
              <th className="px-3 py-2">Allergies</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-faint">No children match.</td></tr>
            )}
            {rows.map((r) => {
              const statusLabel = r.checked_out_at ? 'out' : r.checked_in_at ? 'in' : 'not arrived'
              return (
                <tr key={r.id} className="border-t border-ink-hair/60 hover:bg-ink-3/40">
                  <td className="px-3 py-2">
                    <Link href={`/admin/children/${r.id}`} className="font-semibold text-neon-magenta hover:text-glow-magenta">
                      {r.first_name} {r.last_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-mist">
                    {r.age ?? '—'}{r.grade ? ` · ${r.grade}` : ''}
                  </td>
                  <td className="px-3 py-2 text-mist capitalize">{statusLabel}</td>
                  <td className="px-3 py-2 tabular-nums text-paper">
                    <span className="text-neon-cyan">{r.drink_tickets_remaining}</span>
                    <span className="text-faint mx-1">·</span>
                    <span className="text-neon-magenta">{r.jail_tickets_remaining}</span>
                    <span className="text-faint mx-1">·</span>
                    <span className={r.prize_wheel_used_at ? 'text-faint line-through' : 'text-neon-gold'}>🎡</span>
                    <span className="text-faint mx-1">·</span>
                    <span className={r.dj_shoutout_used_at ? 'text-faint line-through' : 'text-neon-uv'}>📻</span>
                  </td>
                  <td className="px-3 py-2">
                    {r.photo_consent_app ? (
                      <span className="rounded-full border border-neon-mint/60 bg-neon-mint/10 px-2 py-0.5 text-[10px] font-bold text-neon-mint">YES</span>
                    ) : (
                      <span className="rounded-full border border-danger/60 bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">NO</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-mist">{r.allergies || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
