import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

export async function GET(_req: NextRequest, { params }: { params: { qr: string } }) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = serverClient()
  const { data: child } = await sb
    .from('children')
    .select('id')
    .eq('qr_code', params.qr)
    .maybeSingle()
  if (!child) return Response.json({ error: 'not found' }, { status: 404 })

  const { data: events } = await sb
    .from('station_events')
    .select('id, station, event_type, tickets_delta, item_name, volunteer_name, created_at')
    .eq('child_id', child.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: reloads } = await sb
    .from('reload_events')
    .select('tickets_added, payment_method, amount_charged, staff_name, created_at')
    .eq('child_id', child.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return Response.json({ events: events ?? [], reloads: reloads ?? [] })
}
