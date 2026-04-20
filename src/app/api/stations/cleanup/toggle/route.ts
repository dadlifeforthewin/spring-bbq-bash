import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// POST /api/stations/cleanup/toggle
// completed=true  -> upsert a cleanup_completions row on (event_id, task_id)
// completed=false -> delete the matching row
// Always re-counts server-side after the write so the UI can reconcile
// against a canonical `remaining`.
const schema = z.object({
  task_id: z.string().uuid(),
  completed: z.boolean(),
  volunteer_name: z.string().max(120).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: event } = await sb.from('events').select('id').limit(1).maybeSingle()
  if (!event) return Response.json({ error: 'no event configured' }, { status: 409 })

  // Guard: task must exist and be active.
  const { data: task } = await sb
    .from('cleanup_tasks')
    .select('id, active')
    .eq('id', parsed.data.task_id)
    .maybeSingle()
  if (!task) return Response.json({ error: 'task not found' }, { status: 404 })
  if (!task.active) return Response.json({ error: 'task not active' }, { status: 409 })

  const volunteer = parsed.data.volunteer_name || null

  if (parsed.data.completed) {
    const { error } = await sb
      .from('cleanup_completions')
      .upsert(
        {
          event_id: event.id,
          task_id: parsed.data.task_id,
          completed_by: volunteer,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,task_id' },
      )
    if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  } else {
    const { error } = await sb
      .from('cleanup_completions')
      .delete()
      .eq('event_id', event.id)
      .eq('task_id', parsed.data.task_id)
    if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  }

  // Server-side recount so the client can reconcile.
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

  return Response.json({ ok: true, remaining, total })
}
