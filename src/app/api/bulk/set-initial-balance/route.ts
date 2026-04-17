import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'
import { writeAudit } from '@/lib/audit'

const schema = z.object({
  balance: z.number().int().min(0).max(100),
  only_not_checked_in: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  let q = sb.from('children').select('id, ticket_balance')
  if (parsed.data.only_not_checked_in) q = q.is('checked_in_at', null)
  const { data: children, error } = await q
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  const ids = (children ?? []).map((c) => c.id)
  if (ids.length === 0) return Response.json({ ok: true, updated: 0 })

  let updateQ = sb.from('children').update({ ticket_balance: parsed.data.balance }).in('id', ids)
  if (parsed.data.only_not_checked_in) updateQ = updateQ.is('checked_in_at', null)
  const { error: updErr } = await updateQ
  if (updErr) return Response.json({ error: 'update failed', details: updErr.message }, { status: 500 })

  // Insert a comp reload row per child so the audit trail + stats reflect the top-up
  await sb.from('reload_events').insert(
    ids.map((child_id) => ({
      child_id,
      tickets_added: parsed.data.balance,
      payment_method: 'comp' as const,
      amount_charged: null,
      staff_name: 'admin-bulk',
    }))
  )

  await writeAudit({
    action: 'reload',
    actor: 'admin-bulk',
    target_type: 'bulk',
    ip_address: ip,
    details: {
      scope: 'set_initial_balance',
      balance: parsed.data.balance,
      count: ids.length,
      only_not_checked_in: parsed.data.only_not_checked_in,
    },
  })

  return Response.json({ ok: true, updated: ids.length })
}
