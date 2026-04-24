import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// GET /api/stations/prize-wheel/lookup?child_id=<uuid>
// Returns the child + any existing free-text redemption so the station UI
// can decide between the input form and the ALREADY REDEEMED card.
// - 404 when the child does not exist
// - 409 when the child is not checked in, or is already checked out
export async function GET(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const childId = req.nextUrl.searchParams.get('child_id')
  if (!childId) {
    return Response.json({ error: 'child_id required' }, { status: 400 })
  }

  const sb = serverClient()
  const { data: child } = await sb
    .from('children')
    .select('id, first_name, last_name, photo_consent_app, prize_wheel_used_at, checked_in_at, checked_out_at')
    .eq('id', childId)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (!child.checked_in_at) return Response.json({ error: 'not checked in', child }, { status: 409 })
  if (child.checked_out_at) return Response.json({ error: 'already checked out', child }, { status: 409 })

  const { data: red } = await sb
    .from('prize_redemptions')
    .select('id, prize_label, volunteer_name, updated_at')
    .eq('child_id', childId)
    .maybeSingle()

  return Response.json({
    child,
    redemption: red
      ? {
          id: red.id,
          volunteer_name: red.volunteer_name,
          updated_at: red.updated_at,
        }
      : null,
    prize_label: red?.prize_label ?? null,
  })
}
