import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'
import { writeAudit } from '@/lib/audit'

// Post-rebuild: this is now "reset perks" — restore every kid's drink + jail buckets and
// clear the prize-wheel / DJ-shoutout flags. Rarely used; helpful when the event starts
// over or when test data leaks into production.
const schema = z.object({
  drink_tickets: z.number().int().min(0).max(20).optional().default(2),
  jail_tickets:  z.number().int().min(0).max(20).optional().default(3),
  clear_one_time_flags: z.boolean().optional().default(true),
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

  let q = sb.from('children').select('id')
  if (parsed.data.only_not_checked_in) q = q.is('checked_in_at', null)
  const { data: children, error } = await q
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  const ids = (children ?? []).map((c) => c.id)
  if (ids.length === 0) return Response.json({ ok: true, updated: 0 })

  const patch: Record<string, unknown> = {
    drink_tickets_remaining: parsed.data.drink_tickets,
    jail_tickets_remaining:  parsed.data.jail_tickets,
  }
  if (parsed.data.clear_one_time_flags) {
    patch.prize_wheel_used_at = null
    patch.dj_shoutout_used_at = null
  }

  let updateQ = sb.from('children').update(patch).in('id', ids)
  if (parsed.data.only_not_checked_in) updateQ = updateQ.is('checked_in_at', null)
  const { error: updErr } = await updateQ
  if (updErr) return Response.json({ error: 'update failed', details: updErr.message }, { status: 500 })

  await writeAudit({
    action: 'reload',
    actor: 'admin-bulk',
    target_type: 'bulk',
    ip_address: ip,
    details: {
      scope: 'reset_perks',
      drink_tickets: parsed.data.drink_tickets,
      jail_tickets: parsed.data.jail_tickets,
      clear_one_time_flags: parsed.data.clear_one_time_flags,
      count: ids.length,
      only_not_checked_in: parsed.data.only_not_checked_in,
    },
  })

  return Response.json({ ok: true, updated: ids.length })
}
