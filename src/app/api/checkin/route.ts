import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

const checkinSchema = z.object({
  child_id: z.string().uuid(),
  dropoff_type: z.enum(['both_parents', 'one_parent', 'grandparent', 'other_approved_adult']),
  staff_name: z.string().max(120).optional().or(z.literal('')),
  photo_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = checkinSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: child, error: fetchErr } = await sb
    .from('children')
    .select('id, checked_in_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (fetchErr || !child) {
    return Response.json({ error: 'child not found' }, { status: 404 })
  }
  if (child.checked_in_at) {
    return Response.json({ error: 'already checked in', checked_in_at: child.checked_in_at }, { status: 409 })
  }

  const now = new Date().toISOString()
  await sb
    .from('children')
    .update({
      checked_in_at: now,
      checked_in_dropoff_type: parsed.data.dropoff_type,
    })
    .eq('id', parsed.data.child_id)

  await sb.from('station_events').insert({
    child_id: parsed.data.child_id,
    station: 'check_in',
    event_type: 'check_in',
    volunteer_name: parsed.data.staff_name || null,
  })

  return Response.json({ ok: true, checked_in_at: now })
}
