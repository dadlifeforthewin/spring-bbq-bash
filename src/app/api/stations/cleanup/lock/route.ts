import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// POST /api/stations/cleanup/lock
// Append-only: every successful tap writes a new cleanup_locks row.
// Rejects with 409 if the server-side recount shows any task still open.
const schema = z.object({
  volunteer_name: z.string().max(120).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body ?? {})
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: event } = await sb.from('events').select('id').limit(1).maybeSingle()
  if (!event) return Response.json({ error: 'no event configured' }, { status: 409 })

  const { count: totalCount } = await sb
    .from('cleanup_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
  const { count: doneCount } = await sb
    .from('cleanup_completions')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id)

  const total = totalCount ?? 0
  const remaining = Math.max(0, total - (doneCount ?? 0))

  if (remaining !== 0) {
    return Response.json(
      { error: 'tasks remaining', remaining, total },
      { status: 409 },
    )
  }

  const volunteer = parsed.data.volunteer_name || null
  const nowIso = new Date().toISOString()

  const { error } = await sb
    .from('cleanup_locks')
    .insert({ event_id: event.id, locked_by: volunteer, locked_at: nowIso })
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  return Response.json({ ok: true, locked_at: nowIso })
}
