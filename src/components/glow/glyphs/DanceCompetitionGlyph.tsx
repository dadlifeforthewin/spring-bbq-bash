export function DanceCompetitionGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* head */}
      <circle cx={46} cy={20} r={7} />
      {/* torso + arms mid-move */}
      <path d="M46 28 L46 54" />
      <path d="M46 36 L28 26" />
      <path d="M46 36 L68 30" />
      {/* legs kicking */}
      <path d="M46 54 L32 78" />
      <path d="M46 54 L62 72 L74 82" />
      {/* motion arcs */}
      <path d="M78 22 Q86 30 82 42" strokeWidth={2} opacity={0.65} />
      <path d="M16 44 Q10 54 18 64" strokeWidth={2} opacity={0.65} />
    </svg>
  )
}
