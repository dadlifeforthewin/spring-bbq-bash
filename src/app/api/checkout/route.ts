import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { writeAudit } from '@/lib/audit'

const checkoutSchema = z.object({
  child_id: z.string().uuid(),
  checked_out_to_name: z.string().min(1).max(120),
  checked_out_by_staff_name: z.string().min(1).max(120),
  override_reason: z.string().max(500).optional(),
  override_approved_by_phone_staff: z.string().max(120).optional(),
})

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: child } = await sb
    .from('children')
    .select('id, checked_in_at, checked_out_at')
    .eq('id', parsed.data.child_id)
    .maybeSingle()
  if (!child) return Response.json({ error: 'child not found' }, { status: 404 })
  if (!child.checked_in_at) {
    return Response.json({ error: 'not checked in yet' }, { status: 409 })
  }
  if (child.checked_out_at) {
    return Response.json({ error: 'already checked out', checked_out_at: child.checked_out_at }, { status: 409 })
  }

  // Authorize the pickup name — either matches a guardian or a pickup_authorizations row
  const target = parsed.data.checked_out_to_name.trim().toLowerCase()
  const [{ data: guardians }, { data: pickups }] = await Promise.all([
    sb.from('guardians').select('name').eq('child_id', parsed.data.child_id),
    sb.from('pickup_authorizations').select('name').eq('child_id', parsed.data.child_id),
  ])
  const approvedNames = new Set<string>([
    ...(guardians ?? []).map((g) => (g.name ?? '').trim().toLowerCase()),
    ...(pickups ?? []).map((p) => (p.name ?? '').trim().toLowerCase()),
  ])

  const hasOverride = !!(parsed.data.override_reason && parsed.data.override_approved_by_phone_staff)
  if (!approvedNames.has(target) && !hasOverride) {
    return Response.json({
      error: 'pickup name not on approved list',
      approved: Array.from(approvedNames),
    }, { status: 403 })
  }

  const now = new Date().toISOString()
  await sb
    .from('children')
    .update({
      checked_out_at: now,
      checked_out_to_name: parsed.data.checked_out_to_name,
      checked_out_by_staff_name: parsed.data.checked_out_by_staff_name,
    })
    .eq('id', parsed.data.child_id)

  await sb.from('station_events').insert({
    child_id: parsed.data.child_id,
    station: 'check_out',
    event_type: 'check_out',
    volunteer_name: parsed.data.checked_out_by_staff_name,
  })

  await writeAudit({
    action: 'checkout',
    actor: parsed.data.checked_out_by_staff_name,
    target_type: 'child',
    target_id: parsed.data.child_id,
    ip_address: ip,
    details: {
      checked_out_to_name: parsed.data.checked_out_to_name,
      override_used: hasOverride,
      override_reason: parsed.data.override_reason ?? null,
    },
  })

  if (hasOverride) {
    await writeAudit({
      action: 'manual_pickup_override',
      actor: parsed.data.checked_out_by_staff_name,
      target_type: 'child',
      target_id: parsed.data.child_id,
      ip_address: ip,
      details: {
        override_reason: parsed.data.override_reason,
        override_approved_by_phone_staff: parsed.data.override_approved_by_phone_staff,
        checked_out_to_name: parsed.data.checked_out_to_name,
      },
    })
  }

  // Kick off AI story generation in the background. We forward the volunteer cookie
  // so /api/stories/generate's auth check passes; we don't await the response (the
  // generation takes ~2-5s; parent UI should not block on it).
  const cookie = req.headers.get('cookie') ?? ''
  const url = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(req.url).origin)
  void fetch(`${url}/api/stories/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ child_id: parsed.data.child_id }),
  }).catch((e) => {
    console.error('[checkout] background story generate failed', e)
  })

  return Response.json({ ok: true, checked_out_at: now })
}
