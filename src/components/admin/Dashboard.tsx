'use client'
import { useEffect, useState } from 'react'
import { Card, CardEyebrow } from '@/components/glow/Card'
import { Heading, Eyebrow } from '@/components/glow/Heading'

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

  if (error) return <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-danger">{error}</p>
  if (!stats) return <p className="text-mist">Loading…</p>

  const { counts, money, spend_by_station, stories_by_status } = stats
  const maxSpend = Math.max(1, ...Object.values(spend_by_station))

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Eyebrow tone="magenta">Live dashboard</Eyebrow>
        <Heading level={1} size="lg" tone="paper">
          {stats.event?.name ?? 'Spring BBQ Bash · Glow Party Edition'}
        </Heading>
        {stats.event?.event_date && (
          <p className="text-mist text-sm">{stats.event.event_date}</p>
        )}
      </header>

      {counts.not_checked_out_after_end > 0 && (
        <Card tone="glow-magenta" padded>
          <strong className="text-neon-magenta">⚠️ {counts.not_checked_out_after_end}</strong>
          <span className="text-paper"> kid(s) still checked in after event end.</span>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Registered" value={counts.registered} />
        <Stat label="Checked in" value={counts.checked_in} tone="cyan" />
        <Stat label="Checked out" value={counts.checked_out} tone="mint" />
        <Stat label="Not arrived" value={counts.not_arrived} tone="quiet" />
        <Stat label="Drinks left" value={counts.drinks_remaining ?? 0} tone="cyan" />
        <Stat label="Jail left" value={counts.jail_remaining ?? 0} tone="magenta" />
        <Stat label="Prize wheel used" value={counts.prize_wheel_used ?? 0} tone="gold" />
        <Stat label="DJ shoutouts used" value={counts.dj_shoutout_used ?? 0} tone="uv" />
        <Stat label="Tickets spent" value={counts.tickets_spent} />
        <Stat label="Photos taken" value={counts.photos} />
        <Stat label="Comp reloads" value={money.comp_count} />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MoneyStat label="FACTS charged" value={`$${money.facts_total.toFixed(2)}`} />
        <MoneyStat label="Cash collected" value={`$${money.cash_total.toFixed(2)}`} />
        <MoneyStat label="Venmo collected" value={`$${money.venmo_total.toFixed(2)}`} />
      </section>

      <Card tone="default" padded className="space-y-3">
        <CardEyebrow>Spend by station</CardEyebrow>
        {Object.keys(spend_by_station).length === 0 ? (
          <p className="text-sm text-faint">No spends yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(spend_by_station)
              .sort(([, a], [, b]) => b - a)
              .map(([station, tickets]) => (
                <li key={station} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 capitalize text-mist">{station.replace(/_/g, ' ')}</span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-ink-3">
                    <span
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-magenta via-neon-uv to-neon-cyan shadow-[0_0_12px_rgba(155,92,255,.5)]"
                      style={{ width: `${(tickets / maxSpend) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right tabular-nums text-paper font-semibold">{tickets}</span>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card tone="default" padded className="space-y-2">
        <CardEyebrow>AI story status</CardEyebrow>
        {Object.keys(stories_by_status).length === 0 ? (
          <p className="text-sm text-faint">No stories yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2 text-sm">
            {Object.entries(stories_by_status).map(([status, count]) => (
              <li key={status} className="rounded-full border border-ink-hair bg-ink-3 px-3 py-1">
                <span className="font-semibold text-paper">{count}</span>
                <span className="ml-1 text-mist">{status.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

type StatTone = 'paper' | 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'quiet'

function Stat({ label, value, tone = 'paper' }: { label: string; value: number; tone?: StatTone }) {
  const toneBorder: Record<StatTone, string> = {
    paper:   'border-ink-hair',
    magenta: 'border-neon-magenta/40 shadow-[0_0_20px_-5px_rgba(255,46,147,.4)]',
    cyan:    'border-neon-cyan/40 shadow-[0_0_20px_-5px_rgba(0,230,247,.4)]',
    uv:      'border-neon-uv/40 shadow-[0_0_20px_-5px_rgba(155,92,255,.4)]',
    gold:    'border-neon-gold/40 shadow-[0_0_20px_-5px_rgba(255,225,71,.4)]',
    mint:    'border-neon-mint/40 shadow-[0_0_20px_-5px_rgba(75,230,179,.4)]',
    quiet:   'border-ink-hair opacity-70',
  }
  const toneText: Record<StatTone, string> = {
    paper: 'text-paper', magenta: 'text-neon-magenta', cyan: 'text-neon-cyan',
    uv: 'text-neon-uv', gold: 'text-neon-gold', mint: 'text-neon-mint', quiet: 'text-paper',
  }
  return (
    <div className={`rounded-2xl border bg-ink-2/70 backdrop-blur-sm p-4 ${toneBorder[tone]}`}>
      <div className="text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className={`text-3xl font-display font-bold tabular-nums mt-1 ${toneText[tone]}`}>{value}</div>
    </div>
  )
}

function MoneyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neon-mint/30 bg-ink-2/70 p-4 shadow-[0_0_20px_-5px_rgba(75,230,179,.35)]">
      <div className="text-[10px] uppercase tracking-widest text-neon-mint">{label}</div>
      <div className="text-2xl font-display font-bold tabular-nums text-paper mt-1">{value}</div>
    </div>
  )
}
