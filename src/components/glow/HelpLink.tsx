import Link from 'next/link'
import { clsx } from './clsx'

type Props = {
  /** Defaults to /station/help — override for admin-side variants if needed. */
  href?: string
  className?: string
}

/** Compact circular ? button for the PageHead right slot.
 *  Sits alongside status chips on every station page. */
export function HelpLink({ href = '/station/help', className }: Props) {
  return (
    <Link
      href={href}
      aria-label="Open volunteer help"
      title="Help"
      className={clsx(
        'inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full',
        'border border-ink-hair bg-ink-2/70 text-paper',
        'font-display text-base font-bold leading-none',
        'hover:border-neon-cyan/55 hover:text-neon-cyan hover:shadow-[0_0_14px_rgba(0,230,247,.25)] transition-colors',
        'active:scale-[0.95] touch-manipulation',
        className,
      )}
    >
      <span aria-hidden>?</span>
    </Link>
  )
}
