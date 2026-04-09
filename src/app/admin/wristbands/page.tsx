"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import VolunteerGate from "@/components/VolunteerGate";
import QRCode from "qrcode";

// Printable wristband / ticket sheet. Each card has a scannable QR that points to
// /ticket/[code] so parents can scan for their live balance, plus the code printed
// in large text as a paper backup if the QR tears.

export default function WristbandsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "general" | "vip">("all");

  async function load() {
    const r = await fetch("/api/tickets");
    if (!r.ok) { setAuthed(false); return; }
    setAuthed(true);
    const j = await r.json();
    setTickets((j.tickets || []).slice().reverse());
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      const next: Record<string, string> = {};
      for (const t of tickets) {
        next[t.code] = await QRCode.toDataURL(`${siteUrl}/ticket/${t.code}`, { width: 220, margin: 1 });
      }
      setQrs(next);
    })();
  }, [tickets]);

  if (authed === null) return <main className="p-8 text-center">Loading…</main>;
  if (!authed) return <VolunteerGate onAuthed={load} />;

  const visible = tickets.filter((t) => filter === "all" ? true : t.tier === filter);

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="no-print mb-4">
        <Link href="/admin" className="text-sm text-white/60">← Admin</Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-black glow-title">Printable Wristbands</h1>
          <button className="btn-primary" onClick={() => window.print()}>🖨 Print</button>
        </div>
        <div className="flex gap-2 mt-3">
          {(["all","general","vip"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs ${filter === f ? "bg-glow-pink text-white" : "bg-white/10"}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/50 mt-2">Print on cardstock or sticker paper. Cut along the dotted lines and attach to wristbands with a safety pin or adhesive.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 print:grid-cols-3">
        {visible.map((t) => (
          <div
            key={t.code}
            className="border-2 border-dashed border-black/40 p-3 m-1 rounded-xl bg-white text-black flex flex-col items-center text-center print:m-0"
            style={{ pageBreakInside: "avoid" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Spring BBQ Bash · Apr 25</div>
            <div className="text-[10px] text-black/60">Lincoln Christian Academy</div>
            {qrs[t.code] && <img src={qrs[t.code]} className="w-32 h-32 my-1" alt={t.code} />}
            <div className="text-xl font-black tracking-wider">{t.code}</div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.tier === "vip" ? "bg-pink-600 text-white" : "bg-cyan-600 text-white"}`}>
              {t.tier === "vip" ? "VIP · $50" : "GENERAL · $40"}
            </div>
            <div className="text-[9px] mt-1 text-black/60 leading-tight">
              Scan for balance & alerts<br/>
              Lost? Return to Zone 1 Foyer
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
