import Link from 'next/link'
import { ReactNode } from 'react'
import { Aurora } from '@/components/glow/Aurora'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/children', label: 'Children' },
  { href: '/admin/stories', label: 'Stories' },
  { href: '/admin/bulk', label: 'Bulk' },
  { href: '/admin/stations', label: 'Stations' },
  { href: '/admin/photos', label: 'Photos' },
  { href: '/admin/photos/queue', label: 'Photo queue' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Aurora className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <nav className="border-b border-ink-hair/80 bg-ink/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-neon-magenta shadow-glow-magenta" aria-hidden />
              <span className="font-display text-base text-paper tracking-display">
                LCA Admin
              </span>
            </Link>
            <ul className="flex flex-wrap gap-1 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="rounded-full px-3 py-1.5 text-mist hover:text-paper hover:bg-ink-2 transition"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/" className="ml-auto text-xs font-semibold uppercase tracking-widest text-faint hover:text-neon-cyan transition">
              Home
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-6xl p-5">{children}</div>
      </div>
    </div>
  )
}
