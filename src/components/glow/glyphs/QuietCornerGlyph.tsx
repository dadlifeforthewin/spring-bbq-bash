export function QuietCornerGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* crescent moon */}
      <path d="M64 22 Q40 28 40 52 Q40 76 64 82 Q44 82 32 64 Q20 46 32 28 Q44 18 64 22 Z" />
      {/* Zzz stack */}
      <path d="M64 18 L78 18 L64 32 L78 32" strokeWidth={2.5} />
      <path d="M80 38 L90 38 L80 48 L90 48" strokeWidth={2} opacity={0.75} />
    </svg>
  )
}
