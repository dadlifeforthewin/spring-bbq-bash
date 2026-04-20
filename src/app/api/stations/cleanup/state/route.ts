import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// GET /api/stations/cleanup/state
// Single-event assumption: resolve the one event row, return the full
// station snapshot — active tasks, per-event completion ids, and whether
// any lock row has been written tonight. Polling is out of scope; the
// station component fetches this once on mount.
export async function GET() {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = serverClient()

  const { data: event, error: evErr } = await sb
    .from('events')
    .select('id')
    .limit(1)
    .maybeSingle()
  if (evErr) return Response.json({ error: 'db error', details: evErr.message }, { status: 500 })
  if (!event) return Response.json({ error: 'no event configured' }, { status: 409 })

  const { data: tasks, error: taskErr } = await sb
    .from('cleanup_tasks')
    .select('id, label, sub, sort_order, active, created_at')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (taskErr) return Response.json({ error: 'db error', details: taskErr.message }, { status: 500 })

  const { data: completions, error: cErr } = await sb
    .from('cleanup_completions')
    .select('task_id')
    .eq('event_id', event.id)
  if (cErr) return Response.json({ error: 'db error', details: cErr.message }, { status: 500 })

  const { count: lockCount, error: lErr } = await sb
    .from('cleanup_locks')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id)
  if (lErr) return Response.json({ error: 'db error', details: lErr.message }, { status: 500 })

  return Response.json({
    tasks: tasks ?? [],
    completed_task_ids: (completions ?? []).map((c) => c.task_id),
    locked: (lockCount ?? 0) > 0,
  })
}
