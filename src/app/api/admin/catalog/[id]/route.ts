import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const patchSchema = z.object({
  station_slug: z.string().min(1).max(60).optional(),
  name: z.string().min(1).max(120).optional(),
  ticket_cost: z.number().int().min(0).max(50).optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }
  const sb = serverClient()
  const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'nothing to update' }, { status: 400 })
  }
  const { error } = await sb.from('catalog_items').update(updates).eq('id', params.id)
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { error } = await sb.from('catalog_items').delete().eq('id', params.id)
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
