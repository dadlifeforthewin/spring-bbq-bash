import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const patchSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  sub: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().min(0).max(10_000).optional(),
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
  const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'nothing to update' }, { status: 400 })
  }
  const sb = serverClient()
  const { data, error } = await sb
    .from('cleanup_tasks')
    .update(updates)
    .eq('id', params.id)
    .select('id, label, sub, sort_order, active, created_at')
    .single()
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ task: data })
}

// Soft delete: flip `active` to false. History (cleanup_completions) keeps the reference,
// and cleanup_completions.task_id is ON DELETE RESTRICT so a hard delete would 500.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sb = serverClient()
  const { error } = await sb.from('cleanup_tasks').update({ active: false }).eq('id', params.id)
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
