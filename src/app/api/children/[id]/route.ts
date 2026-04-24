import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'
import { writeAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const [{ data: child }, { data: guardians }, { data: pickups }, { data: photos }, { data: events }] = await Promise.all([
    sb.from('children').select('*').eq('id', params.id).maybeSingle(),
    sb.from('guardians').select('id, name, phone, email, is_primary').eq('child_id', params.id),
    sb.from('pickup_authorizations').select('id, name, relationship').eq('child_id', params.id),
    sb.from('photo_tags')
      .select('photo_id, photos(id, storage_path, taken_at, capture_mode)')
      .eq('child_id', params.id)
      .limit(50),
    sb.from('station_events')
      .select('id, station, event_type, tickets_delta, item_name, volunteer_name, created_at')
      .eq('child_id', params.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])
  if (!child) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json({
    child,
    guardians: guardians ?? [],
    pickup_authorizations: pickups ?? [],
    photos: photos ?? [],
    events: events ?? [],
  })
}

const patchSchema = z.object({
  first_name: z.string().min(1).max(60).optional(),
  last_name: z.string().min(1).max(60).optional(),
  age: z.number().int().min(1).max(25).nullable().optional(),
  grade: z.string().max(30).nullable().optional(),
  allergies: z.string().max(1000).nullable().optional(),
  special_instructions: z.string().max(1000).nullable().optional(),
  photo_consent_app: z.boolean().optional(),
  photo_consent_promo: z.boolean().optional(),
  vision_matching_consent: z.boolean().optional(),
  facts_reload_permission: z.boolean().optional(),
  facts_max_amount: z.number().int().min(0).max(10).optional(),
  ticket_balance: z.number().int().min(0).optional(),
  drink_tickets_remaining: z.number().int().min(0).max(20).optional(),
  jail_tickets_remaining: z.number().int().min(0).max(20).optional(),
  raffle_prize_name: z.string().trim().max(120).nullable().optional().or(z.literal('')),
  guardians: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(120),
    phone: z.string().max(30).optional().or(z.literal('')).nullable(),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    is_primary: z.boolean(),
    _delete: z.boolean().optional(),
  })).optional(),
  pickup_authorizations: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(120),
    relationship: z.string().max(60).optional().or(z.literal('')).nullable(),
    _delete: z.boolean().optional(),
  })).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: existing } = await sb
    .from('children')
    .select('id, photo_consent_app, photo_consent_promo, vision_matching_consent')
    .eq('id', params.id)
    .maybeSingle()
  if (!existing) return Response.json({ error: 'not found' }, { status: 404 })

  const { guardians, pickup_authorizations, ...childPatch } = parsed.data
  const updateable = Object.fromEntries(Object.entries(childPatch).filter(([, v]) => v !== undefined))
  if (Object.keys(updateable).length > 0) {
    const { error } = await sb.from('children').update(updateable).eq('id', params.id)
    if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  }

  // Audit consent changes
  const consentFields = ['photo_consent_app', 'photo_consent_promo', 'vision_matching_consent'] as const
  for (const k of consentFields) {
    if (k in childPatch && childPatch[k] !== undefined && childPatch[k] !== existing[k]) {
      await writeAudit({
        action: 'consent_change',
        actor: 'admin',
        target_type: 'child',
        target_id: params.id,
        ip_address: ip,
        details: { field: k, from: existing[k], to: childPatch[k] },
      })
    }
  }

  if (guardians) {
    for (const g of guardians) {
      if (g._delete && g.id) {
        await sb.from('guardians').delete().eq('id', g.id)
      } else if (g.id) {
        await sb.from('guardians').update({
          name: g.name, phone: g.phone || null, email: g.email || null, is_primary: g.is_primary,
        }).eq('id', g.id)
      } else {
        await sb.from('guardians').insert({
          child_id: params.id, name: g.name, phone: g.phone || null, email: g.email || null, is_primary: g.is_primary,
        })
      }
    }
  }

  if (pickup_authorizations) {
    for (const p of pickup_authorizations) {
      if (p._delete && p.id) {
        await sb.from('pickup_authorizations').delete().eq('id', p.id)
      } else if (p.id) {
        await sb.from('pickup_authorizations').update({
          name: p.name, relationship: p.relationship || null,
        }).eq('id', p.id)
      } else {
        await sb.from('pickup_authorizations').insert({
          child_id: params.id, name: p.name, relationship: p.relationship || null,
        })
      }
    }
  }

  return Response.json({ ok: true })
}
