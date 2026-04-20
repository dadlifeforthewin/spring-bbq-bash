// Temporary fallback glyph — Phase 5.5.9 replaces with dedicated glyphs for
// cornhole, face_painting, arts_crafts, video_games, dance_competition, pizza, cake_walk, quiet_corner.
export function SparkGlyph({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      {/* vertical arm */}
      <path d="M50 10 V90" />
      {/* horizontal arm */}
      <path d="M10 50 H90" />
      {/* diagonal arms, shorter for a 4-point primary + secondary ray feel */}
      <path d="M22 22 L78 78" strokeWidth={1.5} opacity={0.6} />
      <path d="M78 22 L22 78" strokeWidth={1.5} opacity={0.6} />
      {/* center node */}
      <circle cx="50" cy="50" r="3" fill="currentColor" />
    </svg>
  )
}
