export function PhotoGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="-4 -4 108 108" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={16} y={14} width={68} height={78} rx={4} transform="rotate(-6 50 53)" />
      <rect x={22} y={20} width={56} height={46} rx={2} strokeWidth={2.5} transform="rotate(-6 50 43)" />
      <path d="M82 22 L82 32 M77 27 L87 27" strokeWidth={2.5} />
      <path d="M88 16 L88 22 M85 19 L91 19" strokeWidth={2} opacity={0.7} />
    </svg>
  )
}
