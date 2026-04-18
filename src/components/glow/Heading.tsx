import { HTMLAttributes, createElement } from 'react'
import { clsx } from './clsx'

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4
  tone?: 'paper' | 'magenta' | 'cyan' | 'uv' | 'gold' | 'wordmark'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const toneClasses: Record<NonNullable<HeadingProps['tone']>, string> = {
  paper:    'text-paper',
  magenta:  'text-glow-magenta',
  cyan:     'text-glow-cyan',
  uv:       'text-glow-uv',
  gold:     'text-glow-gold',
  wordmark: 'text-wordmark',
}

const sizeClasses: Record<NonNullable<HeadingProps['size']>, string> = {
  sm:  'text-lg',
  md:  'text-2xl',
  lg:  'text-3xl sm:text-4xl',
  xl:  'text-4xl sm:text-5xl',
  '2xl': 'text-5xl sm:text-6xl md:text-7xl',
}

export function Heading({ level = 2, tone = 'paper', size = 'md', className, children, ...rest }: HeadingProps) {
  return createElement(
    `h${level}`,
    {
      ...rest,
      className: clsx('font-display tracking-display leading-[1.05]', toneClasses[tone], sizeClasses[size], className),
    },
    children,
  )
}

export function Eyebrow({ tone = 'mist', className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: 'mist' | 'magenta' | 'cyan' | 'uv' | 'gold' }) {
  const toneMap: Record<string, string> = {
    mist: 'text-mist',
    magenta: 'text-neon-magenta',
    cyan: 'text-neon-cyan',
    uv: 'text-neon-uv',
    gold: 'text-neon-gold',
  }
  return (
    <span
      {...rest}
      className={clsx('inline-block text-[11px] font-semibold uppercase tracking-[0.25em]', toneMap[tone], className)}
    >
      {children}
    </span>
  )
}
