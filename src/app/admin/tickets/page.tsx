"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import VolunteerGate from "@/components/VolunteerGate";
import { centsToDollars } from "@/lib/code";

export default function TicketsAdmin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [count, setCount] = useState(10);
  const [tier, setTier] = useState<"general" | "vip">("general");
  const [balance, setBalance] = useState(0);

  async function load() {
    const r = await fetch("/api/tickets");
    if (!r.ok) { setAuthed(false); return; }
    setAuthed(true);
    const j = await r.json();
    setTickets(j.tickets || []);
  }
  useEffect(() => { load(); }, []);

  async function generate() {
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ count, tier, balance_cents: balance * 100 }),
    });
    load();
  }

  async function del(code: string) {
    if (!confirm(`Delete ${code}?`)) return;
    await fetch(`/api/tickets/${code}`, { method: "DELETE" });
    load();
  }

  if (authed === null) return <main className="p-8 text-center">Loading…</main>;
  if (!authed) return <VolunteerGate onAuthed={load} />;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="mb-4">
        <Link href="/admin" className="text-sm text-white/60">← Admin</Link>
        <h1 className="text-2xl font-black glow-title mt-1">Tickets</h1>
      </header>

      <section className="card mb-4">
        <h3 className="font-bold mb-2">Generate tickets</h3>
        <div className="grid grid-cols-3 gap-2">
          <div><label>Count</label><input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} /></div>
          <div><label>Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as any)}>
              <option value="general">General $40</option>
              <option value="vip">VIP $50</option>
            </select>
          </div>
          <div><label>Game $ balance</label><input type="number" value={balance} onChange={(e) => setBalance(parseInt(e.target.value) || 0)} /></div>
        </div>
        <button className="btn-primary w-full mt-3" onClick={generate}>Generate {count} ticket(s)</button>
        <p className="text-xs text-white/50 mt-2">Game $ balance is optional arcade credits pre-loaded on each ticket (independent of admission price).</p>
      </section>

      <section className="card">
        <h3 className="font-bold mb-2">All tickets ({tickets.length})</h3>
        <div className="space-y-1 text-sm">
          {tickets.map((t) => (
            <div key={t.code} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <Link href={`/ticket/${t.code}`} className="font-mono font-bold underline">{t.code}</Link>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${t.tier === "vip" ? "bg-glow-pink/60" : "bg-glow-cyan/30"}`}>{t.tier.toUpperCase()}</span>
                {t.checked_in && <span className="ml-2 text-xs text-green-400">● in</span>}
                <div className="text-xs text-white/50">{t.child_name || "—"} · {centsToDollars(t.balance_cents)}</div>
              </div>
              <button onClick={() => del(t.code)} className="text-red-400 text-xs">delete</button>
            </div>
          ))}
          {tickets.length === 0 && <div className="text-white/40 text-center py-6">No tickets yet. Generate some above.</div>}
        </div>
      </section>
    </main>
  );
}
