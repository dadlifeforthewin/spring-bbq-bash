import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

const checkinSchema = z.object({
  child_id: z.string().uuid(),
  dropoff_type: z.enum(['both_parents', 'one_parent', 'grandparent', 'other_approved_adult']),
  // Free-text name of the adult physically dropping the kid off. Required by
  // the UI when dropoff_type === 'other_approved_adult'; ignored otherwise so
  // stale input can't sneak through if the volunteer flipped the radio.
  dropoff_person_name: z.string().trim().min(1).max(120).optional(),
  staff_name: z.string().max(120).optional().or(z.literal('')),
  photo_id: z.string().uuid().optional(),
}).refine(
  (v) => v.dropoff_type !== 'other_approved_adult' || !!v.dropoff_person_name,
  { message: 'dropoff_person_name is required when dropoff_type is other_approved_adult', path: ['dropoff_person_name'] },
)

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
  // Only reference checked_in_dropoff_name when the dropoff type requires it,
  // so parent/grandparent check-ins keep working if migration 0015 hasn't
  // been applied to the target database yet.
  const updatePayload: Record<string, unknown> = {
    checked_in_at: now,
    checked_in_dropoff_type: parsed.data.dropoff_type,
  }
  if (parsed.data.dropoff_type === 'other_approved_adult') {
    updatePayload.checked_in_dropoff_name = parsed.data.dropoff_person_name ?? null
  }
  await sb
    .from('children')
    .update(updatePayload)
    .eq('id', parsed.data.child_id)

  await sb.from('station_events').insert({
    child_id: parsed.data.child_id,
    station: 'check_in',
    event_type: 'check_in',
    volunteer_name: parsed.data.staff_name || null,
  })

  return Response.json({ ok: true, checked_in_at: now })
}
