import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { generateStory } from '@/lib/story-generator'
import { autoCheck } from '@/lib/auto-check'

const schema = z.object({ child_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  // Either volunteer (kicks from checkout) or admin (manual retry) can call this
  if (!isAdminAuthed() && !isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  // Root AI gate: if the family opted out of AI processing, do nothing.
  // No row created, no Anthropic call, no email. Idempotent + cheap.
  const { data: child } = await sb
    .from('children')
    .select('ai_consent_granted')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) {
    return Response.json({ error: 'child not found' }, { status: 404 })
  }
  if (!child.ai_consent_granted) {
    return Response.json({ ok: true, skipped: true, reason: 'ai_opted_out' })
  }

  // Ensure an ai_stories row exists (the registration flow creates one with status=pending)
  const { data: existing } = await sb
    .from('ai_stories')
    .select('id, status')
    .eq('child_id', parsed.data.child_id)
    .maybeSingle()
  if (!existing) {
    await sb.from('ai_stories').insert({ child_id: parsed.data.child_id, status: 'pending' })
  }

  // Load the reference story for auto-check
  const { data: evt } = await sb
    .from('events')
    .select('reference_story_text')
    .limit(1)
    .maybeSingle()
  const reference = evt?.reference_story_text ?? ''

  let generated
  try {
    generated = await generateStory(parsed.data.child_id)
  } catch (err) {
    await sb
      .from('ai_stories')
      .update({
        status: 'needs_review',
        moderation_notes: `generation failed: ${err instanceof Error ? err.message : String(err)}`,
      })
      .eq('child_id', parsed.data.child_id)
    return Response.json({ error: 'generation failed', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  const timelineStations = Array.from(new Set(
    generated.payload.timeline
      .filter((e) => e.event_type === 'ticket_spend')
      .map((e) => e.station),
  ))

  const check = autoCheck({
    story_text: generated.story_text,
    reference_story_text: reference,
    child_first_name: generated.payload.child.first_name,
    timeline_stations: timelineStations,
  })

  const status = check.passed ? 'auto_approved' : 'needs_review'

  await sb
    .from('ai_stories')
    .update({
      status,
      story_text: generated.story_text,
      story_html: generated.story_html,
      word_count: generated.word_count,
      photo_count: generated.photo_count,
      auto_check_score: check.score,
      auto_check_notes: check.notes.join(' | '),
      generated_at: new Date().toISOString(),
    })
    .eq('child_id', parsed.data.child_id)

  return Response.json({
    ok: true,
    status,
    score: check.score,
    notes: check.notes,
    preview: generated.story_text.slice(0, 400),
  })
}
