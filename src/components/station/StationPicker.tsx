'use client'
import { useRouter } from 'next/navigation'
import { clsx } from '@/components/glow/clsx'
import { GlyphGlow } from '@/components/glow/GlyphGlow'
import { NeonWordmark } from '@/components/glow/NeonWordmark'
import { SignPanel } from '@/components/glow/SignPanel'
import {
  CheckInGlyph,
  CheckOutGlyph,
  DrinksGlyph,
  JailGlyph,
  PrizeWheelGlyph,
  DJGlyph,
  PhotoGlyph,
  RoamingGlyph,
  SparkGlyph,
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
  prize_wheel:       { tone: 'gold',    Glyph: PrizeWheelGlyph, sub: 'Logged at check-in',     route: '/station/activity' },
  dj_shoutout:       { tone: 'uv',      Glyph: DJGlyph,         sub: '1 song per kid',         route: '/station/activity' },
  photo:             { tone: 'magenta', Glyph: PhotoGlyph,      sub: 'Consent-gated',          route: '/station/photo' },
  roaming:           { tone: 'uv',      Glyph: RoamingGlyph,    sub: 'Auto-tag vision',        route: '/station/roaming' },
  cornhole:          { tone: 'magenta', Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  face_painting:     { tone: 'uv',      Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  arts_crafts:       { tone: 'gold',    Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  video_games:       { tone: 'cyan',    Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  dance_competition: { tone: 'magenta', Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  pizza:             { tone: 'gold',    Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  cake_walk:         { tone: 'magenta', Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
  quiet_corner:      { tone: 'uv',      Glyph: SparkGlyph,      sub: 'Log the visit',          route: '/station/activity' },
}

// Fallback for slugs not yet in the map (e.g. cleanup, prize_wheel-2 seeded in Phase 5.5)
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

export default function StationPicker({ stations }: { stations: Station[] }) {
  const router = useRouter()

  const pick = (s: Station) => {
    try { localStorage.setItem(STATION_STORAGE_KEY, s.slug) } catch {}
    router.push(routeFor(s.slug))
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8">
      {/* NeonWordmark hero */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-2 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          VOLUNTEER HUB
        </span>
        <NeonWordmark tone="cyan" size="md" as="h1">BASH &amp; GLOW</NeonWordmark>
        <p className="text-sm text-mist">Tap your station.</p>
      </div>

      {/* DB-driven glyph grid */}
      <ul className="grid grid-cols-2 gap-3" role="list">
        {stations.map((s) => {
          const meta = ROUTING[s.slug] ?? FALLBACK
          return (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => pick(s)}
                className={clsx(
                  'group flex w-full flex-col items-center gap-2 rounded-2xl border bg-ink-2/60 p-4 text-center',
                  'border-ink-hair hover:border-current transition-[transform,border-color] duration-200',
                  'active:scale-[0.97] motion-safe:hover:-translate-y-0.5',
                  toneHoverText[meta.tone],
                )}
              >
                <GlyphGlow tone={meta.tone} size={72}>
                  <meta.Glyph />
                </GlyphGlow>
                <span className="font-display text-sm font-bold uppercase tracking-[0.08em] text-paper">
                  {s.name}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-mist">
                  {meta.sub}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Quick reference */}
      <SignPanel tone="gold" padding="md">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon-gold [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          Quick reference
        </div>
        <p className="mt-2 text-sm text-mist leading-relaxed">
          Every kid arrives with 2 drinks, 3 jail/pass tokens, 1 prize-wheel spin (logged at check-in),
          and 1 DJ shoutout. Other stations just log the visit for the keepsake email.
        </p>
      </SignPanel>
    </div>
  )
}
