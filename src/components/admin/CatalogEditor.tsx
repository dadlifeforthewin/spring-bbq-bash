'use client'
import { useEffect, useState } from 'react'

type Station = { slug: string; name: string; sort_order: number }
type Item = {
  id: string
  station_slug: string
  name: string
  ticket_cost: number
  sort_order: number
  active: boolean
}

export default function CatalogEditor() {
  const [stations, setStations] = useState<Station[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [newItem, setNewItem] = useState({ station_slug: '', name: '', ticket_cost: '1', sort_order: '0' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/catalog')
    if (!res.ok) { setError('Load failed'); return }
    const body = await res.json()
    setStations(body.stations)
    setItems(body.items)
    if (body.stations[0] && !newItem.station_slug) {
      setNewItem((v) => ({ ...v, station_slug: body.stations[0].slug }))
    }
  }

  useEffect(() => { load() }, [])

  async function patchItem(id: string, patch: Partial<Item>) {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
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

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? Station devices lose it on next refresh.')) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Delete failed')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function createItem() {
    if (!newItem.station_slug || !newItem.name) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_slug: newItem.station_slug,
          name: newItem.name,
          ticket_cost: Number(newItem.ticket_cost) || 0,
          sort_order: Number(newItem.sort_order) || 0,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Create failed')
        return
      }
      setNewItem({ station_slug: newItem.station_slug, name: '', ticket_cost: '1', sort_order: '0' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const grouped: Record<string, Item[]> = {}
  for (const it of items) {
    grouped[it.station_slug] = grouped[it.station_slug] || []
    grouped[it.station_slug].push(it)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Stations &amp; catalog</h1>
        <p className="text-slate-500">
          Edit ticket prices and item names. Station devices pick up changes on next page refresh.
        </p>
      </header>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Add item</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <select value={newItem.station_slug}
            onChange={(e) => setNewItem({ ...newItem, station_slug: e.target.value })}
            aria-label="new item station"
            className="rounded border px-3 py-2">
            {stations.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name" aria-label="new item name"
            className="col-span-2 rounded border px-3 py-2" />
          <input type="number" min={0} max={50} value={newItem.ticket_cost}
            onChange={(e) => setNewItem({ ...newItem, ticket_cost: e.target.value })}
            placeholder="Ticket cost" aria-label="new item ticket cost"
            className="rounded border px-3 py-2" />
          <button type="button" onClick={createItem} disabled={busy || !newItem.name}
            className="rounded bg-fuchsia-600 px-3 py-2 font-bold text-white disabled:opacity-50">
            Add
          </button>
        </div>
      </section>

      {stations.map((station) => (
        <section key={station.slug} className="space-y-2 rounded border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-bold capitalize">{station.name}</h3>
          {!grouped[station.slug] || grouped[station.slug].length === 0 ? (
            <p className="text-sm text-slate-500">No items yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Name</th>
                  <th className="py-1">🎟</th>
                  <th className="py-1">Order</th>
                  <th className="py-1">Active</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {grouped[station.slug].map((it) => (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="py-1 pr-2">
                      <input defaultValue={it.name} aria-label={`name-${it.id}`}
                        onBlur={(e) => e.target.value !== it.name && patchItem(it.id, { name: e.target.value })}
                        className="w-full rounded border px-2 py-1" />
                    </td>
                    <td className="py-1 pr-2">
                      <input type="number" min={0} max={50} defaultValue={it.ticket_cost}
                        aria-label={`cost-${it.id}`}
                        onBlur={(e) => {
                          const n = Number(e.target.value) || 0
                          if (n !== it.ticket_cost) patchItem(it.id, { ticket_cost: n })
                        }}
                        className="w-20 rounded border px-2 py-1" />
                    </td>
                    <td className="py-1 pr-2">
                      <input type="number" min={0} defaultValue={it.sort_order}
                        aria-label={`sort-${it.id}`}
                        onBlur={(e) => {
                          const n = Number(e.target.value) || 0
                          if (n !== it.sort_order) patchItem(it.id, { sort_order: n })
                        }}
                        className="w-20 rounded border px-2 py-1" />
                    </td>
                    <td className="py-1 pr-2">
                      <input type="checkbox" checked={it.active}
                        aria-label={`active-${it.id}`}
                        onChange={(e) => patchItem(it.id, { active: e.target.checked })} />
                    </td>
                    <td className="py-1 text-right">
                      <button type="button" onClick={() => deleteItem(it.id)}
                        className="text-sm text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  )
}
