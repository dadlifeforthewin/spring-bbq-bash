export function ArtsCraftsGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* paper strip behind scissors */}
      <path d="M14 64 L86 28" strokeWidth={2.5} opacity={0.7} strokeDasharray="4 4" />
      {/* scissor pivot */}
      <circle cx={50} cy={50} r={3} fill="currentColor" stroke="none" />
      {/* two blades */}
      <path d="M50 50 L84 30" />
      <path d="M50 50 L84 70" />
      {/* two finger loops */}
      <circle cx={22} cy={38} r={9} />
      <circle cx={22} cy={62} r={9} />
      {/* connectors from loops to pivot */}
      <path d="M30 42 L50 50 L30 58" />
    </svg>
  )
}
