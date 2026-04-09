"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import VolunteerGate from "@/components/VolunteerGate";
import { centsToDollars } from "@/lib/code";

const ZONE_SLUGS = [
  { slug: "foyer", name: "Zone 1 · Foyer / Entrance" },
  { slug: "main", name: "Zone 2 · Main Church Area" },
  { slug: "quiet", name: "Zone 3 · TK / Quiet Area" },
  { slug: "cafeteria", name: "Zone 4 · Cafeteria" },
];

export default function CatalogAdmin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ zone_slug: "main", name: "", price_cents: 200, kind: "game" });

  async function load() {
    const r = await fetch("/api/catalog");
    if (!r.ok) { setAuthed(false); return; }
    setAuthed(true);
    setItems((await r.json()).items || []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!newItem.name) return;
    await fetch("/api/catalog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(newItem) });
    setNewItem({ ...newItem, name: "" });
    load();
  }
  async function patch(id: number, field: string, val: any) {
    await fetch("/api/catalog", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, [field]: val }) });
    load();
  }
  async function del(id: number) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/catalog?id=${id}`, { method: "DELETE" });
    load();
  }

  if (authed === null) return <main className="p-8 text-center">Loading…</main>;
  if (!authed) return <VolunteerGate onAuthed={load} />;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="mb-4">
        <Link href="/admin" className="text-sm text-white/60">← Admin</Link>
        <h1 className="text-2xl font-black glow-title mt-1">Catalog</h1>
        <p className="text-xs text-white/50">Games, food, drinks, and VIP perks per zone. Edit prices anytime.</p>
      </header>

      <section className="card mb-4">
        <h3 className="font-bold mb-2">Add item</h3>
        <div className="grid grid-cols-2 gap-2">
          <select value={newItem.zone_slug} onChange={(e) => setNewItem({ ...newItem, zone_slug: e.target.value })}>
            {ZONE_SLUGS.map((z) => <option key={z.slug} value={z.slug}>{z.name}</option>)}
          </select>
          <select value={newItem.kind} onChange={(e) => setNewItem({ ...newItem, kind: e.target.value })}>
            <option value="game">Game</option>
            <option value="food">Food</option>
            <option value="drink">Drink</option>
            <option value="perk">Perk</option>
            <option value="prize">Prize</option>
          </select>
          <input className="col-span-2" type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Name (e.g. Ring Toss)" />
          <input type="number" value={newItem.price_cents / 100} onChange={(e) => setNewItem({ ...newItem, price_cents: (parseFloat(e.target.value) || 0) * 100 })} placeholder="Price $" />
          <button className="btn-primary" onClick={add}>Add</button>
        </div>
      </section>

      {ZONE_SLUGS.map((z) => {
        const rows = items.filter((i) => i.zone_slug === z.slug);
        return (
          <section key={z.slug} className="card mb-3">
            <h3 className="font-bold mb-2">{z.name}</h3>
            {rows.length === 0 && <div className="text-white/40 text-sm">No items</div>}
            {rows.map((it) => (
              <div key={it.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
                <input className="flex-1" type="text" defaultValue={it.name} onBlur={(e) => e.target.value !== it.name && patch(it.id, "name", e.target.value)} />
                <input className="w-20" type="number" defaultValue={it.price_cents / 100} onBlur={(e) => patch(it.id, "price_cents", (parseFloat(e.target.value) || 0) * 100)} />
                <button onClick={() => del(it.id)} className="text-red-400 text-xs">×</button>
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}
