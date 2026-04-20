export function RoamingGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx={38} cy={22} r={7} />
      <path d="M38 30 L38 58 M38 40 L22 52 M38 40 L54 48 M38 58 L30 84 M38 58 L48 84" />
      <rect x={64} y={30} width={28} height={20} rx={3} />
      <circle cx={78} cy={40} r={5} strokeWidth={2} />
      <circle cx={88} cy={34} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}
