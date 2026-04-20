import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = HTMLAttributes<HTMLDivElement> & {
  label: React.ReactNode
  value: React.ReactNode
  tone?: Tone
  outline?: boolean
}

const toneValueClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta [text-shadow:0_0_6px_#FF2E93,0_0_14px_rgba(255,46,147,.5)]',
  cyan:    'text-neon-cyan    [text-shadow:0_0_6px_#00E6F7,0_0_14px_rgba(0,230,247,.5)]',
  uv:      'text-neon-uv      [text-shadow:0_0_6px_#9B5CFF,0_0_14px_rgba(155,92,255,.5)]',
  gold:    'text-neon-gold    [text-shadow:0_0_6px_#FFE147,0_0_14px_rgba(255,225,71,.5)]',
  mint:    'text-neon-mint    [text-shadow:0_0_6px_#4BE6B3,0_0_14px_rgba(75,230,179,.5)]',
}

const toneBorderClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta/40',
  cyan:    'border-neon-cyan/40',
  uv:      'border-neon-uv/40',
  gold:    'border-neon-gold/40',
  mint:    'border-neon-mint/40',
}

export function StatTile({ label, value, tone = 'cyan', outline = false, className, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-xl border bg-ink-2/60 p-4 flex flex-col gap-1',
        toneBorderClasses[tone],
        outline && 'bg-transparent',
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
        {label}
      </span>
      <span
        className={clsx(
          'font-display text-4xl font-bold leading-none tabular-nums',
          toneValueClasses[tone],
        )}
      >
        {value}
      </span>
    </div>
  )
}
