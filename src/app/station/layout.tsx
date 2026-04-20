import { Aurora, GridFloor } from '@/components/glow'

export default function StationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-ink text-paper">
      <Aurora className="opacity-60" />
      <GridFloor className="opacity-40" />
      <div className="relative z-10 mx-auto max-w-[480px] px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-hair/60 bg-ink/80 backdrop-blur-sm px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
        <span className="mx-auto block max-w-[480px]">
          SHIFT · LCA · APR 25 · 5–8PM
        </span>
      </footer>
    </div>
  )
}
