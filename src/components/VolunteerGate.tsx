"use client";
import { useState } from "react";

export default function VolunteerGate({ onAuthed }: { onAuthed: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) onAuthed();
    else setErr("Wrong password.");
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <h1 className="text-2xl font-black mb-4 glow-title">Volunteer Sign-In</h1>
        <label>Shared password</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
          inputMode="text"
        />
        {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
        <button className="btn-primary w-full mt-4" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
