'use client'
import { useEffect, useState } from 'react'

type Prize = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export default function PrizesEditor() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [newPrize, setNewPrize] = useState({ label: '', sub: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/prizes')
    if (!res.ok) { setError('Load failed'); return }
    const body = await res.json()
    setPrizes(body.prizes ?? [])
  }

  useEffect(() => { load() }, [])

  async function patchPrize(id: string, patch: Partial<Prize>) {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/prizes/${id}`, {
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

  async function deactivatePrize(id: string) {
    if (!confirm('Deactivate this prize? Kids can no longer pick it at the prize wheel.')) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/prizes/${id}`, { method: 'DELETE' })
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

  async function createPrize() {
    if (!newPrize.label.trim()) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newPrize.label.trim(),
          sub: newPrize.sub.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Create failed')
        return
      }
      setNewPrize({ label: '', sub: '' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  // Swap sort_order with adjacent row to move up/down.
  // prizes are already sorted by sort_order asc, created_at asc on load.
  async function move(id: string, dir: 'up' | 'down') {
    const idx = prizes.findIndex((p) => p.id === id)
    if (idx < 0) return
    const neighborIdx = dir === 'up' ? idx - 1 : idx + 1
    if (neighborIdx < 0 || neighborIdx >= prizes.length) return
    const me = prizes[idx]
    const neighbor = prizes[neighborIdx]
    // If sort_orders happen to be equal, nudge — otherwise swap.
    if (me.sort_order === neighbor.sort_order) {
      const delta = dir === 'up' ? -1 : 1
      await patchPrize(me.id, { sort_order: me.sort_order + delta })
      return
    }
    await patchPrize(me.id, { sort_order: neighbor.sort_order })
    await patchPrize(neighbor.id, { sort_order: me.sort_order })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Prize wheel</h1>
        <p className="text-slate-500">
          Manage prize labels shown at the prize-wheel station. Deactivate instead of deleting — redemption history keeps the reference.
        </p>
      </header>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Add prize</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            value={newPrize.label}
            onChange={(e) => setNewPrize({ ...newPrize, label: e.target.value })}
            placeholder="Label (e.g. Slinky)"
            aria-label="new prize label"
            className="col-span-2 rounded border px-3 py-2"
          />
          <input
            value={newPrize.sub}
            onChange={(e) => setNewPrize({ ...newPrize, sub: e.target.value })}
            placeholder="Sub (optional)"
            aria-label="new prize sub"
            className="col-span-2 rounded border px-3 py-2"
          />
          <button
            type="button"
            onClick={createPrize}
            disabled={busy || !newPrize.label.trim()}
            aria-label="add prize"
            className="rounded bg-fuchsia-600 px-3 py-2 font-bold text-white disabled:opacity-50"
          >
            Add prize
          </button>
        </div>
      </section>

      <section className="space-y-2 rounded border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-bold">Prizes</h3>
        {prizes.length === 0 ? (
          <p className="text-sm text-slate-500">No prizes yet.</p>
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
              {prizes.map((p, idx) => (
                <tr key={p.id} className={`border-t border-slate-100 ${p.active ? '' : 'opacity-60'}`}>
                  <td className="py-1 pr-2">
                    <input
                      defaultValue={p.label}
                      aria-label={`label-${p.id}`}
                      onBlur={(e) => e.target.value !== p.label && patchPrize(p.id, { label: e.target.value })}
                      className="w-full rounded border px-2 py-1"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      defaultValue={p.sub ?? ''}
                      aria-label={`sub-${p.id}`}
                      onBlur={(e) => {
                        const next = e.target.value
                        if (next !== (p.sub ?? '')) patchPrize(p.id, { sub: next === '' ? null : next })
                      }}
                      className="w-full rounded border px-2 py-1"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(p.id, 'up')}
                        aria-label={`move-up-${p.id}`}
                        disabled={busy || idx === 0}
                        className="rounded border border-slate-300 px-2 py-0.5 text-sm disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(p.id, 'down')}
                        aria-label={`move-down-${p.id}`}
                        disabled={busy || idx === prizes.length - 1}
                        className="rounded border border-slate-300 px-2 py-0.5 text-sm disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <span className="ml-1 tabular-nums text-xs text-slate-400">{p.sort_order}</span>
                    </div>
                  </td>
                  <td className="py-1 pr-2">
                    {p.active ? (
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
                    {p.active ? (
                      <button
                        type="button"
                        onClick={() => deactivatePrize(p.id)}
                        aria-label={`deactivate-${p.id}`}
                        className="text-sm text-red-600"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => patchPrize(p.id, { active: true })}
                        aria-label={`reactivate-${p.id}`}
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
