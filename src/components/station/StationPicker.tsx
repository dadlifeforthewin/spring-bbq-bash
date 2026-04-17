'use client'
import { useRouter } from 'next/navigation'

type Station = { slug: string; name: string }

const STATION_STORAGE_KEY = 'sbbq_station'

function routeFor(slug: string): string {
  if (slug === 'check_in') return '/station/check-in'
  if (slug === 'check_out') return '/station/check-out'
  if (slug === 'jail') return '/station/photo'
  return '/station/spend'
}

export default function StationPicker({ stations }: { stations: Station[] }) {
  const router = useRouter()

  const pick = (s: Station) => {
    try {
      localStorage.setItem(STATION_STORAGE_KEY, s.slug)
    } catch {
      // localStorage unavailable — proceed; spend page will prompt to reselect
    }
    router.push(routeFor(s.slug))
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <header>
        <h1 className="text-3xl font-black">Pick your station</h1>
        <p className="text-slate-600">Tap the station you&apos;re working at tonight.</p>
      </header>

      <ul className="grid grid-cols-2 gap-3">
        {stations.map((s) => (
          <li key={s.slug}>
            <button
              type="button"
              onClick={() => pick(s)}
              className="h-24 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-left text-base font-bold text-slate-900 transition hover:border-fuchsia-500 hover:bg-fuchsia-50"
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
