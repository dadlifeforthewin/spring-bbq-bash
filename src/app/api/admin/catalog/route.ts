import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const createSchema = z.object({
  station_slug: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  ticket_cost: z.number().int().min(0).max(50),
  sort_order: z.number().int().min(0).max(1000).optional().default(0),
  active: z.boolean().optional().default(true),
})

export async function GET() {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const [stations, items] = await Promise.all([
    sb.from('stations').select('slug, name, sort_order').order('sort_order', { ascending: true }),
    sb.from('catalog_items').select('id, station_slug, name, ticket_cost, sort_order, active')
      .order('station_slug', { ascending: true }).order('sort_order', { ascending: true }),
  ])
  return Response.json({ stations: stations.data ?? [], items: items.data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('catalog_items')
    .insert(parsed.data)
    .select('id, station_slug, name, ticket_cost, sort_order, active')
    .single()
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ item: data })
}
