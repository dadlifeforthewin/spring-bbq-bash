import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const station = searchParams.get('station')

  const sb = serverClient()
  let q = sb
    .from('catalog_items')
    .select('id, station_slug, name, ticket_cost, sort_order, active')
    .eq('active', true)
    .order('station_slug', { ascending: true })
    .order('sort_order', { ascending: true })

  if (station) q = q.eq('station_slug', station)

  const { data, error } = await q
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  return Response.json({ items: data ?? [] })
}
