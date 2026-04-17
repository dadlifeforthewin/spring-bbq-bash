import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'
import { writeAudit } from '@/lib/audit'

const patchSchema = z.object({
  untag_child_id: z.string().uuid().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  if (parsed.data.untag_child_id) {
    const { error } = await sb
      .from('photo_tags')
      .delete()
      .eq('photo_id', params.id)
      .eq('child_id', parsed.data.untag_child_id)
    if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

    await writeAudit({
      action: 'photo_deleted',
      actor: 'admin',
      target_type: 'photo_tag',
      target_id: params.id,
      ip_address: ip,
      details: { untagged_child_id: parsed.data.untag_child_id },
    })
  }

  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined

  const sb = serverClient()
  const { data: photo } = await sb
    .from('photos')
    .select('storage_path')
    .eq('id', params.id)
    .maybeSingle()
  if (!photo) return Response.json({ error: 'not found' }, { status: 404 })

  // Storage cleanup first — best effort
  await sb.storage.from('photos').remove([photo.storage_path])

  const { error } = await sb.from('photos').delete().eq('id', params.id)
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  await writeAudit({
    action: 'photo_deleted',
    actor: 'admin',
    target_type: 'photo',
    target_id: params.id,
    ip_address: ip,
    details: { storage_path: photo.storage_path },
  })

  return Response.json({ ok: true })
}
