import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { writeAudit } from '@/lib/audit'

const PAYMENT_METHODS = ['facts', 'cash', 'venmo', 'comp'] as const

const reloadSchema = z.object({
  child_id: z.string().uuid(),
  tickets_added: z.number().int().min(1).max(100),
  payment_method: z.enum(PAYMENT_METHODS),
  amount_charged: z.number().min(0).max(100).optional(),
  staff_name: z.string().max(120).optional().or(z.literal('')),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')
  if (!childId) return Response.json({ error: 'child_id required' }, { status: 400 })

  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = serverClient()
  const { data: child } = await sb
    .from('children')
    .select('id, facts_reload_permission, facts_max_amount, ticket_balance')
    .eq('id', childId)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })

  const { data: factsReloads } = await sb
    .from('reload_events')
    .select('amount_charged')
    .eq('child_id', childId)
    .eq('payment_method', 'facts')

  const factsSpent = (factsReloads ?? []).reduce((sum, r) => sum + (Number(r.amount_charged) || 0), 0)
  const factsRemaining = Math.max(0, child.facts_max_amount - factsSpent)

  return Response.json({
    balance: child.ticket_balance,
    facts_reload_permission: child.facts_reload_permission,
    facts_max_amount: child.facts_max_amount,
    facts_spent: factsSpent,
    facts_remaining: factsRemaining,
  })
}

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  const parsed = reloadSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: child } = await sb
    .from('children')
    .select('id, facts_reload_permission, facts_max_amount, ticket_balance, checked_in_at, checked_out_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (child.checked_out_at) return Response.json({ error: 'already checked out' }, { status: 409 })

  // FACTS allowance guard
  if (parsed.data.payment_method === 'facts') {
    if (!child.facts_reload_permission) {
      return Response.json({ error: 'FACTS not permitted for this child' }, { status: 403 })
    }
    if (parsed.data.amount_charged == null) {
      return Response.json({ error: 'amount_charged required for FACTS' }, { status: 400 })
    }
    const { data: factsReloads } = await sb
      .from('reload_events')
      .select('amount_charged')
      .eq('child_id', parsed.data.child_id)
      .eq('payment_method', 'facts')
    const factsSpent = (factsReloads ?? []).reduce((sum, r) => sum + (Number(r.amount_charged) || 0), 0)
    if (factsSpent + parsed.data.amount_charged > child.facts_max_amount) {
      return Response.json({
        error: 'FACTS allowance exceeded',
        facts_spent: factsSpent,
        facts_max: child.facts_max_amount,
      }, { status: 403 })
    }
  }

  const newBalance = child.ticket_balance + parsed.data.tickets_added

  await sb
    .from('reload_events')
    .insert({
      child_id: parsed.data.child_id,
      tickets_added: parsed.data.tickets_added,
      payment_method: parsed.data.payment_method,
      amount_charged: parsed.data.amount_charged ?? null,
      staff_name: parsed.data.staff_name || null,
    })

  await sb
    .from('children')
    .update({ ticket_balance: newBalance })
    .eq('id', parsed.data.child_id)

  await sb.from('station_events').insert({
    child_id: parsed.data.child_id,
    station: 'reload',
    event_type: 'reload',
    tickets_delta: parsed.data.tickets_added,
    volunteer_name: parsed.data.staff_name || null,
  })

  await writeAudit({
    action: 'reload',
    actor: parsed.data.staff_name || 'volunteer',
    target_type: 'child',
    target_id: parsed.data.child_id,
    ip_address: ip,
    details: {
      tickets_added: parsed.data.tickets_added,
      payment_method: parsed.data.payment_method,
      amount_charged: parsed.data.amount_charged ?? null,
    },
  })

  return Response.json({ ok: true, balance: newBalance })
}
