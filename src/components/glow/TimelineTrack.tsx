import { clsx } from './clsx'
import { Chip } from './Chip'

type State = 'done' | 'now' | 'next'
type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

export type TimelineItem = {
  time: string
  label: React.ReactNode
  state: State
  tone: Tone
}

const dotToneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta bg-ink-2',
  cyan:    'border-neon-cyan    bg-ink-2',
  uv:      'border-neon-uv      bg-ink-2',
  gold:    'border-neon-gold    bg-ink-2',
  mint:    'border-neon-mint    bg-ink-2',
}

const glowToneClasses: Record<Tone, string> = {
  magenta: 'shadow-glow-magenta',
  cyan:    'shadow-glow-cyan',
  uv:      'shadow-glow-uv',
  gold:    'shadow-glow-gold',
  mint:    'shadow-glow-mint',
}

export function TimelineTrack({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative pl-6">
      <span aria-hidden className="absolute left-[10px] top-1 bottom-1 w-[2px] rounded bg-gradient-to-b from-neon-magenta via-neon-uv to-neon-cyan opacity-70" />
      {items.map((it, i) => (
        <li key={i} className="relative mb-4 flex items-baseline gap-3">
          <span
            aria-hidden
            className={clsx(
              'absolute -left-[15px] top-1 h-[14px] w-[14px] rounded-full border-2',
              dotToneClasses[it.tone],
              it.state === 'now' && clsx(glowToneClasses[it.tone], 'motion-safe:animate-breathe'),
            )}
          />
          <span className={clsx(
            'font-display text-lg font-bold tabular-nums w-14 shrink-0',
            it.state === 'done' ? 'text-mist line-through' : 'text-paper',
          )}>
            {it.time}
          </span>
          <span className={clsx(
            'text-sm',
            it.state === 'done' ? 'text-mist line-through' : 'text-paper',
          )}>
            {it.label}
          </span>
          {it.state === 'now' && <Chip tone="gold">NOW</Chip>}
          {it.state === 'done' && <Chip tone="quiet">done</Chip>}
        </li>
      ))}
    </ol>
  )
}
