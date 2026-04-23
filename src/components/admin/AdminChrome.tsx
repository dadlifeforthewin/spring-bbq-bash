'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Aurora, AdminNav, Chip } from '@/components/glow'
import type { AdminNavKey } from '@/components/glow'

function pathToKey(path: string): AdminNavKey {
  if (path.startsWith('/admin/children')) return 'children'
  if (path.startsWith('/admin/stories')) return 'stories'
  if (path.startsWith('/admin/photos')) return 'photos'
  if (path.startsWith('/admin/stations')) return 'stations'
  if (path.startsWith('/admin/prizes')) return 'prizes'
  if (path.startsWith('/admin/cleanup')) return 'cleanup'
  if (path.startsWith('/admin/bulk')) return 'bulk'
  if (path.startsWith('/admin/wristbands')) return 'wristbands'
  if (path.startsWith('/admin/settings')) return 'settings'
  return 'dashboard'
}

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/admin'
  const [checkedIn, setCheckedIn] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (alive && typeof data?.counts?.checked_in === 'number') {
          setCheckedIn(data.counts.checked_in)
        }
      } catch {}
    }
    fetchStats()
    const id = setInterval(fetchStats, 5000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="relative min-h-dvh">
      <Aurora className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <AdminNav
          active={pathToKey(pathname)}
          right={
            <Chip tone="mint" glow>
              LIVE · {checkedIn ?? '—'} ONSITE
            </Chip>
          }
        />
        <div className="mx-auto max-w-6xl p-5">{children}</div>
      </div>
    </div>
  )
}
