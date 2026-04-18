import { HTMLAttributes } from 'react'
import { clsx } from './clsx'

type SectionProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string
  title?: React.ReactNode
  description?: React.ReactNode
  size?: 'md' | 'lg'
}

export function Section({ eyebrow, title, description, size = 'md', className, children, ...rest }: SectionProps) {
  return (
    <section {...rest} className={clsx('space-y-4', className)}>
      {(eyebrow || title || description) && (
        <header className="space-y-1.5">
          {eyebrow && (
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-mist">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className={clsx(
              'font-display tracking-display text-paper',
              size === 'md' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
            )}>
              {title}
            </h2>
          )}
          {description && <p className="text-sm text-mist max-w-prose leading-relaxed">{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={clsx('h-px w-full bg-gradient-to-r from-transparent via-ink-hair to-transparent', className)}
      aria-hidden
    />
  )
}
