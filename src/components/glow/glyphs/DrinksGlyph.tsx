export function DrinksGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 100" width={size} height={size * 100 / 80} fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M16 28 L22 92 Q22 96 26 96 L54 96 Q58 96 58 92 L64 28 Z" />
      <rect x={12} y={22} width={56} height={8} rx={2} />
      <rect x={38} y={4} width={6} height={20} rx={2} />
      <path d="M28 48 L52 48 M26 66 L54 66" strokeWidth={2} opacity={0.55} />
    </svg>
  )
}
