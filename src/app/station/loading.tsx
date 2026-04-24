/* Shown immediately on every navigation between station routes. Without
 * this, Next.js leaves the previous page on screen until the new RSC
 * payload arrives, which feels like the tap was ignored. */
export default function StationLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24" aria-live="polite" aria-busy="true">
      <div className="h-10 w-10 rounded-full border-2 border-neon-cyan/40 border-t-neon-cyan motion-safe:animate-spin" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
        Loading station…
      </span>
    </div>
  )
}
