'use client'
import { useRouter } from 'next/navigation'
import { StationShell } from './StationShell'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'
import { clsx } from '@/components/glow/clsx'

type Station = { slug: string; name: string }

const STATION_STORAGE_KEY = 'sbbq_station'

// slug → {route, tone, emoji}
const ROUTING: Record<string, { route: string; tone: 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'; emoji: string }> = {
  check_in:          { route: '/station/check-in',  tone: 'cyan',    emoji: '👋' },
  check_out:         { route: '/station/check-out', tone: 'mint',    emoji: '🚪' },
  jail:              { route: '/station/activity',  tone: 'magenta', emoji: '🚨' },
  drinks:            { route: '/station/activity',  tone: 'cyan',    emoji: '🥤' },
  prize_wheel:       { route: '/station/activity',  tone: 'gold',    emoji: '🎡' },
  dj_shoutout:       { route: '/station/activity',  tone: 'uv',      emoji: '📻' },
  cornhole:          { route: '/station/activity',  tone: 'magenta', emoji: '🌽' },
  face_painting:     { route: '/station/activity',  tone: 'uv',      emoji: '🎨' },
  arts_crafts:       { route: '/station/activity',  tone: 'gold',    emoji: '✂️' },
  video_games:       { route: '/station/activity',  tone: 'cyan',    emoji: '🎮' },
  dance_competition: { route: '/station/activity',  tone: 'magenta', emoji: '💃' },
  pizza:             { route: '/station/activity',  tone: 'gold',    emoji: '🍕' },
  cake_walk:         { route: '/station/activity',  tone: 'magenta', emoji: '🍰' },
  quiet_corner:      { route: '/station/activity',  tone: 'uv',      emoji: '📽️' },
  roaming:           { route: '/station/roaming',   tone: 'uv',      emoji: '📸' },
  photo:             { route: '/station/photo',     tone: 'magenta', emoji: '✨' },
}

function routeFor(slug: string): string {
  return ROUTING[slug]?.route ?? '/station/activity'
}

export default function StationPicker({ stations }: { stations: Station[] }) {
  const router = useRouter()

  const pick = (s: Station) => {
    try {
      localStorage.setItem(STATION_STORAGE_KEY, s.slug)
    } catch {
      // localStorage unavailable — proceed
    }
    router.push(routeFor(s.slug))
  }

  const borderTone: Record<string, string> = {
    magenta: 'hover:border-neon-magenta/60 hover:shadow-glow-magenta',
    cyan:    'hover:border-neon-cyan/60 hover:shadow-glow-cyan',
    uv:      'hover:border-neon-uv/60 hover:shadow-glow-uv',
    gold:    'hover:border-neon-gold/60 hover:shadow-glow-gold',
    mint:    'hover:border-neon-mint/60 hover:shadow-glow-mint',
  }

  return (
    <StationShell
      eyebrow="Volunteer · Picker"
      title="Pick your station"
      subtitle="Tap once. The app remembers, so scans go straight to your post next time."
      back={{ href: '/', label: 'Home' }}
    >
      <ul className="grid grid-cols-2 gap-3">
        {stations.map((s) => {
          const meta = ROUTING[s.slug] ?? { tone: 'cyan', emoji: '•' }
          return (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => pick(s)}
                className={clsx(
                  'group h-28 w-full rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm px-4 py-3 text-left transition',
                  borderTone[meta.tone],
                )}
              >
                <div className="text-2xl leading-none mb-2" aria-hidden>{meta.emoji}</div>
                <div className="font-display text-sm font-semibold text-paper leading-tight">
                  {s.name}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-faint">
                  {s.slug.replace(/_/g, ' ')}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <Card tone="default" padded className="text-xs text-mist leading-relaxed">
        <CardEyebrow className="text-neon-gold">Quick reference</CardEyebrow>
        <CardTitle className="font-sans text-sm text-paper font-normal">
          Every kid arrives with 2 drinks, 3 jail/pass tokens, 1 prize-wheel spin, and 1 DJ shoutout.
          Other stations just need a scan to log the visit for the keepsake email.
        </CardTitle>
      </Card>
    </StationShell>
  )
}
