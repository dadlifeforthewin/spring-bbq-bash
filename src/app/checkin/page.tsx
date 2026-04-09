"use client";
import { useEffect, useState } from "react";
import QRScanner from "@/components/QRScanner";
import VolunteerGate from "@/components/VolunteerGate";
import { extractTicketCode, centsToDollars } from "@/lib/code";

export default function CheckInPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ child_name: "", child_age: "", parent_name: "", parent_phone: "", ntfy_subscribed: true });
  const [manual, setManual] = useState("");

  useEffect(() => {
    fetch("/api/stats").then((r) => setAuthed(r.ok));
  }, []);

  async function lookup(code: string) {
    setError("");
    setScanning(false);
    const res = await fetch(`/api/tickets/${code}`);
    if (!res.ok) { setError("Ticket not found."); setScanning(true); return; }
    const { ticket } = await res.json();
    setTicket(ticket);
    setForm({
      child_name: ticket.child_name ?? "",
      child_age: ticket.child_age?.toString() ?? "",
      parent_name: ticket.parent_name ?? "",
      parent_phone: ticket.parent_phone ?? "",
      ntfy_subscribed: ticket.ntfy_subscribed ?? true,
    });
  }

  async function checkAction(action: "in" | "out") {
    if (!ticket) return;
    setBusy(true);
    const body: any = { code: ticket.code, action };
    if (action === "in") {
      body.child_name = form.child_name;
      body.child_age = form.child_age ? parseInt(form.child_age, 10) : null;
      body.parent_name = form.parent_name;
      body.parent_phone = form.parent_phone;
      body.ntfy_subscribed = form.ntfy_subscribed;
    }
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) { setError("Failed: " + (await res.json()).error); return; }
    reset();
  }

  function reset() {
    setTicket(null);
    setError("");
    setScanning(true);
    setForm({ child_name: "", child_age: "", parent_name: "", parent_phone: "", ntfy_subscribed: true });
    setManual("");
  }

  if (authed === null) return <main className="p-8 text-center">Loading…</main>;
  if (!authed) return <VolunteerGate onAuthed={() => setAuthed(true)} />;

  const ntfySubscribeUrl = ticket
    ? `${process.env.NEXT_PUBLIC_SITE_URL || ""}/ticket/${ticket.code}?subscribe=1`
    : "";

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black glow-title">Check-In / Out</h1>
        <a href="/" className="text-sm text-white/60">Home</a>
      </header>

      {!ticket && (
        <>
          {scanning && <QRScanner onScan={(raw) => { const c = extractTicketCode(raw); if (c) lookup(c); }} />}
          <div className="mt-4">
            <label>Or enter code manually</label>
            <div className="flex gap-2">
              <input type="text" value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="SBBQ-001" />
              <button className="btn-secondary" onClick={() => lookup(manual)}>Go</button>
            </div>
          </div>
          {error && <p className="text-red-400 mt-3">{error}</p>}
        </>
      )}

      {ticket && (
        <div className="card mt-2">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-white/50">Ticket</div>
              <div className="text-2xl font-black">{ticket.code}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.tier === "vip" ? "bg-glow-pink text-white" : "bg-glow-cyan/30 text-glow-cyan"}`}>
              {ticket.tier.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-white/60 mt-1">
            Balance: {centsToDollars(ticket.balance_cents)} ·{" "}
            {ticket.checked_in ? <span className="text-green-400">Checked in</span> : <span className="text-yellow-300">Not checked in</span>}
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label>Child name</label>
              <input type="text" value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} />
            </div>
            <div>
              <label>Child age</label>
              <input type="number" value={form.child_age} onChange={(e) => setForm({ ...form, child_age: e.target.value })} />
            </div>
            <div>
              <label>Parent name</label>
              <input type="text" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
            </div>
            <div>
              <label>Parent phone (backup)</label>
              <input type="tel" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
            </div>
            <label className="flex items-center gap-3 mt-1">
              <input type="checkbox" checked={form.ntfy_subscribed} onChange={(e) => setForm({ ...form, ntfy_subscribed: e.target.checked })} className="w-5 h-5" />
              <span>Parent installed ntfy app & subscribed</span>
            </label>
          </div>

          {!ticket.checked_in && form.ntfy_subscribed && (
            <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-xs text-white/60 mb-2">Parent scans this to subscribe to alerts:</div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ntfySubscribeUrl)}`}
                alt="ntfy subscribe"
                className="mx-auto bg-white p-2 rounded"
              />
              <div className="text-[11px] text-white/40 mt-2 break-all text-center">{ntfySubscribeUrl}</div>
            </div>
          )}

          {error && <p className="text-red-400 mt-3">{error}</p>}
          <div className="grid gap-2 mt-4">
            {!ticket.checked_in ? (
              <button className="btn-primary" disabled={busy} onClick={() => checkAction("in")}>
                {busy ? "…" : "Check In"}
              </button>
            ) : (
              <button className="btn-danger" disabled={busy} onClick={() => checkAction("out")}>
                {busy ? "…" : "Check Out"}
              </button>
            )}
            <button className="btn-ghost" onClick={reset}>Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
