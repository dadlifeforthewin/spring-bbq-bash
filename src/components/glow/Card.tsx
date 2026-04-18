import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'raised' | 'outline' | 'glow-magenta' | 'glow-cyan' | 'glow-uv' | 'glow-gold' | 'glow-mint'
  padded?: boolean
}

const toneClasses: Record<NonNullable<CardProps['tone']>, string> = {
  default:       'bg-ink-2/70 border-ink-hair',
  raised:        'bg-ink-3/70 border-ink-hair shadow-card',
  outline:       'bg-ink/40 border-ink-hair',
  'glow-magenta': 'bg-ink-2/70 border-neon-magenta/40 shadow-glow-magenta',
  'glow-cyan':    'bg-ink-2/70 border-neon-cyan/40 shadow-glow-cyan',
  'glow-uv':      'bg-ink-2/70 border-neon-uv/40 shadow-glow-uv',
  'glow-gold':    'bg-ink-2/70 border-neon-gold/40 shadow-glow-gold',
  'glow-mint':    'bg-ink-2/70 border-neon-mint/40 shadow-glow-mint',
}

export function Card({ tone = 'default', padded = true, className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-2xl border backdrop-blur-sm',
        toneClasses[tone],
        padded && 'p-5',
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={clsx('mb-3', className)} />
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...rest} className={clsx('font-display text-lg text-paper tracking-display', className)} />
}

export function CardEyebrow({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={clsx('block text-xs uppercase tracking-widest text-mist', className)} />
}
