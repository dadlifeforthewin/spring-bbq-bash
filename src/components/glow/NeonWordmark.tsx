import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint' | 'paper'
type Size = 'sm' | 'md' | 'lg' | 'xl'

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone
  size?: Size
  as?: 'span' | 'h1' | 'h2'
}

const toneClasses: Record<Tone, string> = {
  magenta: 'text-neon-magenta [text-shadow:0_0_6px_#FF2E93,0_0_14px_#FF2E93,0_0_28px_rgba(255,46,147,.6),0_0_44px_rgba(255,46,147,.35)]',
  cyan:    'text-neon-cyan    [text-shadow:0_0_6px_#00E6F7,0_0_14px_#00E6F7,0_0_28px_rgba(0,230,247,.6),0_0_44px_rgba(0,230,247,.35)]',
  uv:      'text-neon-uv      [text-shadow:0_0_6px_#9B5CFF,0_0_14px_#9B5CFF,0_0_28px_rgba(155,92,255,.6),0_0_44px_rgba(155,92,255,.35)]',
  gold:    'text-neon-gold    [text-shadow:0_0_6px_#FFE147,0_0_14px_#FFE147,0_0_28px_rgba(255,225,71,.6),0_0_44px_rgba(255,225,71,.35)]',
  mint:    'text-neon-mint    [text-shadow:0_0_6px_#4BE6B3,0_0_14px_#4BE6B3,0_0_28px_rgba(75,230,179,.6),0_0_44px_rgba(75,230,179,.35)]',
  paper:   'text-paper        [text-shadow:0_0_6px_#F5F2FF,0_0_14px_rgba(245,242,255,.7)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-7xl sm:text-8xl',
}

export function NeonWordmark({
  tone = 'magenta',
  size = 'md',
  as = 'span',
  className,
  children,
  ...rest
}: Props) {
  const Tag = as as any
  return (
    <Tag
      {...rest}
      className={clsx(
        '[font-family:var(--font-monoton),Monoton,monospace] tracking-[0.04em] leading-[1]',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </Tag>
  )
}
