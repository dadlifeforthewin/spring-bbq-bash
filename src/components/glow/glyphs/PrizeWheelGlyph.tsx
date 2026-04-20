export function PrizeWheelGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden>
      <circle cx={50} cy={54} r={36} />
      <line x1={50} y1={18} x2={50} y2={90} strokeWidth={2} />
      <line x1={18} y1={36} x2={82} y2={72} strokeWidth={2} />
      <line x1={18} y1={72} x2={82} y2={36} strokeWidth={2} />
      <circle cx={50} cy={54} r={5} fill="currentColor" stroke="none" />
      <path d="M44 8 L56 8 L50 22 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
