'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Row = {
  id: string
  child_id: string
  status: string
  generated_at: string | null
  word_count: number | null
  photo_count: number | null
  auto_check_score: string | number | null
  children: {
    first_name: string
    last_name: string
    age: number | null
    grade: string | null
  } | null
}

const STATUS_FILTERS = ['all', 'pending', 'needs_review', 'auto_approved', 'approved', 'sent', 'skipped'] as const

export default function StoriesList() {
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await fetch(`/api/stories?status=${encodeURIComponent(status)}`)
      if (!res.ok) { if (!cancelled) setError('Load failed'); return }
      const body = await res.json()
      if (!cancelled) { setError(null); setRows(body.stories) }
    }
    load()
    return () => { cancelled = true }
  }, [status])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">AI stories</h1>
        <p className="text-slate-500">Review generated keepsake stories before they go out in tomorrow morning&apos;s email.</p>
      </header>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`rounded px-3 py-1 text-sm font-bold ${
              status === s ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Child</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Words</th>
              <th className="px-3 py-2">Photos</th>
              <th className="px-3 py-2">Generated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-slate-500">No stories match.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/stories/${r.id}`} className="font-semibold text-fuchsia-700">
                    {r.children ? `${r.children.first_name} ${r.children.last_name}` : '—'}
                  </Link>
                </td>
                <td className="px-3 py-2 capitalize">{r.status.replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.auto_check_score == null ? '—' : Number(r.auto_check_score).toFixed(2)}
                </td>
                <td className="px-3 py-2 tabular-nums">{r.word_count ?? '—'}</td>
                <td className="px-3 py-2 tabular-nums">{r.photo_count ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {r.generated_at ? new Date(r.generated_at).toLocaleString() : 'not yet'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
