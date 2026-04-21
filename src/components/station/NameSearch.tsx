'use client'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/glow/Input'
import { Chip } from '@/components/glow/Chip'

type Match = {
  id: string
  qr_code: string
  first_name: string
  last_name: string
  age: number | null
  grade: string | null
  checked_in_at: string | null
  checked_out_at: string | null
}

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = {
  tone?: Tone
  onSelect: (qr_code: string) => void
  disabled?: boolean
}

const DEBOUNCE_MS = 250
const MIN_QUERY = 2

// Shared fallback for stations when a wristband QR won't scan.
// Volunteers type a name; tapping a result hands the QR code back to
// the station's normal lookup flow via `onSelect`.
export default function NameSearch({ tone = 'cyan', onSelect, disabled = false }: Props) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Match[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!touched) return
    if (q.trim().length < MIN_QUERY) {
      setRows([])
      setError(null)
      return
    }
    const ctl = new AbortController()
    abortRef.current?.abort()
    abortRef.current = ctl

    const t = setTimeout(async () => {
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`/api/children/search?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? 'Search failed')
          setRows([])
          return
        }
        const body = await res.json()
        setRows(body.children ?? [])
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('Search failed')
          setRows([])
        }
      } finally {
        setBusy(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [q, touched])

  const statusText = (() => {
    if (busy) return 'Searching…'
    if (!touched) return ''
    if (q.trim().length < MIN_QUERY) return `Type at least ${MIN_QUERY} letters…`
    if (error) return error
    if (rows.length === 0) return 'No matches.'
    return `${rows.length} match${rows.length === 1 ? '' : 'es'}`
  })()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          or search by name
        </span>
        <span className="h-px flex-1 bg-ink-hair" />
      </div>
      <Input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); if (!touched) setTouched(true) }}
        placeholder="Kid's first or last name"
        aria-label="search child by name"
        disabled={disabled}
      />
      {statusText && (
        <p className="text-xs text-faint [font-family:var(--font-mono),JetBrains_Mono,monospace]">
          {statusText}
        </p>
      )}
      {rows.length > 0 && (
        <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto rounded-xl border border-ink-hair bg-ink-2/60 p-1.5">
          {rows.map((r) => {
            const statusTone: Tone | 'quiet' =
              r.checked_out_at ? 'mint'
              : r.checked_in_at ? 'cyan'
              : 'quiet'
            const statusLabel =
              r.checked_out_at ? 'out'
              : r.checked_in_at ? 'in'
              : 'not arrived'
            const meta = [
              r.age != null ? `age ${r.age}` : null,
              r.grade,
            ].filter(Boolean).join(' · ')
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.qr_code)}
                  disabled={disabled}
                  className="w-full text-left rounded-lg px-3 py-2 transition hover:bg-ink-3/70 hover:border-neon-cyan/40 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40 disabled:opacity-60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className={`font-display font-semibold tracking-tight text-paper hover:text-neon-${tone}`}>
                        {r.first_name} {r.last_name}
                      </div>
                      {meta && (
                        <div className="text-[11px] uppercase tracking-[0.12em] text-faint [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                          {meta}
                        </div>
                      )}
                    </div>
                    <Chip tone={statusTone as Tone}>{statusLabel}</Chip>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
