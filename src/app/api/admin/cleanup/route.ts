import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const createSchema = z.object({
  label: z.string().min(1).max(120),
  sub: z.string().max(200).optional(),
  sort_order: z.number().int().min(0).max(10_000).optional(),
})

export async function GET() {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('cleanup_tasks')
    .select('id, label, sub, sort_order, active, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ tasks: data ?? [] })
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

  let sort_order: number
  if (parsed.data.sort_order !== undefined) {
    sort_order = parsed.data.sort_order
  } else {
    const { data: maxRow } = await sb
      .from('cleanup_tasks')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    sort_order = ((maxRow?.sort_order as number | undefined) ?? 0) + 10
  }

  const insertPayload: { label: string; sub?: string; sort_order: number } = {
    label: parsed.data.label,
    sort_order,
  }
  if (parsed.data.sub !== undefined) insertPayload.sub = parsed.data.sub

  const { data, error } = await sb
    .from('cleanup_tasks')
    .insert(insertPayload)
    .select('id, label, sub, sort_order, active, created_at')
    .single()
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ task: data })
}
