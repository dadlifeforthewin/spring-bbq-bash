'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  PageHead,
  HelpLink,
  SignPanel,
  BigToggle,
  Chip,
} from '@/components/glow'

type CleanupTask = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

type StateResponse = {
  tasks: CleanupTask[]
  completed_task_ids: string[]
}

type ToggleResponse = {
  ok: true
  remaining: number
  total: number
}

export default function CleanupStation() {
  const [tasks, setTasks] = useState<CleanupTask[]>([])
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initial fetch — server is the source of truth.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/stations/cleanup/state')
        if (!res.ok) {
          if (!cancelled) {
            setError('Could not load cleanup tasks')
            setLoaded(true)
          }
          return
        }
        const body = (await res.json()) as StateResponse
        if (cancelled) return
        setTasks(body.tasks)
        setCompleted(new Set(body.completed_task_ids))
        setLoaded(true)
      } catch {
        if (!cancelled) {
          setError('Network error')
          setLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Derived counts — display math. Authoritative `remaining` comes from the
  // server after every toggle; between responses we trust the local Set.
  const total = tasks.length
  const doneCount = completed.size

  async function onToggle(task: CleanupTask, next: boolean) {
    // Optimistic flip.
    setError(null)
    setCompleted((prev) => {
      const n = new Set(prev)
      if (next) n.add(task.id)
      else n.delete(task.id)
      return n
    })
    try {
      const res = await fetch('/api/stations/cleanup/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          completed: next,
        }),
      })
      if (!res.ok) {
        // Revert.
        setCompleted((prev) => {
          const n = new Set(prev)
          if (next) n.delete(task.id)
          else n.add(task.id)
          return n
        })
        setError("Couldn't save — try again")
        return
      }
      // Server-sourced reconcile isn't strictly needed (the local Set is
      // correct for single-user taps), but consume the body to keep the
      // contract honest.
      await res.json().catch(() => ({}) as ToggleResponse)
    } catch {
      setCompleted((prev) => {
        const n = new Set(prev)
        if (next) n.delete(task.id)
        else n.add(task.id)
        return n
      })
      setError('Network error — try again')
    }
  }

  const chipLabel = `${doneCount}/${total} DONE`

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.sort_order - b.sort_order),
    [tasks],
  )

  return (
    <main className="flex flex-col gap-5 pb-16">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="CLEANUP CREW"
        sub="Check items as you finish. Toggle off if something was marked by mistake."
        right={<><Chip tone="gold" glow>{chipLabel}</Chip><HelpLink /></>}
      />

      {/* Dashed hairline divider below the head */}
      <div aria-hidden className="border-t border-dashed border-ink-hair/60" />

      {loaded && tasks.length === 0 ? (
        <SignPanel tone="gold">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neon-gold [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              Empty checklist
            </div>
            <p className="font-display text-xl text-paper">No cleanup tasks configured</p>
            <p className="text-sm text-mist">
              Open <code className="rounded bg-ink-2 px-1.5 py-0.5 text-neon-cyan">/admin/cleanup</code> to add them.
            </p>
          </div>
        </SignPanel>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedTasks.map((task) => {
            const on = completed.has(task.id)
            return (
              <div
                key={task.id}
                className={on ? 'opacity-95' : ''}
                data-testid={`cleanup-row-${task.id}`}
              >
                <BigToggle
                  tone="gold"
                  checked={on}
                  onChange={(next) => onToggle(task, next)}
                  label={
                    <span className={on ? 'line-through decoration-mist/60 text-paper/75 uppercase tracking-wide' : 'uppercase tracking-wide'}>
                      {task.label}
                    </span>
                  }
                  sub={task.sub ?? undefined}
                />
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <SignPanel tone="magenta">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neon-magenta [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              Heads up
            </div>
            <p className="text-sm text-paper">{error}</p>
          </div>
        </SignPanel>
      )}
    </main>
  )
}
