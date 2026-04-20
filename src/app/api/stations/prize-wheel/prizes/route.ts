import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// Volunteer-scoped read of the active prize catalog. The /admin/prizes
// route is admin-only; the station page needs the same list without
// elevating the volunteer cookie.
export async function GET() {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('prizes')
    .select('id, label, sub, sort_order, active, created_at')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ prizes: data ?? [] })
}
