'use client'
import { useEffect, useState } from 'react'

type Stats = {
  event: { id: string; name: string; event_date: string; ends_at: string } | null
  counts: {
    registered: number
    checked_in: number
    checked_out: number
    not_arrived: number
    tickets_outstanding: number
    tickets_spent: number
    photos: number
    not_checked_out_after_end: number
  }
  spend_by_station: Record<string, number>
  money: {
    facts_total: number
    cash_total: number
    venmo_total: number
    comp_count: number
  }
  stories_by_status: Record<string, number>
}

const POLL_MS = 5000

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error(`stats ${res.status}`)
        const data = (await res.json()) as Stats
        if (!cancelled) { setStats(data); setError(null) }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stats')
      }
    }
    load()
    const t = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>
  if (!stats) return <p className="text-slate-500">Loading…</p>

  const { counts, money, spend_by_station, stories_by_status } = stats
  const maxSpend = Math.max(1, ...Object.values(spend_by_station))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">{stats.event?.name ?? 'Dashboard'}</h1>
        {stats.event?.event_date && (
          <p className="text-slate-500">{stats.event.event_date}</p>
        )}
      </header>

      {counts.not_checked_out_after_end > 0 && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <strong>⚠️ {counts.not_checked_out_after_end}</strong> kid(s) still checked in after event end.
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Registered" value={counts.registered} />
        <Stat label="Checked in" value={counts.checked_in} />
        <Stat label="Checked out" value={counts.checked_out} />
        <Stat label="Not arrived" value={counts.not_arrived} />
        <Stat label="Tickets outstanding" value={counts.tickets_outstanding} />
        <Stat label="Tickets spent" value={counts.tickets_spent} />
        <Stat label="Photos" value={counts.photos} />
        <Stat label="Comp reloads" value={money.comp_count} />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MoneyStat label="FACTS charged" value={`$${money.facts_total.toFixed(2)}`} />
        <MoneyStat label="Cash collected" value={`$${money.cash_total.toFixed(2)}`} />
        <MoneyStat label="Venmo collected" value={`$${money.venmo_total.toFixed(2)}`} />
      </section>

      <section className="space-y-2 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Spend by station</h2>
        {Object.keys(spend_by_station).length === 0 ? (
          <p className="text-sm text-slate-500">No spends yet.</p>
        ) : (
          <ul className="space-y-1">
            {Object.entries(spend_by_station)
              .sort(([, a], [, b]) => b - a)
              .map(([station, tickets]) => (
                <li key={station} className="flex items-center gap-2 text-sm">
                  <span className="w-40 shrink-0 capitalize">{station.replace(/_/g, ' ')}</span>
                  <span className="relative h-4 flex-1 overflow-hidden rounded bg-slate-100">
                    <span
                      className="absolute inset-y-0 left-0 bg-fuchsia-500"
                      style={{ width: `${(tickets / maxSpend) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right tabular-nums">{tickets}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">AI story status</h2>
        {Object.keys(stories_by_status).length === 0 ? (
          <p className="text-sm text-slate-500">No stories yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-3 text-sm">
            {Object.entries(stories_by_status).map(([status, count]) => (
              <li key={status} className="rounded bg-slate-100 px-3 py-1">
                <span className="font-semibold">{count}</span> {status.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-3xl font-black tabular-nums">{value}</div>
    </div>
  )
}

function MoneyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
      <div className="text-xs uppercase tracking-wide text-emerald-700">{label}</div>
      <div className="text-2xl font-black tabular-nums text-emerald-900">{value}</div>
    </div>
  )
}
