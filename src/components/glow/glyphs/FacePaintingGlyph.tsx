export function FacePaintingGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* palette */}
      <path d="M18 52 Q18 26 44 26 Q70 26 70 48 Q70 58 60 58 Q54 58 54 64 Q54 72 46 72 Q18 72 18 52 Z" />
      {/* paint dabs on palette */}
      <circle cx={30} cy={44} r={3} fill="currentColor" stroke="none" />
      <circle cx={44} cy={38} r={3} fill="currentColor" stroke="none" />
      <circle cx={58} cy={46} r={3} fill="currentColor" stroke="none" />
      {/* brush angled to the corner */}
      <path d="M72 64 L88 80" />
      <path d="M66 58 L72 64 L78 70 L84 64 Z" />
    </svg>
  )
}
