import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

export type GlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone
  size?: Size
  fullWidth?: boolean
  loading?: boolean
}

const toneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta/80 text-neon-magenta shadow-glow-magenta hover:bg-neon-magenta/10 focus-visible:ring-neon-magenta/40',
  cyan:    'border-neon-cyan/80 text-neon-cyan shadow-glow-cyan hover:bg-neon-cyan/10 focus-visible:ring-neon-cyan/40',
  uv:      'border-neon-uv/80 text-neon-uv shadow-glow-uv hover:bg-neon-uv/10 focus-visible:ring-neon-uv/40',
  gold:    'border-neon-gold/80 text-neon-gold shadow-glow-gold hover:bg-neon-gold/10 focus-visible:ring-neon-gold/40',
  mint:    'border-neon-mint/80 text-neon-mint shadow-glow-mint hover:bg-neon-mint/10 focus-visible:ring-neon-mint/40',
  ghost:   'border-ink-hair text-paper hover:bg-ink-2 focus-visible:ring-paper/30',
  danger:  'border-danger/80 text-danger hover:bg-danger/10 focus-visible:ring-danger/40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs tracking-wider uppercase',
  md: 'h-11 px-4 text-sm tracking-wider uppercase',
  lg: 'h-12 px-5 text-base tracking-wide uppercase',
  xl: 'h-14 px-6 text-base tracking-wide uppercase',
}

export const Button = forwardRef<HTMLButtonElement, GlowButtonProps>(function Button(
  { tone = 'magenta', size = 'md', fullWidth, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 rounded-full border-2 bg-ink/70 backdrop-blur-sm font-display font-semibold transition',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-transparent',
        'focus-visible:outline-none focus-visible:ring-4',
        toneClasses[tone],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      <span>{children}</span>
    </button>
  )
})
