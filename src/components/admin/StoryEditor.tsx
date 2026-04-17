'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Story = {
  id: string
  child_id: string
  status: string
  generated_at: string | null
  word_count: number | null
  photo_count: number | null
  auto_check_score: string | number | null
  auto_check_notes: string | null
  story_text: string | null
  story_html: string | null
  moderation_notes: string | null
  children: { id: string; first_name: string; last_name: string; age: number | null; grade: string | null } | null
}

export default function StoryEditor({ id }: { id: string }) {
  const [story, setStory] = useState<Story | null>(null)
  const [text, setText] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function load() {
    const res = await fetch(`/api/stories/${id}`)
    if (!res.ok) { setError('Load failed'); return }
    const body = await res.json()
    setStory(body.story)
    setText(body.story.story_text ?? '')
    setNotes(body.story.moderation_notes ?? '')
    setError(null)
  }

  useEffect(() => { load() }, [id])

  async function patch(partial: Partial<{ status: string; moderation_notes: string; story_text: string }>) {
    setBusy(true); setSaved(false); setError(null)
    try {
      const res = await fetch(`/api/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      })
      const b = await res.json()
      if (!res.ok) { setError(b.error ?? 'Save failed'); return }
      setSaved(true)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function regenerate() {
    if (!story) return
    setBusy(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: story.child_id }),
      })
      const b = await res.json()
      if (!res.ok) { setError(b.error ?? 'Regeneration failed'); return }
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>
  if (!story) return <p className="text-slate-500">Loading…</p>

  const notesList = (story.auto_check_notes ?? '').split(' | ').filter(Boolean)

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-black">
          {story.children ? `${story.children.first_name} ${story.children.last_name}` : 'Story'}
        </h1>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-sm capitalize">{story.status.replace(/_/g, ' ')}</span>
        {story.auto_check_score != null && (
          <span className="text-sm text-slate-500">score {Number(story.auto_check_score).toFixed(2)}</span>
        )}
        <span className="ml-auto">
          <Link href="/admin/stories" className="text-sm text-slate-500">← Back to list</Link>
        </span>
      </header>

      {notesList.length > 0 && (
        <section className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <h2 className="font-bold">Auto-check notes</h2>
          <ul className="list-disc pl-5">
            {notesList.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      <section className="space-y-2 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Story text</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={16}
          aria-label="story text"
          className="w-full rounded border px-3 py-2 font-serif text-sm" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => patch({ story_text: text })}
            disabled={busy}
            className="rounded bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
            Save text
          </button>
          <button type="button" onClick={regenerate} disabled={busy}
            className="rounded bg-slate-200 px-3 py-2 text-sm font-bold text-slate-900 disabled:opacity-50">
            Regenerate
          </button>
        </div>
      </section>

      {story.story_html && (
        <section className="rounded border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold">HTML preview</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: story.story_html }} />
        </section>
      )}

      <section className="space-y-2 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">Moderation notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          aria-label="moderation notes"
          className="w-full rounded border px-3 py-2 text-sm" />
        <button type="button" onClick={() => patch({ moderation_notes: notes })} disabled={busy}
          className="rounded bg-slate-200 px-3 py-2 text-sm font-bold text-slate-900 disabled:opacity-50">
          Save notes
        </button>
      </section>

      <section className="flex flex-wrap gap-2 rounded border border-slate-200 bg-white p-4">
        <button type="button" onClick={() => patch({ status: 'approved' })} disabled={busy}
          className="rounded bg-green-600 px-4 py-2 font-bold text-white disabled:opacity-50">
          Approve
        </button>
        <button type="button" onClick={() => patch({ status: 'needs_review' })} disabled={busy}
          className="rounded bg-amber-500 px-4 py-2 font-bold text-white disabled:opacity-50">
          Send back for review
        </button>
        <button type="button" onClick={() => patch({ status: 'skipped' })} disabled={busy}
          className="rounded bg-slate-500 px-4 py-2 font-bold text-white disabled:opacity-50">
          Skip (don&apos;t send)
        </button>
        {saved && <span className="self-center text-sm text-green-700">Saved.</span>}
      </section>
    </div>
  )
}
