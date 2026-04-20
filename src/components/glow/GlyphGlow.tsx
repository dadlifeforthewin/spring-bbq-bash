import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = {
  tone: Tone
  size?: number
  className?: string
  children: React.ReactNode
}

const toneClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta',
  cyan:    'text-neon-cyan',
  uv:      'text-neon-uv',
  gold:    'text-neon-gold',
  mint:    'text-neon-mint',
}

const toneHexes: Record<Tone, { solid: string; faint: string }> = {
  magenta: { solid: '#FF2E93', faint: 'rgba(255,46,147,.55)' },
  cyan:    { solid: '#00E6F7', faint: 'rgba(0,230,247,.55)' },
  uv:      { solid: '#9B5CFF', faint: 'rgba(155,92,255,.55)' },
  gold:    { solid: '#FFE147', faint: 'rgba(255,225,71,.55)' },
  mint:    { solid: '#4BE6B3', faint: 'rgba(75,230,179,.55)' },
}

export function GlyphGlow({ tone, size = 80, className, children }: Props) {
  const { solid, faint } = toneHexes[tone]
  return (
    <span
      className={clsx('inline-grid place-items-center', toneClasses[tone], className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: `drop-shadow(0 0 4px ${solid}) drop-shadow(0 0 14px ${faint})`,
      }}
    >
      {children}
    </span>
  )
}
