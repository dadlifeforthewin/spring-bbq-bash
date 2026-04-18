import { ReactNode } from 'react'
import Link from 'next/link'
import { Aurora } from '@/components/glow/Aurora'
import { Eyebrow } from '@/components/glow/Heading'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  back?: { href: string; label: string }
}

export function StationShell({ eyebrow, title, subtitle, children, back }: Props) {
  return (
    <div className="relative min-h-screen">
      <Aurora className="fixed inset-0 z-0" />
      <main className="relative z-10 mx-auto max-w-xl px-5 pt-10 pb-20 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            {eyebrow && <Eyebrow tone="magenta">{eyebrow}</Eyebrow>}
            <Link
              href={back?.href ?? '/station'}
              className="text-xs font-semibold uppercase tracking-wider text-faint hover:text-neon-cyan transition"
            >
              ← {back?.label ?? 'Back to picker'}
            </Link>
          </div>
          <h1 className="font-display tracking-display text-3xl sm:text-4xl text-paper">{title}</h1>
          {subtitle && <p className="text-sm text-mist">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  )
}
