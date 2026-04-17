'use client'
import { useEffect, useState } from 'react'

type EventRow = {
  id: string
  name: string
  event_date: string
  check_in_opens_at: string
  check_in_closes_at: string
  ends_at: string
  default_initial_tickets: number
  faith_tone_level: 'strong' | 'subtle' | 'off'
  email_from_name: string | null
  email_logo_url: string | null
  story_prompt_template: string | null
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  // yyyy-MM-ddTHH:mm for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Settings() {
  const [row, setRow] = useState<EventRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/settings')
    if (!res.ok) { setError('Load failed'); return }
    const body = await res.json()
    setRow(body.event)
    setError(null)
  }

  useEffect(() => { load() }, [])

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>
  if (!row) return <p className="text-slate-500">Loading…</p>

  function set<K extends keyof EventRow>(field: K, value: EventRow[K]) {
    setRow({ ...row!, [field]: value })
  }

  async function save() {
    if (!row) return
    const r = row
    setBusy(true); setSaved(false); setError(null)
    try {
      const payload = {
        name: r.name,
        event_date: r.event_date,
        check_in_opens_at: new Date(r.check_in_opens_at).toISOString(),
        check_in_closes_at: new Date(r.check_in_closes_at).toISOString(),
        ends_at: new Date(r.ends_at).toISOString(),
        default_initial_tickets: r.default_initial_tickets,
        faith_tone_level: r.faith_tone_level,
        email_from_name: r.email_from_name,
        email_logo_url: r.email_logo_url,
        story_prompt_template: r.story_prompt_template,
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Save failed')
        return
      }
      setSaved(true)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-slate-500">Event config, email branding, AI story prompt.</p>
      </header>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Event</h2>
        <label className="block"><span className="text-sm">Event name</span>
          <input value={row.name} onChange={(e) => set('name', e.target.value)}
            aria-label="event name"
            className="w-full rounded border px-3 py-2" /></label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="block"><span className="text-sm">Date</span>
            <input type="date" value={row.event_date}
              onChange={(e) => set('event_date', e.target.value)}
              aria-label="event date"
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Default tickets</span>
            <input type="number" min={0} max={100} value={row.default_initial_tickets}
              onChange={(e) => set('default_initial_tickets', Number(e.target.value) || 0)}
              aria-label="default initial tickets"
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Faith tone</span>
            <select value={row.faith_tone_level}
              onChange={(e) => set('faith_tone_level', e.target.value as EventRow['faith_tone_level'])}
              aria-label="faith tone level"
              className="w-full rounded border px-3 py-2">
              <option value="strong">Strong</option>
              <option value="subtle">Subtle</option>
              <option value="off">Off</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block"><span className="text-sm">Check-in opens</span>
            <input type="datetime-local" value={toLocalInput(row.check_in_opens_at)}
              onChange={(e) => set('check_in_opens_at', e.target.value)}
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Check-in closes</span>
            <input type="datetime-local" value={toLocalInput(row.check_in_closes_at)}
              onChange={(e) => set('check_in_closes_at', e.target.value)}
              className="w-full rounded border px-3 py-2" /></label>
          <label className="block"><span className="text-sm">Event ends</span>
            <input type="datetime-local" value={toLocalInput(row.ends_at)}
              onChange={(e) => set('ends_at', e.target.value)}
              className="w-full rounded border px-3 py-2" /></label>
        </div>
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Email branding</h2>
        <label className="block"><span className="text-sm">From name</span>
          <input value={row.email_from_name ?? ''}
            onChange={(e) => set('email_from_name', e.target.value)}
            className="w-full rounded border px-3 py-2" /></label>
        <label className="block"><span className="text-sm">Logo URL</span>
          <input value={row.email_logo_url ?? ''}
            onChange={(e) => set('email_logo_url', e.target.value)}
            className="w-full rounded border px-3 py-2" /></label>
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">AI story prompt template</h2>
        <p className="text-sm text-slate-500">Used by the Phase 5 generator. Gold-standard reference seeds in 0005_seed_gold_standard.sql.</p>
        <textarea rows={10} value={row.story_prompt_template ?? ''}
          onChange={(e) => set('story_prompt_template', e.target.value)}
          className="w-full rounded border px-3 py-2 font-mono text-sm" />
      </section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy}
          className="rounded bg-fuchsia-600 px-6 py-2 font-bold text-white disabled:opacity-50">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm text-green-700">Saved.</span>}
      </div>

      <TestEmailBlock />
    </div>
  )
}

function TestEmailBlock() {
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setResult(null); setError(null); setBusy(true)
    try {
      const res = await fetch('/api/stories/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.details ?? body.error ?? 'Send failed')
        return
      }
      setResult(body.message_id ? `Sent · id ${body.message_id}` : 'Sent.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-bold">Send a test email</h2>
      <p className="text-sm text-slate-500">
        Fires a rendered copy of the keepsake email (using the reference story) to the address you provide.
        Requires RESEND_API_KEY + EMAIL_FROM.
      </p>
      <div className="flex gap-2">
        <input type="email" value={to} onChange={(e) => setTo(e.target.value)}
          placeholder="you@example.com"
          aria-label="test email address"
          className="flex-1 rounded border px-3 py-2" />
        <button type="button" onClick={send} disabled={busy || !to}
          className="rounded bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50">
          {busy ? 'Sending…' : 'Send test'}
        </button>
        <a href="/api/stories/preview" target="_blank" rel="noreferrer"
          className="self-center text-sm text-blue-600 underline">
          Preview HTML
        </a>
      </div>
      {result && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{result}</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}
