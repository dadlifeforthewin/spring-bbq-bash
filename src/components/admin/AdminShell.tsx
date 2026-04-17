import Link from 'next/link'
import { ReactNode } from 'react'

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
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="text-lg font-black text-slate-900">LCA Admin</span>
          <ul className="flex flex-wrap gap-3 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <form action="/api/auth/admin" method="post" className="ml-auto">
            {/* Fire-and-forget sign-out via DELETE — rendered as link */}
            <Link href="/" className="text-xs text-slate-500">Home</Link>
          </form>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl p-4">{children}</div>
    </div>
  )
}
