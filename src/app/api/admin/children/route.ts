import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const search = (searchParams.get('q') ?? '').trim()
  const status = searchParams.get('status') ?? 'all' // all | not_arrived | checked_in | checked_out
  const allergies = searchParams.get('allergies') === '1'
  const photoConsent = searchParams.get('photo_consent') // 'yes' | 'no' | null

  const sb = serverClient()
  let q = sb
    .from('children')
    .select('id, qr_code, first_name, last_name, age, grade, allergies, photo_consent_app, photo_consent_promo, vision_matching_consent, drink_tickets_remaining, jail_tickets_remaining, prize_wheel_used_at, dj_shoutout_used_at, checked_in_at, checked_out_at, created_at')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .limit(500)

  if (search) {
    q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,qr_code.eq.${search}`)
  }
  if (status === 'not_arrived') q = q.is('checked_in_at', null)
  if (status === 'checked_in') q = q.not('checked_in_at', 'is', null).is('checked_out_at', null)
  if (status === 'checked_out') q = q.not('checked_out_at', 'is', null)
  if (allergies) q = q.not('allergies', 'is', null).neq('allergies', '')
  if (photoConsent === 'yes') q = q.eq('photo_consent_app', true)
  if (photoConsent === 'no') q = q.eq('photo_consent_app', false)

  const { data, error } = await q
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  return Response.json({ children: data ?? [] })
}
