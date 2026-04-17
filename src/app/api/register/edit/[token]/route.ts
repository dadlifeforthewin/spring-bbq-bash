import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/magic-link'
import { serverClient } from '@/lib/supabase'
import { registrationEditSchema } from '@/lib/validators'
import { writeAudit } from '@/lib/audit'

function authEmail(token: string): string | null {
  const payload = verifyToken(token)
  if (!payload) return null
  if (payload.scope !== 'edit') return null
  if (!payload.family_primary_email) return null
  return payload.family_primary_email
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const email = authEmail(params.token)
  if (!email) return Response.json({ error: 'invalid token' }, { status: 401 })

  const sb = serverClient()

  // Find primary-guardian rows for this email → child_ids
  const { data: primaryGuardians } = await sb
    .from('guardians')
    .select('child_id, name, phone, email')
    .eq('email', email)
    .eq('is_primary', true)

  const childIds = (primaryGuardians ?? []).map((g) => g.child_id)
  if (childIds.length === 0) return Response.json({ error: 'no children found' }, { status: 404 })

  const { data: children } = await sb
    .from('children')
    .select('id, first_name, last_name, age, grade, allergies, special_instructions, facts_reload_permission, facts_max_amount')
    .in('id', childIds)

  const { data: secondary } = await sb
    .from('guardians')
    .select('child_id, name, phone, email')
    .in('child_id', childIds)
    .eq('is_primary', false)

  const { data: pickups } = await sb
    .from('pickup_authorizations')
    .select('child_id, name, relationship')
    .in('child_id', childIds)

  const pickupByChild = new Map<string, { name: string; relationship: string | null }[]>()
  for (const p of pickups ?? []) {
    const list = pickupByChild.get(p.child_id) ?? []
    list.push({ name: p.name, relationship: p.relationship })
    pickupByChild.set(p.child_id, list)
  }

  const primary = primaryGuardians?.[0] ?? null
  const secondaryRow = secondary?.[0] ?? null

  return Response.json({
    primary_parent: primary
      ? { name: primary.name, phone: primary.phone ?? '', email: primary.email ?? '' }
      : null,
    secondary_parent: secondaryRow
      ? { name: secondaryRow.name, phone: secondaryRow.phone ?? '', email: secondaryRow.email ?? '' }
      : null,
    children: (children ?? []).map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      age: c.age,
      grade: c.grade ?? '',
      allergies: c.allergies ?? '',
      special_instructions: c.special_instructions ?? '',
      pickup_authorizations: pickupByChild.get(c.id) ?? [],
      facts_reload_permission: c.facts_reload_permission,
      facts_max_amount: c.facts_max_amount,
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const email = authEmail(params.token)
  if (!email) return Response.json({ error: 'invalid token' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'invalid json' }, { status: 400 })

  const parsed = registrationEditSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  // Guard: every child in the payload must be owned by this email's primary guardian
  const incomingIds = parsed.data.children.map((c) => c.id)
  const { data: ownedRows } = await sb
    .from('guardians')
    .select('child_id')
    .eq('email', email)
    .eq('is_primary', true)
    .in('child_id', incomingIds)
  const ownedIds = new Set((ownedRows ?? []).map((r) => r.child_id))
  for (const id of incomingIds) {
    if (!ownedIds.has(id)) {
      return Response.json({ error: 'forbidden — child not in family' }, { status: 403 })
    }
  }

  // Update each child's mutable fields (immutable: first_name, last_name, age, qr_code)
  for (const child of parsed.data.children) {
    await sb
      .from('children')
      .update({
        grade: child.grade || null,
        allergies: child.allergies || null,
        special_instructions: child.special_instructions || null,
        facts_reload_permission: child.facts_reload_permission,
        facts_max_amount: child.facts_max_amount,
      })
      .eq('id', child.id)

    // Replace pickup list for this child
    await sb.from('pickup_authorizations').delete().eq('child_id', child.id)
    if (child.pickup_authorizations.length > 0) {
      await sb.from('pickup_authorizations').insert(
        child.pickup_authorizations.map((p) => ({
          child_id: child.id,
          name: p.name,
          relationship: p.relationship || null,
        }))
      )
    }

    await writeAudit({
      action: 'registration_edit',
      actor: email,
      target_type: 'child',
      target_id: child.id,
      ip_address: ip,
      details: { pickup_count: child.pickup_authorizations.length },
    })
  }

  // Update primary + secondary guardian contact info on each child
  for (const id of incomingIds) {
    await sb
      .from('guardians')
      .update({
        name: parsed.data.primary_parent.name,
        phone: parsed.data.primary_parent.phone,
        email: parsed.data.primary_parent.email,
      })
      .eq('child_id', id)
      .eq('is_primary', true)

    if (parsed.data.secondary_parent) {
      const { data: existingSecondary } = await sb
        .from('guardians')
        .select('id')
        .eq('child_id', id)
        .eq('is_primary', false)
        .maybeSingle()

      if (existingSecondary) {
        await sb
          .from('guardians')
          .update({
            name: parsed.data.secondary_parent.name,
            phone: parsed.data.secondary_parent.phone,
            email: parsed.data.secondary_parent.email,
          })
          .eq('id', existingSecondary.id)
      } else {
        await sb.from('guardians').insert({
          child_id: id,
          name: parsed.data.secondary_parent.name,
          phone: parsed.data.secondary_parent.phone,
          email: parsed.data.secondary_parent.email,
          is_primary: false,
        })
      }
    }
  }

  return Response.json({ ok: true })
}
