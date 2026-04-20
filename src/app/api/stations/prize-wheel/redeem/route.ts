import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// POST /api/stations/prize-wheel/redeem
// First redemption: inserts prize_redemptions row, sets children.prize_wheel_used_at,
// writes a station_events row. Re-edit: updates prize_redemptions (preserving id),
// DOES NOT overwrite prize_wheel_used_at, and writes a SECOND station_events row
// so the audit trail shows the swap.

const schema = z.object({
  child_id: z.string().uuid(),
  prize_id: z.string().uuid(),
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

  // 1. Child guard.
  const { data: child } = await sb
    .from('children')
    .select('id, checked_in_at, checked_out_at, prize_wheel_used_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (!child.checked_in_at) return Response.json({ error: 'not checked in' }, { status: 409 })
  if (child.checked_out_at) return Response.json({ error: 'already checked out' }, { status: 409 })

  // 2. Prize guard.
  const { data: prize } = await sb
    .from('prizes')
    .select('id, label, active')
    .eq('id', parsed.data.prize_id)
    .maybeSingle()
  if (!prize) return Response.json({ error: 'prize not found' }, { status: 404 })
  if (!prize.active) return Response.json({ error: 'prize not active' }, { status: 409 })

  const volunteer = parsed.data.volunteer_name || null

  // 3. Upsert prize_redemptions (unique on child_id).
  const { data: existing } = await sb
    .from('prize_redemptions')
    .select('id, prize_id')
    .eq('child_id', parsed.data.child_id)
    .maybeSingle()

  const isUpdate = !!existing
  const nowIso = new Date().toISOString()

  if (existing) {
    const { error: upErr } = await sb
      .from('prize_redemptions')
      .update({
        prize_id: parsed.data.prize_id,
        volunteer_name: volunteer,
        updated_at: nowIso,
      })
      .eq('id', existing.id)
    if (upErr) return Response.json({ error: 'db error', details: upErr.message }, { status: 500 })
  } else {
    const { error: insErr } = await sb.from('prize_redemptions').insert({
      child_id: parsed.data.child_id,
      prize_id: parsed.data.prize_id,
      volunteer_name: volunteer,
    })
    if (insErr) return Response.json({ error: 'db error', details: insErr.message }, { status: 500 })
  }

  // 4. Stamp children.prize_wheel_used_at ONLY on first redemption.
  if (!child.prize_wheel_used_at) {
    await sb.from('children').update({ prize_wheel_used_at: nowIso }).eq('id', parsed.data.child_id)
  }

  // 5. Always insert a station_events row — the second one on re-edit forms
  // the audit trail.
  await sb.from('station_events').insert({
    child_id: parsed.data.child_id,
    station: 'prize_wheel',
    event_type: 'ticket_spend',
    tickets_delta: 0,
    item_name: prize.label,
    volunteer_name: volunteer,
    notes: null,
  })

  return Response.json({
    ok: true,
    prize: { id: prize.id, label: prize.label },
    updated: isUpdate,
  })
}
