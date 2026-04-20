'use client'
import { useEffect, useState } from 'react'
import { PageHead, SignPanel, SectionHeading, Button, Chip } from '@/components/glow'

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

type KidTone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

const statusToneMap: Record<string, 'mint' | 'gold' | 'cyan' | 'magenta' | 'quiet' | 'danger'> = {
  approved: 'mint',
  auto_approved: 'mint',
  sent: 'cyan',
  needs_review: 'gold',
  pending_review: 'gold',
  pending: 'magenta',
  skipped: 'quiet',
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

  if (error) {
    return (
      <div className="space-y-4">
        <PageHead back={{ href: '/admin/stories', label: 'stories' }} title="Keepsake" sub="Review, edit, regenerate, or approve." />
        <SignPanel tone="magenta" padding="lg">
          <p className="text-danger font-semibold">{error}</p>
        </SignPanel>
      </div>
    )
  }
  if (!story) {
    return (
      <div className="space-y-4">
        <PageHead back={{ href: '/admin/stories', label: 'stories' }} title="Keepsake" sub="Review, edit, regenerate, or approve." />
        <SignPanel tone="uv" padding="lg">
          <p className="text-mist">Loading…</p>
        </SignPanel>
      </div>
    )
  }

  // preferred_tone is not on the children payload yet; fall back to 'uv'.
  const kidTone: KidTone = 'uv'
  const childName = story.children
    ? `${story.children.first_name} ${story.children.last_name}`
    : 'Story'
  const childFirstName = story.children?.first_name ?? 'Kid'
  const statusLabel = story.status.replace(/_/g, ' ')
  const statusTone = statusToneMap[story.status] ?? 'quiet'
  const notesList = (story.auto_check_notes ?? '').split(' | ').filter(Boolean)
  const score = story.auto_check_score != null ? Number(story.auto_check_score) : null

  return (
    <div className="space-y-6">
      <PageHead
        back={{ href: '/admin/stories', label: 'stories' }}
        title={`${childFirstName}'s keepsake`}
        sub="Review, edit, regenerate, or approve."
      />

      <SignPanel tone={kidTone} padding="lg">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <h2 className="font-display text-2xl font-bold text-paper leading-tight">
              {childName}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={statusTone}>{statusLabel}</Chip>
              {score != null && (
                <Chip tone="quiet">score {score.toFixed(2)}</Chip>
              )}
              {story.word_count != null && (
                <Chip tone="quiet">{story.word_count} words</Chip>
              )}
              {story.photo_count != null && story.photo_count > 0 && (
                <Chip tone="quiet">{story.photo_count} photos</Chip>
              )}
            </div>
            {notesList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                  auto-check
                </span>
                {notesList.map((n, i) => (
                  <Chip key={i} tone="danger" glow>
                    <span aria-hidden>✗</span>
                    <span>{n}</span>
                  </Chip>
                ))}
              </div>
            )}
            {notesList.length === 0 && score != null && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint [font-family:var(--font-mono),JetBrains_Mono,monospace]">
                  auto-check
                </span>
                <Chip tone="mint" glow>
                  <span aria-hidden>✓</span>
                  <span>all rules clear</span>
                </Chip>
              </div>
            )}
          </div>
        </header>
      </SignPanel>

      <section className="space-y-3">
        <SectionHeading num="DRAFT" title="Keepsake story" tone={kidTone} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          aria-label="story text"
          disabled={busy}
          className="w-full rounded-xl border-2 border-ink-hair bg-ink-3/70 px-4 py-3 font-serif text-sm text-paper leading-relaxed placeholder:text-faint focus:outline-none focus:border-neon-cyan focus:ring-4 focus:ring-neon-cyan/30 transition disabled:opacity-60"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            tone="ghost"
            size="lg"
            onClick={() => patch({ story_text: text })}
            disabled={busy}
          >
            Save text
          </Button>
          <Button
            tone="cyan"
            size="lg"
            onClick={regenerate}
            disabled={busy}
            loading={busy}
          >
            Regenerate
          </Button>
          {saved && (
            <span className="text-sm text-neon-mint font-semibold [font-family:var(--font-mono),JetBrains_Mono,monospace] tracking-wider uppercase">
              Saved
            </span>
          )}
        </div>
      </section>

      {story.story_html && (
        <section className="space-y-3">
          <SectionHeading num="PREVIEW" title="HTML preview" tone={kidTone} />
          <div className="rounded-xl border border-ink-hair bg-ink-2/60 p-5">
            <div
              className="prose prose-invert max-w-none text-paper"
              dangerouslySetInnerHTML={{ __html: story.story_html }}
            />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeading num="NOTES" title="Moderation notes" tone={kidTone} />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          aria-label="moderation notes"
          disabled={busy}
          className="w-full rounded-xl border-2 border-ink-hair bg-ink-3/70 px-4 py-3 text-sm text-paper placeholder:text-faint focus:outline-none focus:border-neon-cyan focus:ring-4 focus:ring-neon-cyan/30 transition disabled:opacity-60"
        />
        <Button
          tone="ghost"
          size="md"
          onClick={() => patch({ moderation_notes: notes })}
          disabled={busy}
        >
          Save notes
        </Button>
      </section>

      <section className="space-y-3">
        <SectionHeading num="DECIDE" title="Moderation" tone={kidTone} />
        <div className="flex flex-wrap gap-3">
          <Button tone="mint" size="lg" onClick={() => patch({ status: 'approved' })} disabled={busy}>
            Approve
          </Button>
          <Button tone="ghost" size="lg" onClick={() => patch({ status: 'needs_review' })} disabled={busy}>
            Send back
          </Button>
          <Button tone="ghost" size="lg" onClick={() => patch({ status: 'skipped' })} disabled={busy}>
            Skip
          </Button>
        </div>
      </section>
    </div>
  )
}
