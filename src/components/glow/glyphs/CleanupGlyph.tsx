export function CleanupGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* broom handle */}
      <path d="M72 14 L44 52" />
      {/* broom head (angled trapezoid) */}
      <path d="M34 46 L60 64 L48 80 L22 62 Z" />
      {/* bristle strokes */}
      <path d="M30 60 L26 72 M38 64 L34 78 M46 70 L42 84 M54 74 L50 86" strokeWidth={2} opacity={0.8} />
      {/* checkmark (completion) */}
      <path d="M66 64 L74 72 L88 56" strokeWidth={3.5} />
    </svg>
  )
}
