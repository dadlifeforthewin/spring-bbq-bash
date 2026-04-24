'use client'
import { useEffect, useRef, useState } from 'react'
import {
  PageHead,
  HelpLink,
  NeonScanner,
  SignPanel,
  Input,
  Button,
  Chip,
  GlyphGlow,
} from '@/components/glow'
import { PrizeWheelGlyph } from '@/components/glow/glyphs'
import NameSearch from './NameSearch'

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
    volunteer_name: string | null
    updated_at: string
  } | null
  prize_label: string | null
}

type UiState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'entering'; payload: LookupPayload; isUpdate: boolean }
  | { kind: 'already_redeemed'; payload: LookupPayload }
  | { kind: 'affirming'; childName: string; prizeLabel: string; updated: boolean }

const AFFIRM_MS = 1500

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function PrizeWheelStation() {
  const [qr, setQr] = useState('')
  const [volunteer, setVolunteer] = useState('')
  const [prizeInput, setPrizeInput] = useState('')
  const [ui, setUi] = useState<UiState>({ kind: 'idle' })
  const [posting, setPosting] = useState(false)
  const affirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (affirmTimerRef.current) {
        clearTimeout(affirmTimerRef.current)
        affirmTimerRef.current = null
      }
    }
  }, [])

  async function doLookup(e?: React.FormEvent, overrideQr?: string) {
    e?.preventDefault()
    const trimmed = (overrideQr ?? qr).trim()
    if (!trimmed) return
    setUi({ kind: 'loading' })
    try {
      const childRes = await fetch(`/api/children/by-qr/${encodeURIComponent(trimmed)}`)
      if (!childRes.ok) {
        const body = await childRes.json().catch(() => ({}))
        setUi({ kind: 'error', message: body.error ?? 'Child not found' })
        return
      }
      const childBody = (await childRes.json()) as { child: { id: string } }

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
        setPrizeInput('')
        setUi({ kind: 'entering', payload, isUpdate: false })
      }
    } catch {
      setUi({ kind: 'error', message: 'Network error' })
    }
  }

  function resetToIdle() {
    if (affirmTimerRef.current) {
      clearTimeout(affirmTimerRef.current)
      affirmTimerRef.current = null
    }
    setQr('')
    setPrizeInput('')
    setUi({ kind: 'idle' })
  }

  async function redeem() {
    if (ui.kind !== 'entering') return
    const label = prizeInput.trim()
    if (!label) return
    const payload = ui.payload
    const isUpdate = ui.isUpdate
    setPosting(true)
    try {
      const res = await fetch('/api/stations/prize-wheel/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: payload.child.id,
          prize_label: label,
          volunteer_name: volunteer.trim() || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUi({ kind: 'error', message: (body as { error?: string }).error ?? 'Save failed' })
        return
      }
      setUi({
        kind: 'affirming',
        childName: `${payload.child.first_name} ${payload.child.last_name}`,
        prizeLabel: label,
        updated: isUpdate,
      })
      affirmTimerRef.current = setTimeout(() => {
        affirmTimerRef.current = null
        resetToIdle()
      }, AFFIRM_MS)
    } finally {
      setPosting(false)
    }
  }

  const scanning = ui.kind === 'idle' || ui.kind === 'loading'

  return (
    <main className="flex flex-col gap-5">
      <PageHead
        back={{ href: '/station', label: 'stations' }}
        title="PRIZE WHEEL"
        sub="Scan kid · type the prize they won."
        right={<><Chip tone="gold" glow>ONE · PER KID</Chip><HelpLink /></>}
      />

      <div className="flex justify-center py-1">
        <GlyphGlow tone="gold" size={120}>
          <PrizeWheelGlyph size={100} />
        </GlyphGlow>
      </div>

      {scanning ? (
        <>
          <NeonScanner
            tone="gold"
            aspect="portrait"
            scanning={ui.kind === 'idle'}
            hint={ui.kind === 'loading' ? 'Looking up…' : 'Scan wristband or paste QR'}
            onScan={(decoded) => { if (ui.kind !== 'idle') return; setQr(decoded); doLookup(undefined, decoded) }}
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
          <NameSearch
            tone="gold"
            disabled={ui.kind === 'loading'}
            onSelect={(qrCode) => { setQr(qrCode); doLookup(undefined, qrCode) }}
          />
        </>
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
          onChange={() => {
            setPrizeInput(ui.payload.prize_label ?? '')
            setUi({ kind: 'entering', payload: ui.payload, isUpdate: true })
          }}
          onScanNext={resetToIdle}
        />
      ) : ui.kind === 'entering' ? (
        <PrizeForm
          childName={`${ui.payload.child.first_name} ${ui.payload.child.last_name}`}
          isUpdate={ui.isUpdate}
          prizeInput={prizeInput}
          setPrizeInput={setPrizeInput}
          volunteer={volunteer}
          setVolunteer={setVolunteer}
          posting={posting}
          onSave={redeem}
          onCancel={resetToIdle}
        />
      ) : ui.kind === 'affirming' ? (
        <AffirmationCard
          childName={ui.childName}
          prizeLabel={ui.prizeLabel}
          updated={ui.updated}
          onScanNext={resetToIdle}
        />
      ) : null}
    </main>
  )
}

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

function PrizeForm({
  childName,
  isUpdate,
  prizeInput,
  setPrizeInput,
  volunteer,
  setVolunteer,
  posting,
  onSave,
  onCancel,
}: {
  childName: string
  isUpdate: boolean
  prizeInput: string
  setPrizeInput: (s: string) => void
  volunteer: string
  setVolunteer: (s: string) => void
  posting: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const canSave = prizeInput.trim().length > 0 && !posting
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) onSave()
      }}
    >
      <SignPanel tone="gold" padding="md">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon-gold [font-family:var(--font-mono),JetBrains_Mono,monospace]">
              {isUpdate ? 'Change prize' : 'Pick a prize'}
            </div>
            <h2 className="font-display text-xl font-bold text-paper mt-1">{childName}</h2>
          </div>
          {isUpdate && <Chip tone="cyan">updating</Chip>}
        </div>
      </SignPanel>

      <Input
        label="What did they win?"
        value={prizeInput}
        onChange={(e) => setPrizeInput(e.target.value)}
        placeholder="e.g. Glow yo-yo, Candy bag, Small plush"
        aria-label="prize won"
        autoFocus
        required
      />

      <Input
        label="Your name (staff, optional)"
        value={volunteer}
        onChange={(e) => setVolunteer(e.target.value)}
        aria-label="volunteer name"
      />

      <Button type="submit" tone="gold" size="xl" fullWidth disabled={!canSave} loading={posting}>
        {isUpdate ? 'Save change' : 'Save prize'}
      </Button>
      <Button type="button" tone="ghost" size="md" fullWidth onClick={onCancel}>
        Cancel · scan next
      </Button>
    </form>
  )
}

function AffirmationCard({
  childName,
  prizeLabel,
  updated,
  onScanNext,
}: {
  childName: string
  prizeLabel: string
  updated: boolean
  onScanNext: () => void
}) {
  return (
    <div data-testid="prize-affirmation" className="motion-safe:animate-rise space-y-3">
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
      <Button tone="gold" size="lg" fullWidth onClick={onScanNext}>
        Scan next wristband
      </Button>
    </div>
  )
}
