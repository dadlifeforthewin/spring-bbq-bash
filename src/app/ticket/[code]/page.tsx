"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { centsToDollars } from "@/lib/code";

// Public parent-facing ticket page. No volunteer auth required.
// When ?subscribe=1 is present we show the BIG "Subscribe to alerts" instructions.
export default function TicketPage() {
  const params = useParams<{ code: string }>();
  const [subscribeMode, setSubscribeMode] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSubscribeMode(new URLSearchParams(window.location.search).get("subscribe") === "1");
    }
  }, []);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    fetch(`/api/tickets/${params.code}`).then(async (r) => {
      if (r.ok) setData(await r.json());
      setLoading(false);
    });
    fetch(`/api/ntfy-link?code=${params.code}`).then(async (r) => {
      if (r.ok) setTopic((await r.json()).topic);
    });
    const t = setInterval(() => {
      fetch(`/api/tickets/${params.code}`).then(async (r) => { if (r.ok) setData(await r.json()); });
    }, 5000);
    return () => clearInterval(t);
  }, [params.code]);

  if (loading) return <main className="p-8 text-center">Loading…</main>;
  if (!data?.ticket) return <main className="p-8 text-center">Ticket not found.</main>;
  const t = data.ticket;

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="text-center py-4">
        <h1 className="text-2xl font-black glow-title">Spring BBQ Bash</h1>
        <p className="text-xs text-white/60">Lincoln Christian Academy · April 25, 2026</p>
      </header>

      <div className="card text-center">
        <div className="text-xs text-white/50">Ticket</div>
        <div className="text-3xl font-black">{t.code}</div>
        {t.child_name && <div className="text-white/80 mt-1">{t.child_name}</div>}
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${t.tier === "vip" ? "bg-glow-pink text-white" : "bg-glow-cyan/30 text-glow-cyan"}`}>
          {t.tier.toUpperCase()}
        </span>
        <div className="text-4xl font-black mt-4">{centsToDollars(t.balance_cents)}</div>
        <div className="text-xs text-white/50">remaining balance</div>
      </div>

      {subscribeMode && topic && (
        <div className="card mt-4 border-glow-pink/60 bg-glow-pink/10">
          <h2 className="font-black text-lg mb-2">📣 Get alerts when {t.child_name || "your child"} needs you</h2>
          <ol className="text-sm space-y-2 list-decimal pl-5">
            <li>
              Install the free <strong>ntfy</strong> app:{" "}
              <a className="underline" href="https://apps.apple.com/us/app/ntfy/id1625396347">iPhone</a> ·{" "}
              <a className="underline" href="https://play.google.com/store/apps/details?id=io.heckel.ntfy">Android</a>
            </li>
            <li>Open the app → tap <strong>+ Subscribe to topic</strong></li>
            <li>Paste or scan this topic name:
              <div className="mt-1 p-2 rounded bg-black/40 font-mono text-xs break-all select-all">{topic}</div>
            </li>
            <li>Tap <strong>Subscribe</strong>. That's it — keep your phone on you.</li>
          </ol>
          <a
            className="btn-primary w-full block text-center mt-3"
            href={`ntfy://subscribe/${topic}`}
          >
            Open in ntfy app
          </a>
          <a
            className="btn-ghost w-full block text-center mt-2"
            href={`https://ntfy.sh/${topic}`}
            target="_blank"
          >
            Or open in browser
          </a>
        </div>
      )}

      <section className="mt-4">
        <h3 className="text-sm font-bold text-white/70 mb-2">Recent activity</h3>
        <div className="space-y-2">
          {(data.transactions || []).slice(0, 15).map((tx: any) => (
            <div key={tx.id} className="card flex justify-between text-sm">
              <div>
                <div>{tx.item_name}</div>
                <div className="text-xs text-white/40">{new Date(tx.created_at).toLocaleTimeString()}</div>
              </div>
              <div className={tx.kind === "refund" ? "text-green-400" : "text-white/80"}>
                {tx.kind === "perk_redeem" ? "perk" : centsToDollars(tx.amount_cents)}
              </div>
            </div>
          ))}
          {(!data.transactions || data.transactions.length === 0) && (
            <div className="text-center text-white/40 text-sm py-4">No purchases yet. Have fun! 🎉</div>
          )}
        </div>
      </section>
    </main>
  );
}
