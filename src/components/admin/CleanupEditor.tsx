'use client'
import { useEffect, useState } from 'react'

type CleanupTask = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export default function CleanupEditor() {
  const [tasks, setTasks] = useState<CleanupTask[]>([])
  const [newTask, setNewTask] = useState({ label: '', sub: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/cleanup')
    if (!res.ok) { setError('Load failed'); return }
    const body = await res.json()
    setTasks(body.tasks ?? [])
  }

  useEffect(() => { load() }, [])

  async function patchTask(id: string, patch: Partial<CleanupTask>) {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/cleanup/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Save failed')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function deactivateTask(id: string) {
    if (!confirm('Deactivate this cleanup task? Volunteers can no longer complete it at the cleanup station.')) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/cleanup/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Deactivate failed')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function createTask() {
    if (!newTask.label.trim()) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newTask.label.trim(),
          sub: newTask.sub.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Create failed')
        return
      }
      setNewTask({ label: '', sub: '' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  // Swap sort_order with adjacent row to move up/down.
  // tasks are already sorted by sort_order asc, created_at asc on load.
  async function move(id: string, dir: 'up' | 'down') {
    const idx = tasks.findIndex((t) => t.id === id)
    if (idx < 0) return
    const neighborIdx = dir === 'up' ? idx - 1 : idx + 1
    if (neighborIdx < 0 || neighborIdx >= tasks.length) return
    const me = tasks[idx]
    const neighbor = tasks[neighborIdx]
    // If sort_orders happen to be equal, nudge — otherwise swap.
    if (me.sort_order === neighbor.sort_order) {
      const delta = dir === 'up' ? -1 : 1
      await patchTask(me.id, { sort_order: me.sort_order + delta })
      return
    }
    await patchTask(me.id, { sort_order: neighbor.sort_order })
    await patchTask(neighbor.id, { sort_order: me.sort_order })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Cleanup tasks</h1>
        <p className="text-slate-500">
          Manage tasks shown at the cleanup station. Deactivate instead of deleting — completion history keeps the reference.
        </p>
      </header>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Add task</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            value={newTask.label}
            onChange={(e) => setNewTask({ ...newTask, label: e.target.value })}
            placeholder="Label (e.g. Pick up cups)"
            aria-label="new task label"
            className="col-span-2 rounded border px-3 py-2"
          />
          <input
            value={newTask.sub}
            onChange={(e) => setNewTask({ ...newTask, sub: e.target.value })}
            placeholder="Sub (optional)"
            aria-label="new task sub"
            className="col-span-2 rounded border px-3 py-2"
          />
          <button
            type="button"
            onClick={createTask}
            disabled={busy || !newTask.label.trim()}
            aria-label="add task"
            className="rounded bg-fuchsia-600 px-3 py-2 font-bold text-white disabled:opacity-50"
          >
            Add task
          </button>
        </div>
      </section>

      <section className="space-y-2 rounded border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-bold">Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No cleanup tasks yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1">Label</th>
                <th className="py-1">Sub</th>
                <th className="py-1">Order</th>
                <th className="py-1">Active</th>
                <th className="py-1 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, idx) => (
                <tr key={t.id} className={`border-t border-slate-100 ${t.active ? '' : 'opacity-60'}`}>
                  <td className="py-1 pr-2">
                    <input
                      defaultValue={t.label}
                      aria-label={`label-${t.id}`}
                      onBlur={(e) => e.target.value !== t.label && patchTask(t.id, { label: e.target.value })}
                      className="w-full rounded border px-2 py-1"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      defaultValue={t.sub ?? ''}
                      aria-label={`sub-${t.id}`}
                      onBlur={(e) => {
                        const next = e.target.value
                        if (next !== (t.sub ?? '')) patchTask(t.id, { sub: next === '' ? null : next })
                      }}
                      className="w-full rounded border px-2 py-1"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(t.id, 'up')}
                        aria-label={`move-up-${t.id}`}
                        disabled={busy || idx === 0}
                        className="rounded border border-slate-300 px-2 py-0.5 text-sm disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(t.id, 'down')}
                        aria-label={`move-down-${t.id}`}
                        disabled={busy || idx === tasks.length - 1}
                        className="rounded border border-slate-300 px-2 py-0.5 text-sm disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <span className="ml-1 tabular-nums text-xs text-slate-400">{t.sort_order}</span>
                    </div>
                  </td>
                  <td className="py-1 pr-2">
                    {t.active ? (
                      <span className="rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        YES
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-400 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        NO
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-right">
                    {t.active ? (
                      <button
                        type="button"
                        onClick={() => deactivateTask(t.id)}
                        aria-label={`deactivate-${t.id}`}
                        className="text-sm text-red-600"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => patchTask(t.id, { active: true })}
                        aria-label={`reactivate-${t.id}`}
                        className="text-sm text-fuchsia-600"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
