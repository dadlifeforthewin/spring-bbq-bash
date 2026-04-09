"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import VolunteerGate from "@/components/VolunteerGate";
import { centsToDollars } from "@/lib/code";

export default function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    const r = await fetch("/api/stats");
    if (r.ok) { setAuthed(true); setStats(await r.json()); }
    else setAuthed(false);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (authed === null) return <main className="p-8 text-center">Loading…</main>;
  if (!authed) return <VolunteerGate onAuthed={() => load()} />;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="flex items-baseline justify-between mb-4">
        <h1 className="text-3xl font-black glow-title">Admin</h1>
        <Link href="/" className="text-sm text-white/60">Home</Link>
      </header>

      <nav className="grid grid-cols-3 gap-2 mb-6">
        <Link href="/admin/tickets" className="btn-outline text-center text-sm">Tickets</Link>
        <Link href="/admin/catalog" className="btn-outline text-center text-sm">Catalog</Link>
        <Link href="/admin/wristbands" className="btn-outline text-center text-sm">Wristbands</Link>
      </nav>

      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card"><div className="text-xs text-white/50">Tickets sold</div><div className="text-3xl font-black">{stats.total}</div><div className="text-xs text-white/40 mt-1">{stats.vip} VIP · {stats.general} Gen</div></div>
          <div className="card"><div className="text-xs text-white/50">Checked in now</div><div className="text-3xl font-black">{stats.checkedIn}</div></div>
          <div className="card"><div className="text-xs text-white/50">Gross revenue</div><div className="text-3xl font-black">{centsToDollars(stats.revenueCents)}</div></div>
          <div className="card"><div className="text-xs text-white/50">Unspent balance</div><div className="text-3xl font-black">{centsToDollars(stats.balanceOutstanding)}</div></div>
        </div>
      )}

      {stats && Object.keys(stats.spendByZone).length > 0 && (
        <section className="card mb-4">
          <h3 className="text-sm font-bold mb-2 text-white/70">Spend by zone</h3>
          {Object.entries(stats.spendByZone).map(([slug, c]) => (
            <div key={slug} className="flex justify-between text-sm py-1">
              <span className="capitalize">{slug}</span>
              <span>{centsToDollars(c as number)}</span>
            </div>
          ))}
        </section>
      )}

      {stats?.recent?.length > 0 && (
        <section className="card">
          <h3 className="text-sm font-bold mb-2 text-white/70">Recent activity</h3>
          <div className="space-y-1 text-sm">
            {stats.recent.slice(0, 10).map((tx: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span className="text-white/70">{tx.zone_slug || "—"}</span>
                <span>{centsToDollars(tx.amount_cents)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
