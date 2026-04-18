import { clsx } from './clsx'

type Props = {
  size?: number
  tone?: 'cyan' | 'magenta' | 'uv' | 'gold'
  className?: string
}

const toneMap: Record<NonNullable<Props['tone']>, { color: string; glow: string }> = {
  cyan:    { color: '#00E6F7', glow: 'rgba(0,230,247,.6)' },
  magenta: { color: '#FF2E93', glow: 'rgba(255,46,147,.6)' },
  uv:      { color: '#9B5CFF', glow: 'rgba(155,92,255,.6)' },
  gold:    { color: '#FFE147', glow: 'rgba(255,225,71,.6)' },
}

/**
 * Glowing cross — the faith cue already present on the LCA flyer, reinterpreted for the site.
 * Keep small + used sparingly. Accompanies the brand lock-up, not the whole page.
 */
export function GlowCross({ size = 64, tone = 'cyan', className }: Props) {
  const { color, glow } = toneMap[tone]
  return (
    <span
      aria-hidden
      className={clsx('relative inline-block align-middle', className)}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 animate-pulse-glow"
        style={{
          boxShadow: `0 0 ${size / 2}px ${glow}, 0 0 ${size}px ${glow.replace('.6', '.25')}`,
          borderRadius: '50%',
          opacity: 0.9,
        }}
      />
      <svg
        viewBox="0 0 24 36"
        width={size}
        height={size}
        className="relative"
        style={{ filter: `drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 20px ${glow.replace('.6', '.35')})` }}
      >
        <path
          d="M9 0h6v12h9v6h-9v18h-6V18H0v-6h9z"
          fill={color}
          opacity="0.98"
        />
      </svg>
    </span>
  )
}
