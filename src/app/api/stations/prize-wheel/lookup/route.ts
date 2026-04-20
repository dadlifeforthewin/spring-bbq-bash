import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// GET /api/stations/prize-wheel/lookup?child_id=<uuid>
// Returns the child + any existing redemption (joined to prize label) so the
// station UI can decide between the chip grid and the ALREADY REDEEMED card.
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

  // Existing redemption (if any) + the joined prize label.
  const { data: red } = await sb
    .from('prize_redemptions')
    .select('id, prize_id, volunteer_name, updated_at, prizes(label)')
    .eq('child_id', childId)
    .maybeSingle()

  type RedRow = {
    id: string
    prize_id: string
    volunteer_name: string | null
    updated_at: string
    prizes: { label: string } | null
  } | null
  const redRow = red as RedRow

  return Response.json({
    child,
    redemption: redRow
      ? {
          id: redRow.id,
          prize_id: redRow.prize_id,
          volunteer_name: redRow.volunteer_name,
          updated_at: redRow.updated_at,
        }
      : null,
    prize_label: redRow?.prizes?.label ?? null,
  })
}
