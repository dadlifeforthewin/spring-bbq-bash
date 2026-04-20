import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// Metered stations deduct from a bucket; one-time stations set a timestamp;
// everything else just logs a station_event so the keepsake email picks it up.
const JAIL_ACTIONS = ['send', 'release'] as const
const METERED = new Set(['drinks', 'jail'])
const ONE_TIME = new Set(['prize_wheel', 'dj_shoutout'])

const schema = z.object({
  child_id: z.string().uuid(),
  station: z.string().min(1).max(60),
  activity_type: z.enum(JAIL_ACTIONS).optional(),
  song_request: z.string().max(240).optional(),
  notes: z.string().max(500).optional(),
  volunteer_name: z.string().max(120).optional().or(z.literal('')),
})

type ChildSnapshot = {
  id: string
  checked_in_at: string | null
  checked_out_at: string | null
  drink_tickets_remaining: number
  jail_tickets_remaining: number
  prize_wheel_used_at: string | null
  dj_shoutout_used_at: string | null
}

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
    .select('id, checked_in_at, checked_out_at, drink_tickets_remaining, jail_tickets_remaining, prize_wheel_used_at, dj_shoutout_used_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (!child.checked_in_at) return Response.json({ error: 'not checked in' }, { status: 409 })
  if (child.checked_out_at) return Response.json({ error: 'already checked out' }, { status: 409 })

  const snap = child as ChildSnapshot
  const station = parsed.data.station
  const volunteer = parsed.data.volunteer_name || null

  // --- Metered: drinks ---
  if (station === 'drinks') {
    if (snap.drink_tickets_remaining <= 0) {
      return Response.json({
        error: 'no drink tickets remaining',
        balance: { drink_tickets: 0 },
      }, { status: 409 })
    }
    const newBalance = snap.drink_tickets_remaining - 1
    await sb.from('children').update({ drink_tickets_remaining: newBalance }).eq('id', snap.id)
    await sb.from('station_events').insert({
      child_id: snap.id,
      station,
      event_type: 'ticket_spend',
      tickets_delta: -1,
      item_name: 'Drink',
      volunteer_name: volunteer,
    })
    return Response.json({
      ok: true,
      kind: 'drinks',
      balance: { drink_tickets: newBalance },
    })
  }

  // --- Metered: jail (send OR release, same bucket) ---
  if (station === 'jail') {
    if (!parsed.data.activity_type) {
      return Response.json({ error: 'activity_type required for jail (send|release)' }, { status: 400 })
    }
    if (snap.jail_tickets_remaining <= 0) {
      return Response.json({
        error: 'no jail tickets remaining',
        balance: { jail_tickets: 0 },
      }, { status: 409 })
    }
    const newBalance = snap.jail_tickets_remaining - 1
    await sb.from('children').update({ jail_tickets_remaining: newBalance }).eq('id', snap.id)
    await sb.from('station_events').insert({
      child_id: snap.id,
      station,
      event_type: 'ticket_spend',
      tickets_delta: -1,
      item_name: parsed.data.activity_type === 'send' ? 'Sent to jail' : 'Get-out-of-jail pass',
      volunteer_name: volunteer,
      notes: parsed.data.notes || null,
    })
    return Response.json({
      ok: true,
      kind: 'jail',
      action: parsed.data.activity_type,
      balance: { jail_tickets: newBalance },
    })
  }

  // --- One-time: DJ shoutout ---
  if (station === 'dj_shoutout') {
    if (snap.dj_shoutout_used_at) {
      return Response.json({
        error: 'DJ shoutout already used tonight',
        used_at: snap.dj_shoutout_used_at,
      }, { status: 409 })
    }
    if (!parsed.data.song_request || !parsed.data.song_request.trim()) {
      return Response.json({ error: 'song_request required for dj_shoutout' }, { status: 400 })
    }
    const now = new Date().toISOString()
    await sb.from('children').update({ dj_shoutout_used_at: now }).eq('id', snap.id)
    await sb.from('station_events').insert({
      child_id: snap.id,
      station,
      event_type: 'ticket_spend',
      tickets_delta: 0,
      item_name: 'DJ shoutout',
      volunteer_name: volunteer,
      notes: parsed.data.song_request.trim(),
    })
    return Response.json({ ok: true, kind: 'dj_shoutout', used_at: now })
  }

  // --- Free stations: just log the visit ---
  void METERED; void ONE_TIME
  await sb.from('station_events').insert({
    child_id: snap.id,
    station,
    event_type: 'ticket_spend',
    tickets_delta: 0,
    item_name: null,
    volunteer_name: volunteer,
    notes: parsed.data.notes || null,
  })
  return Response.json({ ok: true, kind: 'free_visit' })
}
