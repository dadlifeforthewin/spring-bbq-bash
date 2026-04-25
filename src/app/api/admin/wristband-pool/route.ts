import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

export async function GET(_req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('wristband_pool')
    .select('qr_code, pool_position, claimed_at')
    .is('claimed_at', null)
    .order('pool_position', { ascending: true })
  if (error) {
    return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  }
  return Response.json({ pool: data ?? [] })
}
