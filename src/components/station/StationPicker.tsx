'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from '@/components/glow/clsx'
import { GlyphGlow } from '@/components/glow/GlyphGlow'
import { HelpLink } from '@/components/glow/HelpLink'
import { NeonWordmark } from '@/components/glow/NeonWordmark'
import { SignPanel } from '@/components/glow/SignPanel'
import {
  ArtsCraftsGlyph,
  CakeWalkGlyph,
  CheckInGlyph,
  CheckOutGlyph,
  CleanupGlyph,
  CornholeGlyph,
  DanceCompetitionGlyph,
  DJGlyph,
  DrinksGlyph,
  FacePaintingGlyph,
  JailGlyph,
  PhotoGlyph,
  PizzaGlyph,
  PrizeWheelGlyph,
  QuietCornerGlyph,
  RoamingGlyph,
  SparkGlyph,
  VideoGamesGlyph,
} from '@/components/glow/glyphs'

type Station = { slug: string; name: string }
type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
type GlyphComponent = React.ComponentType<{ size?: number }>

const STATION_STORAGE_KEY = 'sbbq_station'

// slug → { tone, Glyph, sub, route }
const ROUTING: Record<string, { tone: Tone; Glyph: GlyphComponent; sub: string; route: string }> = {
  check_in:          { tone: 'cyan',    Glyph: CheckInGlyph,    sub: 'Scan arrivals',         route: '/station/check-in' },
  check_out:         { tone: 'mint',    Glyph: CheckOutGlyph,   sub: 'Pickup-code gate',       route: '/station/check-out' },
  drinks:            { tone: 'cyan',    Glyph: DrinksGlyph,     sub: '2 tickets per kid',      route: '/station/activity' },
  jail:              { tone: 'magenta', Glyph: JailGlyph,       sub: 'Send / free · 3 ea',     route: '/station/activity' },
  prize_wheel:       { tone: 'gold',    Glyph: PrizeWheelGlyph,       sub: 'Tap prize won',          route: '/station/prize_wheel' },
  dj_shoutout:       { tone: 'uv',      Glyph: DJGlyph,                sub: '1 song per kid',         route: '/station/activity' },
  photo:             { tone: 'magenta', Glyph: PhotoGlyph,             sub: 'Consent-gated',          route: '/station/photo' },
  roaming:           { tone: 'uv',      Glyph: RoamingGlyph,           sub: 'Auto-tag vision',        route: '/station/roaming' },
  cornhole:          { tone: 'cyan',    Glyph: CornholeGlyph,          sub: 'Log the visit',          route: '/station/activity' },
  face_painting:     { tone: 'magenta', Glyph: FacePaintingGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  arts_crafts:       { tone: 'uv',      Glyph: ArtsCraftsGlyph,        sub: 'Log the visit',          route: '/station/activity' },
  video_games:       { tone: 'uv',      Glyph: VideoGamesGlyph,        sub: 'Log the visit',          route: '/station/activity' },
  dance_competition: { tone: 'magenta', Glyph: DanceCompetitionGlyph,  sub: 'Log the visit',          route: '/station/activity' },
  pizza:             { tone: 'gold',    Glyph: PizzaGlyph,             sub: 'Log the visit',          route: '/station/activity' },
  cake_walk:         { tone: 'mint',    Glyph: CakeWalkGlyph,          sub: 'Log the visit',          route: '/station/activity' },
  quiet_corner:      { tone: 'cyan',    Glyph: QuietCornerGlyph,       sub: 'Log the visit',          route: '/station/activity' },
  cleanup:           { tone: 'gold',    Glyph: CleanupGlyph,           sub: 'End-of-night checklist', route: '/station/cleanup' },
}

// Fallback for slugs not yet in the map (unknown / future stations)
const FALLBACK = { tone: 'cyan' as Tone, Glyph: SparkGlyph, sub: 'Log the visit', route: '/station/activity' }

function routeFor(slug: string): string {
  return (ROUTING[slug] ?? FALLBACK).route
}

// Complete string literals required — Tailwind JIT cannot tree-shake dynamic interpolations.
const toneHoverText: Record<Tone, string> = {
  magenta: 'hover:text-neon-magenta',
  cyan:    'hover:text-neon-cyan',
  uv:      'hover:text-neon-uv',
  gold:    'hover:text-neon-gold',
  mint:    'hover:text-neon-mint',
}

const CACHE_KEY = 'sbbq_stations_cache_v1'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min — stations table is locked for the event

type CacheShape = { ts: number; stations: Station[] }

function readCache(): Station[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheShape
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null
    if (!Array.isArray(parsed.stations)) return null
    return parsed.stations
  } catch {
    return null
  }
}

function writeCache(stations: Station[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), stations }))
  } catch {}
}

// Optional prop: production callers (page.tsx) pass nothing and the picker
// self-fetches from /api/stations with localStorage caching. Test callers
// pass a fixed list to bypass the fetch entirely.
export default function StationPicker({ stations: stationsProp }: { stations?: Station[] } = {}) {
  const router = useRouter()
  // SSR + first-paint render with [] (or the test prop); client mount swaps
  // in the cached list so "Back to stations" feels instant.
  const [stations, setStations] = useState<Station[]>(stationsProp ?? [])

  useEffect(() => {
    // If the parent supplied stations directly, skip the fetch + cache flow.
    if (stationsProp) return

    const cached = readCache()
    if (cached) setStations(cached)

    // Always background-refresh from the API. Edge-cached for 5min so the
    // network cost is cheap; updates the localStorage copy for next nav.
    fetch('/api/stations')
      .then((r) => r.json())
      .then((data: { stations?: Station[] }) => {
        if (Array.isArray(data?.stations)) {
          setStations(data.stations)
          writeCache(data.stations)
        }
      })
      .catch(() => { /* keep cached or empty fallback */ })
  }, [stationsProp])

  // Eagerly prefetch every station route once we have the list. Volunteers
  // tap stations dozens of times per shift; warming the chunks + RSC
  // payloads upfront turns each tap from a cold network round-trip into a
  // near-instant nav.
  useEffect(() => {
    if (stations.length === 0) return
    const seen = new Set<string>()
    for (const s of stations) {
      const route = routeFor(s.slug)
      if (seen.has(route)) continue
      seen.add(route)
      router.prefetch(route)
    }
    router.prefetch('/station/help')
  }, [stations, router])

  const remember = (slug: string) => {
    try { localStorage.setItem(STATION_STORAGE_KEY, slug) } catch {}
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8">
      {/* Top bar with HelpLink — first opportunity for a volunteer to find help */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          VOLUNTEER HUB
        </span>
        <HelpLink />
      </div>
      {/* NeonWordmark hero */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-2 text-center">
        <NeonWordmark tone="cyan" size="md" as="h1">BASH &amp; GLOW</NeonWordmark>
        <p className="text-sm text-mist">Tap your station.</p>
      </div>

      {/* DB-driven glyph grid */}
      {stations.length === 0 ? (
        <SignPanel tone="magenta" padding="md">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon-magenta [font-family:var(--font-mono),JetBrains_Mono,monospace]">
            No stations
          </div>
          <p className="mt-2 text-sm text-mist leading-relaxed">
            No active stations configured. Ask an admin to seed the stations table.
          </p>
        </SignPanel>
      ) : (
        <ul className="grid grid-cols-2 gap-3" role="list">
          {stations.map((s) => {
            const meta = ROUTING[s.slug] ?? FALLBACK
            return (
              <li key={s.slug}>
                <Link
                  href={routeFor(s.slug)}
                  prefetch
                  onClick={() => remember(s.slug)}
                  className={clsx(
                    'group flex w-full flex-col items-center gap-2 rounded-2xl border bg-ink-2/60 p-4 text-center no-underline',
                    'border-ink-hair hover:border-current transition-[transform,border-color,color] duration-200',
                    'motion-safe:active:scale-[0.97] motion-safe:hover:-translate-y-0.5 touch-manipulation',
                    toneHoverText[meta.tone],
                  )}
                >
                  <GlyphGlow tone={meta.tone} size={72}>
                    <meta.Glyph size={56} />
                  </GlyphGlow>
                  <span className="font-display text-sm font-bold uppercase tracking-[0.08em] text-paper">
                    {s.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-mist">
                    {meta.sub}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
