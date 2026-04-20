'use client'
import { useEffect, useState } from 'react'
import { Button, Input, PageHead, SectionHeading, Select } from '@/components/glow'

type Station = { slug: string; name: string; sort_order: number }
type Item = {
  id: string
  station_slug: string
  name: string
  ticket_cost: number
  sort_order: number
  active: boolean
}

const STATION_TONES = ['cyan', 'uv', 'gold', 'mint', 'magenta'] as const
type StationTone = (typeof STATION_TONES)[number]

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
      <PageHead
        title="Stations & catalog"
        sub="Edit ticket prices and item names. Station devices pick up changes on next page refresh."
      />

      {error && <p className="rounded-xl border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <section className="space-y-3 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
        <SectionHeading num="01" title="Add item" tone="cyan" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Select value={newItem.station_slug}
            onChange={(e) => setNewItem({ ...newItem, station_slug: e.target.value })}
            aria-label="new item station">
            {stations.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </Select>
          <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name" aria-label="new item name"
            className="col-span-2" />
          <Input type="number" min={0} max={50} value={newItem.ticket_cost}
            onChange={(e) => setNewItem({ ...newItem, ticket_cost: e.target.value })}
            placeholder="Ticket cost" aria-label="new item ticket cost" />
          <Button type="button" tone="magenta" size="lg" onClick={createItem}
            loading={busy} disabled={busy || !newItem.name}>
            Add
          </Button>
        </div>
      </section>

      {stations.map((station, idx) => {
        const num = String(idx + 2).padStart(2, '0')
        const tone: StationTone = STATION_TONES[(idx + 1) % STATION_TONES.length]
        return (
          <section key={station.slug} className="space-y-2 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5">
            <SectionHeading num={num} title={station.name.charAt(0).toUpperCase() + station.name.slice(1)} tone={tone} />
            {!grouped[station.slug] || grouped[station.slug].length === 0 ? (
              <p className="text-sm text-mist">No items yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-mist">
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
                    <tr key={it.id} className="border-t border-ink-hair/40">
                      <td className="py-1 pr-2">
                        <Input defaultValue={it.name} aria-label={`name-${it.id}`}
                          onBlur={(e) => e.target.value !== it.name && patchItem(it.id, { name: e.target.value })}
                          className="h-9 px-3 text-sm" />
                      </td>
                      <td className="py-1 pr-2">
                        <Input type="number" min={0} max={50} defaultValue={it.ticket_cost}
                          aria-label={`cost-${it.id}`}
                          onBlur={(e) => {
                            const n = Number(e.target.value) || 0
                            if (n !== it.ticket_cost) patchItem(it.id, { ticket_cost: n })
                          }}
                          className="h-9 w-20 px-3 text-sm" />
                      </td>
                      <td className="py-1 pr-2">
                        <Input type="number" min={0} defaultValue={it.sort_order}
                          aria-label={`sort-${it.id}`}
                          onBlur={(e) => {
                            const n = Number(e.target.value) || 0
                            if (n !== it.sort_order) patchItem(it.id, { sort_order: n })
                          }}
                          className="h-9 w-20 px-3 text-sm" />
                      </td>
                      <td className="py-1 pr-2">
                        <input type="checkbox" checked={it.active}
                          aria-label={`active-${it.id}`}
                          onChange={(e) => patchItem(it.id, { active: e.target.checked })} />
                      </td>
                      <td className="py-1 text-right">
                        <Button type="button" tone="danger" size="sm" onClick={() => deleteItem(it.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )
      })}
    </div>
  )
}
