import { HTMLAttributes } from 'react'
import Link from 'next/link'
import { clsx } from './clsx'

type Props = HTMLAttributes<HTMLElement> & {
  title: React.ReactNode
  sub?: React.ReactNode
  back?: { href: string; label: string }
  right?: React.ReactNode
}

export function PageHead({ title, sub, back, right, className, ...rest }: Props) {
  return (
    <header
      {...rest}
      className={clsx(
        'flex items-start justify-between gap-4 border-b border-ink-hair/60 pb-4',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        {back && (
          <Link
            href={back.href}
            className={clsx(
              'inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border border-ink-hair bg-ink-2/70 px-3 py-2',
              'text-xs font-semibold uppercase tracking-[0.16em] text-paper',
              '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
              'hover:border-neon-cyan/50 hover:text-neon-cyan hover:shadow-[0_0_14px_rgba(0,230,247,.25)] transition-colors',
              'active:scale-[0.98] touch-manipulation',
            )}
            aria-label={`Back to ${back.label}`}
          >
            <span aria-hidden className="text-base leading-none">←</span>
            <span>Back to {back.label}</span>
          </Link>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-paper leading-tight mt-3">
          {title}
        </h1>
        {sub && <p className="text-sm text-mist leading-relaxed mt-1 max-w-prose">{sub}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  )
}
