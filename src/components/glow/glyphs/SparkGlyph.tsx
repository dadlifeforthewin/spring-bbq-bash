// Temporary fallback glyph for free-visit stations; dedicated glyphs arrive in Phase 5.5.9.
export function SparkGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* 4-pointed sparkle / spark-burst */}
      <line x1={12} y1={2} x2={12} y2={22} />
      <line x1={2} y1={12} x2={22} y2={12} />
      <line x1={5.515} y1={5.515} x2={18.485} y2={18.485} />
      <line x1={18.485} y1={5.515} x2={5.515} y2={18.485} />
      <circle cx={12} cy={12} r={2.5} />
    </svg>
  )
}
