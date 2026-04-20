import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'mist'

type Props = HTMLAttributes<HTMLDivElement> & {
  num: string
  title: React.ReactNode
  tone?: Tone
}

const toneClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta',
  cyan:    'text-neon-cyan',
  uv:      'text-neon-uv',
  gold:    'text-neon-gold',
  mint:    'text-neon-mint',
  mist:    'text-mist',
}

const ruleToneClasses: Record<Tone, string> = {
  magenta: 'via-neon-magenta/40',
  cyan:    'via-neon-cyan/40',
  uv:      'via-neon-uv/40',
  gold:    'via-neon-gold/40',
  mint:    'via-neon-mint/40',
  mist:    'via-ink-hair',
}

export function SectionHeading({ num, title, tone = 'cyan', className, ...rest }: Props) {
  return (
    <div {...rest} className={clsx('flex items-baseline gap-3', className)}>
      <span
        className={clsx(
          'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
          '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
          toneClasses[tone],
          'border-current/40',
        )}
      >
        {num}
      </span>
      <h3 className="font-display text-lg font-bold tracking-tight text-paper">{title}</h3>
      <span
        data-role="rule"
        className={clsx(
          'h-px flex-1 bg-gradient-to-r from-transparent to-transparent',
          ruleToneClasses[tone],
        )}
      />
    </div>
  )
}
