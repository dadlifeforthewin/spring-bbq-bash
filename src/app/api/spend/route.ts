import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

const spendSchema = z.object({
  child_id: z.string().uuid(),
  station: z.string().min(1).max(60),
  catalog_item_id: z.string().uuid(),
  volunteer_name: z.string().max(120).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = spendSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  // Pull current balance and catalog item atomically-ish (best effort without a SQL fn).
  const { data: child } = await sb
    .from('children')
    .select('id, ticket_balance, checked_in_at, checked_out_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (!child.checked_in_at) return Response.json({ error: 'not checked in' }, { status: 409 })
  if (child.checked_out_at) return Response.json({ error: 'already checked out' }, { status: 409 })

  const { data: item } = await sb
    .from('catalog_items')
    .select('id, name, ticket_cost, station_slug, active')
    .eq('id', parsed.data.catalog_item_id)
    .maybeSingle()
  if (!item || !item.active) return Response.json({ error: 'item unavailable' }, { status: 404 })
  if (item.station_slug !== parsed.data.station) {
    return Response.json({ error: 'item not in this station', station_slug: item.station_slug }, { status: 400 })
  }
  if (child.ticket_balance < item.ticket_cost) {
    return Response.json({
      error: 'insufficient tickets',
      balance: child.ticket_balance,
      cost: item.ticket_cost,
    }, { status: 409 })
  }

  const newBalance = child.ticket_balance - item.ticket_cost

  await sb
    .from('children')
    .update({ ticket_balance: newBalance })
    .eq('id', parsed.data.child_id)

  const { data: eventRow } = await sb
    .from('station_events')
    .insert({
      child_id: parsed.data.child_id,
      station: parsed.data.station,
      event_type: 'ticket_spend',
      tickets_delta: -item.ticket_cost,
      item_name: item.name,
      volunteer_name: parsed.data.volunteer_name || null,
    })
    .select('id')
    .single()

  return Response.json({
    ok: true,
    balance: newBalance,
    event_id: eventRow?.id ?? null,
    item: { name: item.name, cost: item.ticket_cost },
  })
}
