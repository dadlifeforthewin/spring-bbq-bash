import Link from 'next/link'
import { clsx } from './clsx'

export type AdminNavKey =
  | 'dashboard'
  | 'children'
  | 'stories'
  | 'photos'
  | 'stations'
  | 'prizes'
  | 'cleanup'
  | 'bulk'
  | 'settings'

type Props = {
  active: AdminNavKey
  right?: React.ReactNode
}

const LINKS: { key: AdminNavKey; href: string; label: string }[] = [
  { key: 'dashboard', href: '/admin',           label: 'Dashboard' },
  { key: 'children',  href: '/admin/children',  label: 'Children' },
  { key: 'stories',   href: '/admin/stories',   label: 'Stories' },
  { key: 'photos',    href: '/admin/photos',    label: 'Photos' },
  { key: 'stations',  href: '/admin/stations',  label: 'Stations' },
  { key: 'prizes',    href: '/admin/prizes',    label: 'Prizes' },
  { key: 'cleanup',   href: '/admin/cleanup',   label: 'Cleanup' },
  { key: 'bulk',      href: '/admin/bulk',      label: 'Bulk' },
  { key: 'settings',  href: '/admin/settings',  label: 'Settings' },
]

export function AdminNav({ active, right }: Props) {
  return (
    <nav className="flex items-center gap-6 border-b border-ink-hair/60 bg-ink-2/80 backdrop-blur-sm px-5 py-3">
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span aria-hidden className="h-2 w-2 rounded-full bg-neon-magenta shadow-glow-magenta" />
        <span className="font-display text-sm font-bold tracking-[0.08em] text-paper">LCA · BASH OPS</span>
      </span>
      <ul className="flex items-center gap-4 overflow-x-auto">
        {LINKS.map((l) => {
          const isActive = l.key === active
          return (
            <li key={l.key}>
              <Link
                href={l.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'text-[11px] font-semibold uppercase tracking-[0.14em]',
                  '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
                  'transition-colors',
                  isActive ? 'text-paper' : 'text-mist hover:text-paper',
                )}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </nav>
  )
}
