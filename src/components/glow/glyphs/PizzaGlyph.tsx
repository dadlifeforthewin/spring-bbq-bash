export function PizzaGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* outer slice (crust side curved) */}
      <path d="M50 14 L16 82 Q50 96 84 82 Z" />
      {/* inner crust line */}
      <path d="M26 76 Q50 86 74 76" strokeWidth={2.5} opacity={0.75} />
      {/* topping dots */}
      <circle cx={50} cy={40} r={4} fill="currentColor" stroke="none" />
      <circle cx={38} cy={60} r={4} fill="currentColor" stroke="none" />
      <circle cx={62} cy={60} r={4} fill="currentColor" stroke="none" />
      <circle cx={50} cy={72} r={3} fill="currentColor" stroke="none" />
    </svg>
  )
}
