'use client'
import { useEffect, useMemo, useState } from 'react'
import { PageHead, StatTile, SignPanel, SectionHeading, Chip } from '@/components/glow'

type Stats = {
  event: { id: string; name: string; event_date: string; ends_at: string } | null
  counts: {
    registered: number
    checked_in: number
    checked_out: number
    not_arrived: number
    drinks_remaining?: number
    jail_remaining?: number
    prize_wheel_used?: number
    dj_shoutout_used?: number
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
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error(`stats ${res.status}`)
        const data = (await res.json()) as Stats
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stats')
      }
    }
    load()
    const statsTimer = setInterval(load, POLL_MS)
    const clockTimer = setInterval(() => setNow(new Date()), 30_000)
    return () => {
      cancelled = true
      clearInterval(statsTimer)
      clearInterval(clockTimer)
    }
  }, [])

  const heroTitle = useMemo(() => {
    if (!stats) return 'Loading the pulse…'
    if (stats.counts.checked_in === 0) return 'Bash loading. Final walkthroughs pending.'
    return 'Bash is LIVE. Here’s the pulse.'
  }, [stats])

  const dateStrip = useMemo(() => {
    return now
      .toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
      .toUpperCase()
  }, [now])

  if (error && !stats) {
    return (
      <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-danger">
        {error}
      </p>
    )
  }

  const counts = stats?.counts
  const money = stats?.money
  const spend = stats?.spend_by_station ?? {}
  const stories = stats?.stories_by_status ?? {}
  const overdue = counts?.not_checked_out_after_end ?? 0
  const maxSpend = Math.max(1, ...Object.values(spend))

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title={heroTitle}
        sub={
          <span className="block">
            <span className="font-semibold text-paper/80">{stats?.event?.name ?? 'Spring BBQ Bash'}</span>
            <span className="text-mist"> · {dateStrip}</span>
          </span>
        }
      />

      {overdue > 0 && (
        <SignPanel tone="magenta" padding="md">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.14em] text-neon-magenta [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              ALERT · PICKUP OVERDUE
            </span>
            <Chip tone="magenta" glow>
              {overdue} KID{overdue === 1 ? '' : 'S'}
            </Chip>
            <span className="text-sm text-paper">still checked in after event end.</span>
          </div>
        </SignPanel>
      )}

      <section>
        <SectionHeading num="01" title="Attendance" tone="mint" />
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Checked in" value={counts?.checked_in ?? '—'} tone="mint" outline />
          <StatTile label="Registered" value={counts?.registered ?? '—'} tone="cyan" outline />
          <StatTile label="Checked out" value={counts?.checked_out ?? '—'} tone="uv" outline />
          <StatTile label="Not arrived" value={counts?.not_arrived ?? '—'} tone="gold" outline />
        </div>
      </section>

      <section>
        <SectionHeading num="02" title="Tickets & photos" tone="gold" />
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Drinks left"      value={counts?.drinks_remaining ?? '—'}  tone="cyan"    outline />
          <StatTile label="Jail left"        value={counts?.jail_remaining ?? '—'}    tone="magenta" outline />
          <StatTile label="Prize wheel used" value={counts?.prize_wheel_used ?? '—'}  tone="gold"    outline />
          <StatTile label="Photos taken"     value={counts?.photos ?? '—'}            tone="uv"      outline />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SignPanel tone="uv" padding="lg">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-neon-uv [font-family:var(--font-mono),JetBrains_Mono,monospace]">
            SPEND · BY STATION
          </span>
          {Object.keys(spend).length === 0 ? (
            <p className="mt-4 text-sm text-mist">No spends yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {Object.entries(spend)
                .sort(([, a], [, b]) => b - a)
                .map(([station, tickets]) => (
                  <li key={station} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 capitalize text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace] text-xs uppercase tracking-[0.1em]">
                      {station.replace(/_/g, ' ')}
                    </span>
                    <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-ink-3">
                      <span
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-magenta via-neon-uv to-neon-cyan shadow-[0_0_12px_rgba(155,92,255,.5)]"
                        style={{ width: `${(tickets / maxSpend) * 100}%` }}
                      />
                    </span>
                    <span className="w-10 text-right tabular-nums font-display font-semibold text-paper">{tickets}</span>
                  </li>
                ))}
            </ul>
          )}
        </SignPanel>

        <div className="flex flex-col gap-4">
          <SignPanel tone="cyan" padding="md">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-neon-cyan [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              STORIES · {Object.values(stories).reduce((a, b) => a + b, 0) || 0} TOTAL
            </span>
            {Object.keys(stories).length === 0 ? (
              <p className="mt-3 text-sm text-mist">No stories yet.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {Object.entries(stories).map(([status, count]) => (
                  <li key={status}>
                    <Chip tone={storyTone(status)}>
                      {count} {status.replace(/_/g, ' ')}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </SignPanel>

          <SignPanel tone="mint" padding="md">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-neon-mint [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              MONEY · TOTALS
            </span>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <MoneyRow label="FACTS charged" value={money ? `$${money.facts_total.toFixed(2)}` : '—'} />
              <MoneyRow label="Cash collected" value={money ? `$${money.cash_total.toFixed(2)}` : '—'} />
              <MoneyRow label="Venmo collected" value={money ? `$${money.venmo_total.toFixed(2)}` : '—'} />
              <MoneyRow label="Comp reloads" value={money ? String(money.comp_count) : '—'} />
            </ul>
          </SignPanel>
        </div>
      </div>

      {error && stats && (
        <p className="text-xs text-warn [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          Last refresh failed: {error} — showing cached values.
        </p>
      )}
    </div>
  )
}

function storyTone(status: string): 'mint' | 'gold' | 'magenta' | 'cyan' | 'quiet' {
  switch (status) {
    case 'auto_approved':
    case 'approved':
    case 'sent':
      return 'mint'
    case 'needs_review':
      return 'gold'
    case 'failed':
    case 'error':
      return 'magenta'
    case 'pending':
      return 'cyan'
    default:
      return 'quiet'
  }
}

function MoneyRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace] text-xs uppercase tracking-[0.1em]">
        {label}
      </span>
      <span className="font-display font-semibold tabular-nums text-paper">{value}</span>
    </li>
  )
}
