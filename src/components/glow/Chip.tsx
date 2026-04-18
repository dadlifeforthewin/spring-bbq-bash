import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'danger' | 'warn' | 'quiet'

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone
  glow?: boolean
}

const toneMap: Record<Tone, string> = {
  magenta: 'border-neon-magenta/60 text-neon-magenta',
  cyan:    'border-neon-cyan/60 text-neon-cyan',
  uv:      'border-neon-uv/60 text-neon-uv',
  gold:    'border-neon-gold/60 text-neon-gold',
  mint:    'border-neon-mint/60 text-neon-mint',
  danger:  'border-danger/60 text-danger',
  warn:    'border-warn/60 text-warn',
  quiet:   'border-ink-hair text-mist',
}

const glowMap: Record<Tone, string> = {
  magenta: 'shadow-glow-magenta',
  cyan:    'shadow-glow-cyan',
  uv:      'shadow-glow-uv',
  gold:    'shadow-glow-gold',
  mint:    'shadow-glow-mint',
  danger:  'shadow-[0_0_14px_rgba(255,91,122,.35)]',
  warn:    'shadow-[0_0_14px_rgba(255,176,87,.35)]',
  quiet:   '',
}

export function Chip({ tone = 'quiet', glow = false, className, children, ...rest }: ChipProps) {
  return (
    <span
      {...rest}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border bg-ink-2/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider',
        toneMap[tone],
        glow && glowMap[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
