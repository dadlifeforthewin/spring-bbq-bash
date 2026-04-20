export function CakeWalkGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* base plate */}
      <path d="M12 86 L88 86" />
      {/* bottom tier */}
      <rect x={18} y={64} width={64} height={22} rx={3} />
      {/* top tier */}
      <rect x={30} y={42} width={40} height={22} rx={3} />
      {/* drip accents on bottom tier */}
      <path d="M28 72 L28 78 M44 72 L44 78 M60 72 L60 78 M76 72 L76 78" strokeWidth={2} opacity={0.7} />
      {/* candle */}
      <path d="M50 30 L50 42" />
      {/* flame */}
      <path d="M50 20 Q56 26 50 30 Q44 26 50 20 Z" />
    </svg>
  )
}
