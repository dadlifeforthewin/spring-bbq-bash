import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  event_date: z.string().optional(),
  ends_at: z.string().optional(),
  faith_tone_level: z.enum(['strong', 'subtle', 'off']).optional(),
  email_from_name: z.string().max(120).nullable().optional(),
  email_logo_url: z.string().max(500).nullable().optional(),
  story_prompt_template: z.string().max(10000).nullable().optional(),
})

export async function GET() {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('events')
    .select('id, name, event_date, ends_at, faith_tone_level, email_from_name, email_logo_url, story_prompt_template')
    .limit(1)
    .maybeSingle()
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ event: data ?? null })
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }
  const sb = serverClient()
  const { data: evt } = await sb.from('events').select('id').limit(1).maybeSingle()
  if (!evt) return Response.json({ error: 'no event row' }, { status: 404 })

  const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'nothing to update' }, { status: 400 })
  }
  const { error } = await sb.from('events').update(updates).eq('id', evt.id)
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
