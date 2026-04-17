import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const patchSchema = z.object({
  status: z.enum(['pending', 'pending_review', 'needs_review', 'approved', 'auto_approved', 'sent', 'skipped']).optional(),
  moderation_notes: z.string().max(2000).nullable().optional(),
  story_text: z.string().max(5000).optional(),
  story_html: z.string().max(20000).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('ai_stories')
    .select('*, children(id, first_name, last_name, age, grade)')
    .eq('id', params.id)
    .maybeSingle()
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json({ story: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }
  const sb = serverClient()
  const updates: Record<string, unknown> = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined),
  )
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'nothing to update' }, { status: 400 })
  }
  if (typeof updates.story_text === 'string') {
    updates.word_count = updates.story_text.split(/\s+/).filter(Boolean).length
  }
  const { error } = await sb.from('ai_stories').update(updates).eq('id', params.id)
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
