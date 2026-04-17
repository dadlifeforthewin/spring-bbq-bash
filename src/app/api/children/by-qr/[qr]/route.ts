import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

export async function GET(_req: NextRequest, { params }: { params: { qr: string } }) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = serverClient()
  const { data: child, error } = await sb
    .from('children')
    .select('id, qr_code, first_name, last_name, age, grade, allergies, special_instructions, photo_consent_app, photo_consent_promo, vision_matching_consent, facts_reload_permission, facts_max_amount, ticket_balance, checked_in_at, checked_in_dropoff_type, checked_out_at, checked_out_to_name')
    .eq('qr_code', params.qr)
    .maybeSingle()

  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  if (!child) return Response.json({ error: 'not found' }, { status: 404 })

  const [{ data: guardians }, { data: pickups }] = await Promise.all([
    sb.from('guardians').select('name, phone, email, is_primary').eq('child_id', child.id),
    sb.from('pickup_authorizations').select('name, relationship').eq('child_id', child.id),
  ])

  const primary = (guardians ?? []).find((g) => g.is_primary) ?? null
  const secondary = (guardians ?? []).find((g) => !g.is_primary) ?? null

  return Response.json({
    child,
    primary_parent: primary ? { name: primary.name, phone: primary.phone, email: primary.email } : null,
    secondary_parent: secondary ? { name: secondary.name, phone: secondary.phone, email: secondary.email } : null,
    pickup_authorizations: pickups ?? [],
  })
}
