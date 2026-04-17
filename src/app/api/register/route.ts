import { NextRequest } from 'next/server'
import { registrationSchema, walkupSchema } from '@/lib/validators'
import { serverClient } from '@/lib/supabase'
import { signToken } from '@/lib/magic-link'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null
  const ua = req.headers.get('user-agent') ?? null
  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'invalid json' }, { status: 400 })

  // Allow walkup flow (includes qr_code override) OR normal registration
  const isWalkup = typeof body.qr_code === 'string'
  const parsed = isWalkup ? walkupSchema.safeParse(body) : registrationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()
  const { data: eventRow } = await sb.from('events').select('id, default_initial_tickets').limit(1).single()
  if (!eventRow) return Response.json({ error: 'no event configured' }, { status: 500 })

  const created: { child_id: string; qr_code: string }[] = []

  for (const child of parsed.data.children) {
    const insertRow: Record<string, unknown> = {
      event_id: eventRow.id,
      first_name: child.first_name,
      last_name: child.last_name,
      age: child.age ?? null,
      grade: child.grade || null,
      allergies: child.allergies || null,
      special_instructions: child.special_instructions || null,
      photo_consent_app: parsed.data.photo_consent_app,
      photo_consent_promo: parsed.data.photo_consent_promo,
      vision_matching_consent: parsed.data.vision_matching_consent,
      facts_reload_permission: child.facts_reload_permission,
      facts_max_amount: child.facts_max_amount,
      ticket_balance: eventRow.default_initial_tickets,
    }
    if (isWalkup) insertRow.qr_code = (parsed.data as unknown as { qr_code: string }).qr_code

    const { data: created_child, error } = await sb
      .from('children')
      .insert(insertRow)
      .select('id, qr_code')
      .single()
    if (error || !created_child) {
      return Response.json({ error: 'db insert failed', details: error?.message }, { status: 500 })
    }

    // Guardians
    await sb.from('guardians').insert([
      { child_id: created_child.id, name: parsed.data.primary_parent.name,
        phone: parsed.data.primary_parent.phone, email: parsed.data.primary_parent.email,
        is_primary: true },
      ...(parsed.data.secondary_parent
        ? [{ child_id: created_child.id, name: parsed.data.secondary_parent.name,
             phone: parsed.data.secondary_parent.phone, email: parsed.data.secondary_parent.email,
             is_primary: false }]
        : []),
    ])

    // Pickup authorizations
    if (child.pickup_authorizations.length > 0) {
      await sb.from('pickup_authorizations').insert(
        child.pickup_authorizations.map((p) => ({
          child_id: created_child.id, name: p.name, relationship: p.relationship || null,
        }))
      )
    }

    // Signatures
    await sb.from('signatures').insert([
      { child_id: created_child.id, signature_type: 'liability_waiver',
        typed_name: parsed.data.waiver_signature.typed_name,
        ip_address: ip, user_agent: ua },
      { child_id: created_child.id, signature_type: 'photo_consent',
        typed_name: parsed.data.photo_signature.typed_name,
        ip_address: ip, user_agent: ua },
    ])

    // Pre-queue ai_stories row so generation pipeline has a target
    await sb.from('ai_stories').insert({ child_id: created_child.id, status: 'pending' })

    created.push({ child_id: created_child.id, qr_code: created_child.qr_code })
  }

  // Magic-link token scoped to primary parent email (covers the whole family)
  const editToken = signToken(
    { family_primary_email: parsed.data.primary_parent.email, scope: 'edit' },
    60 * 60 * 24 * 30 // 30 days
  )

  // NOTE: Resend sending wired in Phase 7. For now, log the payload the email would contain.
  console.log('[registration] confirmation email payload:', {
    to: parsed.data.primary_parent.email,
    children: created,
    edit_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')}/register/edit/${editToken}`,
  })

  return Response.json({ ok: true, created, edit_token: editToken })
}
