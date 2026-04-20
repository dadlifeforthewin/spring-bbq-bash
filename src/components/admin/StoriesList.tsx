'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PageHead, Chip, Button } from '@/components/glow'

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
const POLL_MS = 10_000

type StatusTone = 'mint' | 'gold' | 'magenta' | 'cyan' | 'quiet'

function statusTone(status: string): StatusTone {
  switch (status) {
    case 'auto_approved':
    case 'approved':
    case 'sent':
      return 'mint'
    case 'needs_review':
      return 'gold'
    case 'skipped':
    case 'failed':
    case 'error':
      return 'magenta'
    case 'pending':
      return 'cyan'
    default:
      return 'quiet'
  }
}

function scoreTone(score: number): 'mint' | 'gold' | 'danger' {
  if (score >= 0.8) return 'mint'
  if (score >= 0.6) return 'gold'
  return 'danger'
}

export default function StoriesList() {
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null)
  const cancelRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stories?status=${encodeURIComponent(status)}`)
      if (!res.ok) { if (!cancelRef.current) setError('Load failed'); return }
      const body = await res.json()
      if (!cancelRef.current) { setError(null); setRows(body.stories); setLastLoadedAt(new Date()) }
    } finally {
      if (!cancelRef.current) setLoading(false)
    }
  }, [status])

  useEffect(() => {
    cancelRef.current = false
    load()
    return () => { cancelRef.current = true }
  }, [load])

  const hasPending = rows.some((r) => r.status === 'pending')
  const pendingCount = rows.filter((r) => r.status === 'pending').length

  useEffect(() => {
    if (!hasPending) return
    const id = setInterval(() => { load() }, POLL_MS)
    return () => clearInterval(id)
  }, [hasPending, load])

  const rightSlot = (
    <>
      {hasPending && <Chip tone="gold" glow>AUTO · 10s</Chip>}
      {lastLoadedAt && !hasPending && (
        <Chip tone="quiet">UPDATED {lastLoadedAt.toLocaleTimeString()}</Chip>
      )}
      <Button tone="ghost" size="sm" onClick={load} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </Button>
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Stories"
        sub={
          <span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neon-cyan [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              STORIES · REVIEW QUEUE
            </span>
            <span className="text-mist"> — {pendingCount} pending</span>
          </span>
        }
        right={rightSlot}
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Chip
            key={s}
            tone={status === s ? 'cyan' : 'quiet'}
            glow={status === s}
            onClick={() => setStatus(s)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setStatus(s)
              }
            }}
            className="cursor-pointer select-none"
          >
            {s.replace(/_/g, ' ')}
          </Chip>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-ink-hair bg-ink-2/40 px-4 py-6 text-sm text-mist">
          {loading ? 'Loading…' : 'No stories match.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const scoreNum = r.auto_check_score == null ? null : Number(r.auto_check_score)
            const name = r.children
              ? `${r.children.first_name} ${r.children.last_name}`
              : '—'
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/stories/${r.id}`}
                  className="group flex flex-wrap items-center gap-3 rounded-xl border border-ink-hair bg-ink-2/60 px-4 py-3 transition hover:border-neon-cyan/60 hover:bg-ink-3/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-semibold tracking-tight text-paper group-hover:text-neon-cyan">
                      {name}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-faint [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                      {r.generated_at
                        ? `GEN ${new Date(r.generated_at).toLocaleString()}`
                        : 'NOT YET GENERATED'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip tone={statusTone(r.status)}>
                      {r.status.replace(/_/g, ' ')}
                    </Chip>
                    <Chip tone="quiet">
                      {r.word_count ?? '—'} W
                    </Chip>
                    <Chip tone="quiet">
                      {r.photo_count ?? '—'} PH
                    </Chip>
                  </div>

                  <div className="shrink-0">
                    {scoreNum == null ? (
                      <Chip tone="quiet">SCORE —</Chip>
                    ) : (
                      <Chip tone={scoreTone(scoreNum)} glow={scoreNum >= 0.8}>
                        {scoreNum.toFixed(2)}
                      </Chip>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
