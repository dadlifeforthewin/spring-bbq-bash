import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl md:text-6xl font-black text-center glow-title">
        Spring BBQ Bash
      </h1>
      <p className="text-white/70 text-center max-w-md">
        Glow Party Edition · Lincoln Christian Academy · Saturday, April 25, 2026
      </p>

      <div className="grid gap-3 w-full max-w-xs mt-6">
        <Link href="/checkin" className="btn-primary text-center">Check-In Station</Link>
        <Link href="/zone/foyer" className="btn-secondary text-center">Zone 1 · Foyer</Link>
        <Link href="/zone/main" className="btn-secondary text-center">Zone 2 · Main Church</Link>
        <Link href="/zone/quiet" className="btn-secondary text-center">Zone 3 · Quiet Area</Link>
        <Link href="/zone/cafeteria" className="btn-secondary text-center">Zone 4 · Cafeteria</Link>
        <Link href="/admin" className="btn-outline text-center">Admin Dashboard</Link>
      </div>

      <p className="text-xs text-white/40 mt-6">Parents: scan your wristband QR to open your ticket page.</p>
    </main>
  );
}
