import { ReactNode } from 'react'
import { Card, CardEyebrow } from '@/components/glow/Card'
import { Chip } from '@/components/glow/Chip'
import { clsx } from '@/components/glow/clsx'

type ChildForCard = {
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
  allergies: string | null
  photo_consent_app: boolean
  drink_tickets_remaining?: number | null
  jail_tickets_remaining?: number | null
  prize_wheel_used_at?: string | null
  dj_shoutout_used_at?: string | null
}

type ParentForCard = {
  name: string
  phone: string | null
}

export default function ChildCard({
  child,
  primary_parent,
  children,
}: {
  child: ChildForCard
  primary_parent: ParentForCard
  children?: ReactNode
}) {
  const phone = primary_parent.phone ?? ''
  const tone = child.photo_consent_app ? 'glow-mint' : 'glow-magenta'

  return (
    <Card tone={tone} padded={false} className="overflow-hidden">
      {/* Consent banner */}
      <div
        data-testid="consent-banner"
        className={clsx(
          'px-4 py-2 text-center text-xs font-black uppercase tracking-[0.3em]',
          child.photo_consent_app
            ? 'bg-neon-mint/10 text-neon-mint'
            : 'bg-danger/15 text-danger',
        )}
      >
        {child.photo_consent_app ? '✅ Photos OK' : '🚫 No Photos — Do Not Include'}
      </div>

      <div className="p-5 space-y-4">
        {/* Name + meta */}
        <header className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-display text-paper leading-tight">
            {child.first_name} {child.last_name}
          </h2>
          <div className="text-xs text-mist">
            {child.age != null && <span className="mr-2">Age {child.age}</span>}
            {child.grade && <span>Grade {child.grade}</span>}
          </div>
        </header>

        {/* Allergies */}
        {child.allergies?.trim() && (
          <div
            data-testid="allergies-banner"
            className="rounded-lg bg-warn/15 px-3 py-2 text-sm font-semibold text-warn border border-warn/30"
          >
            ⚠️ Allergies / medical: {child.allergies}
          </div>
        )}

        {/* Parent contact */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-hair bg-ink-3/40 px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-faint">Parent</div>
            <div className="truncate font-semibold text-paper text-sm">{primary_parent.name}</div>
          </div>
          {phone && (
            <div className="flex shrink-0 gap-2">
              <a
                href={`tel:${phone}`}
                className="rounded-full border border-neon-cyan/60 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan hover:shadow-glow-cyan transition"
              >
                📞 Call
              </a>
              <a
                href={`sms:${phone}`}
                className="rounded-full border border-neon-cyan/60 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan hover:shadow-glow-cyan transition"
              >
                💬 Text
              </a>
            </div>
          )}
        </div>

        {/* Perks balance */}
        <div className="flex flex-wrap gap-1.5">
          <PerkChip
            label="drinks"
            value={child.drink_tickets_remaining ?? 0}
            tone="cyan"
            zero={child.drink_tickets_remaining === 0}
          />
          <PerkChip
            label="jail / pass"
            value={child.jail_tickets_remaining ?? 0}
            tone="magenta"
            zero={child.jail_tickets_remaining === 0}
          />
          <PerkChip
            label="prize wheel"
            value={child.prize_wheel_used_at ? 'used' : 1}
            tone="gold"
            zero={!!child.prize_wheel_used_at}
          />
          <PerkChip
            label="DJ shoutout"
            value={child.dj_shoutout_used_at ? 'used' : 1}
            tone="uv"
            zero={!!child.dj_shoutout_used_at}
          />
        </div>

        {children && <div className="pt-2">{children}</div>}
      </div>
    </Card>
  )
}

function PerkChip({
  label,
  value,
  tone,
  zero,
}: {
  label: string
  value: number | string
  tone: 'cyan' | 'magenta' | 'gold' | 'uv'
  zero: boolean
}) {
  return (
    <Chip tone={zero ? 'quiet' : tone} glow={!zero} className={zero ? 'line-through opacity-70' : undefined}>
      {typeof value === 'number' ? value : value} <span className="font-normal normal-case tracking-normal opacity-80">{label}</span>
    </Chip>
  )
}
