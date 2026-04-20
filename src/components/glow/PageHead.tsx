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
              'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist',
              '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
              'hover:text-paper transition-colors',
            )}
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-paper leading-tight mt-1">
          {title}
        </h1>
        {sub && <p className="text-sm text-mist leading-relaxed mt-1 max-w-prose">{sub}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  )
}
