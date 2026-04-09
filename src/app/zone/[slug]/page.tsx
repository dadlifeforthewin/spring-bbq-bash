"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import VolunteerGate from "@/components/VolunteerGate";
import { extractTicketCode, centsToDollars } from "@/lib/code";

interface Zone { slug: string; name: string; description: string | null }
interface CatalogItem { id: number; name: string; price_cents: number; kind: string; zone_slug: string }

const PERK_ITEM_TO_FIELD: Record<string, string> = {
  "Redeem Pizza Slice": "perk_pizza",
  "Redeem Basic Drink": "perk_basic_drink",
  "Redeem Premium Drink (VIP)": "perk_premium_drink",
  "Redeem Starter Glow Stick": "perk_glow_stick",
  "Redeem Glow Stick Pack (VIP)": "perk_glow_pack",
  "DJ Shoutout (VIP)": "perk_dj_shoutout",
  "Spin the Wheel (VIP)": "perk_spin_wheel",
  "Free Dress Pass (VIP)": "perk_free_dress",
  "Jail Free Redemption (VIP)": "perk_jail_free",
};

export default function ZonePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [ticket, setTicket] = useState<any>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [manual, setManual] = useState("");
  const [callMsg, setCallMsg] = useState("");

  useEffect(() => {
    fetch("/api/stats").then((r) => setAuthed(r.ok));
    fetch(`/api/catalog?zone=${slug}`).then(async (r) => {
      const j = await r.json();
      setItems(j.items || []);
    });
    // public zones read
    fetch(`/api/zones`).then(async (r) => { if (r.ok) { const j = await r.json(); setZone(j.zones.find((z: Zone) => z.slug === slug) ?? null); } });
  }, [slug]);

  async function lookup(code: string) {
    setScanning(false);
    setError("");
    const res = await fetch(`/api/tickets/${code}`);
    if (!res.ok) { setError("Ticket not found"); setScanning(true); return; }
    const { ticket } = await res.json();
    if (!ticket.checked_in) { setError(`${code} is not checked in`); setScanning(true); return; }
    setTicket(ticket);
  }

  async function spend(item: CatalogItem) {
    if (!ticket) return;
    setError("");
    const perk_field = PERK_ITEM_TO_FIELD[item.name];
    const res = await fetch("/api/spend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: ticket.code,
        zone_slug: slug,
        item_name: item.name,
        amount_cents: item.price_cents,
        kind: "spend",
        perk_field,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setError(j.error); return; }
    setTicket(j.ticket);
    setToast(`✓ ${item.name}`);
    setTimeout(() => setToast(""), 1500);
  }

  async function callParent() {
    if (!ticket) return;
    const res = await fetch("/api/call-parent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: ticket.code, zone_slug: slug, message: callMsg || undefined }),
    });
    const j = await res.json();
    if (res.ok && j.ok) {
      setToast(`📣 Parent notified`);
      setCallMsg("");
    } else if (j.needsPA) {
      setError(`${j.childName} — parent NOT subscribed to app. Use PA announcement.`);
    } else {
      setError(j.error || "failed");
    }
    setTimeout(() => setToast(""), 2000);
  }

  function reset() { setTicket(null); setScanning(true); setError(""); setCallMsg(""); }

  if (authed === null) return <main className="p-8 text-center">Loading…</main>;
  if (!authed) return <VolunteerGate onAuthed={() => setAuthed(true)} />;

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-3">
        <a href="/" className="text-xs text-white/60">← Home</a>
        <h1 className="text-xl font-black glow-title mt-1">{zone?.name ?? `Zone · ${slug}`}</h1>
        {zone?.description && <p className="text-xs text-white/50">{zone.description}</p>}
      </header>

      {!ticket && (
        <>
          {scanning && <QRScanner onScan={(raw) => { const c = extractTicketCode(raw); if (c) lookup(c); }} />}
          <div className="mt-3 flex gap-2">
            <input type="text" value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="SBBQ-001" />
            <button className="btn-secondary" onClick={() => lookup(manual)}>Go</button>
          </div>
          {error && <p className="text-red-400 mt-3">{error}</p>}
        </>
      )}

      {ticket && (
        <div className="space-y-3">
          <div className="card flex items-center justify-between">
            <div>
              <div className="text-xs text-white/50">{ticket.child_name || "Kid"}</div>
              <div className="text-2xl font-black">{ticket.code}</div>
              <div className="text-sm text-white/60 mt-1">Balance: <strong className="text-white">{centsToDollars(ticket.balance_cents)}</strong></div>
            </div>
            <button className="btn-ghost" onClick={reset}>×</button>
          </div>

          {toast && <div className="card bg-green-500/20 border-green-400/40">{toast}</div>}
          {error && <div className="card bg-red-500/20 border-red-400/40 text-red-200">{error}</div>}

          <div className="grid grid-cols-2 gap-2">
            {items.map((it) => {
              const isPerk = !!PERK_ITEM_TO_FIELD[it.name];
              const perkAvailable = isPerk ? ticket[PERK_ITEM_TO_FIELD[it.name]] === true : true;
              const affordable = isPerk ? perkAvailable : ticket.balance_cents >= it.price_cents;
              return (
                <button
                  key={it.id}
                  disabled={!affordable}
                  onClick={() => spend(it)}
                  className={`rounded-2xl p-3 text-left border transition active:scale-95 ${affordable ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 opacity-40"}`}
                >
                  <div className="font-bold text-sm">{it.name}</div>
                  <div className="text-xs mt-1 text-white/60">
                    {isPerk ? (perkAvailable ? "VIP perk · tap to redeem" : "already used") : centsToDollars(it.price_cents)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="card mt-2">
            <label>Call parent</label>
            <input type="text" value={callMsg} onChange={(e) => setCallMsg(e.target.value)} placeholder={`Please come to ${zone?.name || "this zone"}.`} />
            <button className="btn-danger w-full mt-2" onClick={callParent}>📣 Call Parent Now</button>
            {!ticket.ntfy_subscribed && (
              <p className="text-xs text-yellow-300 mt-2">⚠ Parent not subscribed — this will trigger a PA announcement request.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
