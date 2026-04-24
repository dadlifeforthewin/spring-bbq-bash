import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// POST /api/stations/prize-wheel/redeem
// Volunteer-typed free-text prize label (catalog dropdown retired 2026-04-24).
// First redemption inserts a row + stamps children.prize_wheel_used_at.
// Re-edit updates the row (preserving id, NOT overwriting used_at) and writes
// a second station_events row to keep the audit trail.

const schema = z.object({
  child_id: z.string().uuid(),
  prize_label: z.string().trim().min(1).max(120),
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

  const { data: child } = await sb
    .from('children')
    .select('id, checked_in_at, checked_out_at, prize_wheel_used_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (!child.checked_in_at) return Response.json({ error: 'not checked in' }, { status: 409 })
  if (child.checked_out_at) return Response.json({ error: 'already checked out' }, { status: 409 })

  const volunteer = parsed.data.volunteer_name || null
  const label = parsed.data.prize_label.trim()

  const { data: existing } = await sb
    .from('prize_redemptions')
    .select('id, prize_label')
    .eq('child_id', parsed.data.child_id)
    .maybeSingle()

  const isUpdate = !!existing
  const nowIso = new Date().toISOString()

  const { error: upsertErr } = await sb
    .from('prize_redemptions')
    .upsert(
      {
        child_id: parsed.data.child_id,
        prize_label: label,
        volunteer_name: volunteer,
        updated_at: nowIso,
      },
      { onConflict: 'child_id' }
    )
  if (upsertErr) return Response.json({ error: 'db error', details: upsertErr.message }, { status: 500 })

  if (!child.prize_wheel_used_at) {
    await sb.from('children').update({ prize_wheel_used_at: nowIso }).eq('id', parsed.data.child_id)
  }

  await sb.from('station_events').insert({
    child_id: parsed.data.child_id,
    station: 'prize_wheel',
    event_type: 'ticket_spend',
    tickets_delta: 0,
    item_name: label,
    volunteer_name: volunteer,
    notes: null,
  })

  return Response.json({
    ok: true,
    prize_label: label,
    updated: isUpdate,
  })
}
