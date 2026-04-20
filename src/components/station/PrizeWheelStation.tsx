'use client'
import { useEffect, useRef, useState } from 'react'
import {
  PageHead,
  NeonScanner,
  SignPanel,
  Input,
  Button,
  Chip,
  GlyphGlow,
} from '@/components/glow'
import { PrizeWheelGlyph } from '@/components/glow/glyphs'

// ---- shapes ----
type Prize = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

type LookupChild = {
  id: string
  first_name: string
  last_name: string
  photo_consent_app: boolean
  prize_wheel_used_at: string | null
  checked_in_at: string | null
  checked_out_at: string | null
}

type LookupPayload = {
  child: LookupChild
  redemption: {
    id: string
    prize_id: string
    volunteer_name: string | null
    updated_at: string
  } | null
  prize_label: string | null
}

// The state machine drives the entire view: idle -> loading -> grid | already_redeemed | error
// Tapping a chip flips to 'affirming' for 2 seconds, then back to idle.
// 'update_mode' is the special grid variant where the current prize is marked selected.
type UiState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'grid'; payload: LookupPayload }
  | { kind: 'already_redeemed'; payload: LookupPayload }
  | { kind: 'update_mode'; payload: LookupPayload }
  | { kind: 'affirming'; childName: string; prizeLabel: string; updated: boolean }

const AFFIRM_MS = 2000

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function PrizeWheelStation() {
  const [prizes, setPrizes] = useState<Prize[] | null>(null)
  const [prizesLoaded, setPrizesLoaded] = useState(false)
  const [qr, setQr] = useState('')
  const [volunteer, setVolunteer] = useState('')
  const [ui, setUi] = useState<UiState>({ kind: 'idle' })
  const [posting, setPosting] = useState(false)
  const affirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the active prize catalog once on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/stations/prize-wheel/prizes')
        if (!res.ok) {
          if (!cancelled) {
            setPrizes([])
            setPrizesLoaded(true)
          }
          return
        }
        const body = (await res.json()) as { prizes: Prize[] }
        if (!cancelled) {
          setPrizes(body.prizes)
          setPrizesLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setPrizes([])
          setPrizesLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Clear any pending affirmation timer on unmount.
  useEffect(() => {
    return () => {
      if (affirmTimerRef.current) {
        clearTimeout(affirmTimerRef.current)
        affirmTimerRef.current = null
      }
    }
  }, [])

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = qr.trim()
    if (!trimmed) return
    setUi({ kind: 'loading' })
    try {
      // Step 1: resolve the QR to a child via existing endpoint.
      const childRes = await fetch(`/api/children/by-qr/${encodeURIComponent(trimmed)}`)
      if (!childRes.ok) {
        const body = await childRes.json().catch(() => ({}))
        setUi({ kind: 'error', message: body.error ?? 'Child not found' })
        return
      }
      const childBody = (await childRes.json()) as { child: { id: string } }

      // Step 2: fetch prize-wheel-specific state (redemption + prize label).
      const lookupRes = await fetch(
        `/api/stations/prize-wheel/lookup?child_id=${encodeURIComponent(childBody.child.id)}`,
      )
      if (!lookupRes.ok) {
        const body = await lookupRes.json().catch(() => ({}))
        setUi({ kind: 'error', message: body.error ?? 'Lookup failed' })
        return
      }
      const payload = (await lookupRes.json()) as LookupPayload
      if (payload.redemption) {
        setUi({ kind: 'already_redeemed', payload })
      } else {
        setUi({ kind: 'grid', payload })
      }
    } catch {
      setUi({ kind: 'error', message: 'Network error' })
    }
  }

  function resetToIdle() {
    setQr('')
    setUi({ kind: 'idle' })
  }

  async function redeem(prize: Prize) {
    if (ui.kind !== 'grid' && ui.kind !== 'update_mode') return
    const payload = ui.payload
    setPosting(true)
    try {
      const res = await fetch('/api/stations/prize-wheel/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: payload.child.id,
          prize_id: prize.id,
          volunteer_name: volunteer.trim() || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUi({ kind: 'error', message: (body as { error?: string }).error ?? 'Redeem failed' })
        return
      }
      const responseBody = body as { prize: { id: string; label: string }; updated: boolean }
      // Kick over to the affirmation card. Auto-clear after 2s.
      setUi({
        kind: 'affirming',
        childName: `${payload.child.first_name} ${payload.child.last_name}`,
        prizeLabel: responseBody.prize.label,
        updated: responseBody.updated,
      })
      affirmTimerRef.current = setTimeout(() => {
        affirmTimerRef.current = null
        resetToIdle()
      }, AFFIRM_MS)
    } finally {
      setPosting(false)
    }
  }

  // ---- render branches ----
  const scanning = ui.kind === 'idle' || ui.kind === 'loading'

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="PRIZE WHEEL"
        sub="Scan kid · tap the prize they won."
        right={<Chip tone="gold" glow>ONE · PER KID</Chip>}
      />

      <div className="flex justify-center py-1">
        <GlyphGlow tone="gold" size={120}>
          <PrizeWheelGlyph size={100} />
        </GlyphGlow>
      </div>

      {/* Empty-catalog gate — the rest of the station is meaningless without prizes. */}
      {prizesLoaded && (prizes?.length ?? 0) === 0 ? (
        <SignPanel tone="gold">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neon-gold [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              Empty catalog
            </div>
            <p className="font-display text-xl text-paper">No prizes configured</p>
            <p className="text-sm text-mist">
              Open <code className="rounded bg-ink-2 px-1.5 py-0.5 text-neon-cyan">/admin/prizes</code> to add them.
            </p>
          </div>
        </SignPanel>
      ) : scanning ? (
        <NeonScanner
          tone="gold"
          aspect="portrait"
          scanning={ui.kind === 'idle'}
          hint={ui.kind === 'loading' ? 'Looking up…' : 'Scan wristband or paste QR'}
        >
          <form onSubmit={doLookup} className="flex w-full max-w-xs flex-col gap-3 px-4">
            <Input
              type="text"
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="QR / wristband code"
              aria-label="QR code"
              autoFocus
              disabled={ui.kind === 'loading'}
            />
            <Button
              type="submit"
              tone="gold"
              fullWidth
              loading={ui.kind === 'loading'}
              disabled={!qr.trim() || ui.kind === 'loading'}
            >
              Look up
            </Button>
          </form>
        </NeonScanner>
      ) : ui.kind === 'error' ? (
        <div className="space-y-3">
          <SignPanel tone="magenta">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neon-magenta [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                Scan blocked
              </div>
              <p className="text-sm text-paper">{ui.message}</p>
            </div>
          </SignPanel>
          <Button tone="ghost" size="md" fullWidth onClick={resetToIdle}>
            Scan again
          </Button>
        </div>
      ) : ui.kind === 'already_redeemed' ? (
        <AlreadyRedeemedCard
          payload={ui.payload}
          onChange={() => setUi({ kind: 'update_mode', payload: ui.payload })}
          onScanNext={resetToIdle}
        />
      ) : ui.kind === 'grid' || ui.kind === 'update_mode' ? (
        <ChipGrid
          prizes={prizes ?? []}
          currentPrizeId={
            ui.kind === 'update_mode' ? ui.payload.redemption?.prize_id ?? null : null
          }
          childName={`${ui.payload.child.first_name} ${ui.payload.child.last_name}`}
          volunteer={volunteer}
          setVolunteer={setVolunteer}
          posting={posting}
          onPick={redeem}
          onCancel={resetToIdle}
          isUpdate={ui.kind === 'update_mode'}
        />
      ) : ui.kind === 'affirming' ? (
        <AffirmationCard childName={ui.childName} prizeLabel={ui.prizeLabel} updated={ui.updated} />
      ) : null}
    </main>
  )
}

// ---- sub-components ----

function AlreadyRedeemedCard({
  payload,
  onChange,
  onScanNext,
}: {
  payload: LookupPayload
  onChange: () => void
  onScanNext: () => void
}) {
  const time = fmtTime(payload.redemption?.updated_at ?? null)
  return (
    <div className="space-y-3">
      <SignPanel tone="gold" padding="lg">
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon-gold [font-family:var(--font-mono),JetBrains_Mono,monospace]">
            Already redeemed
          </div>
          <h2 className="font-display text-3xl font-bold text-paper leading-tight">
            {payload.prize_label ?? '—'}
          </h2>
          <p className="text-sm text-mist">
            {payload.child.first_name} {payload.child.last_name}
            {time ? ` · ${time}` : ''}
          </p>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onChange}
              className="text-[11px] font-semibold uppercase tracking-wider text-neon-cyan hover:text-paper transition [font-family:var(--font-mono),JetBrains_Mono,monospace]"
            >
              [ Change prize ]
            </button>
          </div>
        </div>
      </SignPanel>
      <Button tone="ghost" size="md" fullWidth onClick={onScanNext}>
        Scan next wristband
      </Button>
    </div>
  )
}

function ChipGrid({
  prizes,
  currentPrizeId,
  childName,
  volunteer,
  setVolunteer,
  posting,
  onPick,
  onCancel,
  isUpdate,
}: {
  prizes: Prize[]
  currentPrizeId: string | null
  childName: string
  volunteer: string
  setVolunteer: (s: string) => void
  posting: boolean
  onPick: (p: Prize) => void
  onCancel: () => void
  isUpdate: boolean
}) {
  return (
    <div className="space-y-4">
      <SignPanel tone="gold" padding="md">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon-gold [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              {isUpdate ? 'Change prize' : 'Pick a prize'}
            </div>
            <h2 className="font-display text-xl font-bold text-paper mt-1">{childName}</h2>
          </div>
          {isUpdate && (
            <Chip tone="cyan">updating</Chip>
          )}
        </div>
      </SignPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {prizes.map((p) => {
          const selected = currentPrizeId === p.id
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              disabled={posting}
              onClick={() => onPick(p)}
              className={[
                'relative rounded-2xl border-2 bg-ink-2/70 backdrop-blur-sm px-3 py-4 text-left transition',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neon-gold/40',
                selected
                  ? 'border-neon-cyan shadow-glow-cyan ring-2 ring-neon-cyan/40'
                  : 'border-neon-gold/60 shadow-glow-gold hover:bg-neon-gold/10',
              ].join(' ')}
            >
              <div className="font-display text-base font-bold text-paper leading-tight">
                {p.label}
              </div>
              {p.sub && (
                <div className="mt-1 text-[11px] uppercase tracking-wider text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                  {p.sub}
                </div>
              )}
              {selected && (
                <span className="absolute top-1.5 right-2 text-[10px] font-semibold uppercase tracking-wider text-neon-cyan [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                  current
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Input
        label="Your name (staff, optional)"
        value={volunteer}
        onChange={(e) => setVolunteer(e.target.value)}
        aria-label="volunteer name"
      />

      <Button tone="ghost" size="md" fullWidth onClick={onCancel}>
        Cancel · scan next
      </Button>
    </div>
  )
}

function AffirmationCard({
  childName,
  prizeLabel,
  updated,
}: {
  childName: string
  prizeLabel: string
  updated: boolean
}) {
  return (
    <div
      data-testid="prize-affirmation"
      className="motion-safe:animate-rise"
    >
      <SignPanel tone="mint" padding="lg">
        <div className="flex flex-col items-center text-center gap-3">
          <span
            aria-hidden
            className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-mint text-neon-mint shadow-glow-mint text-3xl"
          >
            ✓
          </span>
          <div className="font-display text-3xl font-bold text-neon-mint tracking-wide">
            LOGGED ✓
          </div>
          <div className="space-y-0.5">
            <div className="font-display text-xl text-paper">{prizeLabel}</div>
            <div className="text-sm text-mist">{childName}</div>
            {updated && (
              <div className="text-[10px] uppercase tracking-[0.22em] text-neon-cyan [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                prize updated
              </div>
            )}
          </div>
        </div>
      </SignPanel>
    </div>
  )
}
