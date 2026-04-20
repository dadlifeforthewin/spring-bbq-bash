export function CornholeGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* board (angled rectangle with hole) */}
      <path d="M20 72 L38 34 L86 34 L68 72 Z" />
      <ellipse cx={58} cy={50} rx={8} ry={4} />
      {/* two bean bags tossed near the board */}
      <rect x={18} y={74} width={16} height={12} rx={3} transform="rotate(-14 26 80)" />
      <rect x={58} y={76} width={14} height={10} rx={3} transform="rotate(8 65 81)" />
    </svg>
  )
}
