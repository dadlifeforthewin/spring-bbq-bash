export function VideoGamesGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* controller silhouette */}
      <path d="M24 36 Q14 36 12 50 L10 68 Q10 80 22 80 Q30 80 34 72 L36 68 L64 68 L66 72 Q70 80 78 80 Q90 80 90 68 L88 50 Q86 36 76 36 Z" />
      {/* D-pad cross */}
      <path d="M26 54 L34 54 M30 50 L30 58" strokeWidth={3.5} />
      {/* two buttons */}
      <circle cx={68} cy={50} r={3.5} fill="currentColor" stroke="none" />
      <circle cx={78} cy={58} r={3.5} fill="currentColor" stroke="none" />
    </svg>
  )
}
