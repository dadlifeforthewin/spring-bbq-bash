import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
type Padding = 'sm' | 'md' | 'lg'

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone
  padding?: Padding
}

const toneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta/60 shadow-glow-magenta',
  cyan:    'border-neon-cyan/60    shadow-glow-cyan',
  uv:      'border-neon-uv/60      shadow-glow-uv',
  gold:    'border-neon-gold/60    shadow-glow-gold',
  mint:    'border-neon-mint/60    shadow-glow-mint',
}

const boltToneClasses: Record<Tone, string> = {
  magenta: 'bg-neon-magenta [box-shadow:0_0_10px_#FF2E93,0_0_18px_rgba(255,46,147,.5)]',
  cyan:    'bg-neon-cyan    [box-shadow:0_0_10px_#00E6F7,0_0_18px_rgba(0,230,247,.5)]',
  uv:      'bg-neon-uv      [box-shadow:0_0_10px_#9B5CFF,0_0_18px_rgba(155,92,255,.5)]',
  gold:    'bg-neon-gold    [box-shadow:0_0_10px_#FFE147,0_0_18px_rgba(255,225,71,.5)]',
  mint:    'bg-neon-mint    [box-shadow:0_0_10px_#4BE6B3,0_0_18px_rgba(75,230,179,.5)]',
}

const paddingClasses: Record<Padding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7 sm:p-9',
}

export function SignPanel({ tone = 'magenta', padding = 'md', className, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      data-role="sign-panel"
      className={clsx(
        'relative rounded-2xl border-2 bg-ink-2/70 backdrop-blur-sm',
        toneClasses[tone],
        paddingClasses[padding],
        className,
      )}
    >
      {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map((pos) => (
        <span
          key={pos}
          data-role="bolt"
          aria-hidden
          className={clsx(
            'absolute h-1.5 w-1.5 rounded-full',
            boltToneClasses[tone],
            pos,
          )}
        />
      ))}
      {children}
    </div>
  )
}
