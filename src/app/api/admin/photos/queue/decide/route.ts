import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'
import { writeAudit } from '@/lib/audit'

const schema = z.object({
  photo_id: z.string().uuid(),
  action: z.enum(['confirm', 'reject']),
  child_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  if (parsed.data.action === 'confirm') {
    if (!parsed.data.child_id) {
      return Response.json({ error: 'child_id required for confirm' }, { status: 400 })
    }
    await sb.from('photo_tags').insert({
      photo_id: parsed.data.photo_id,
      child_id: parsed.data.child_id,
      tagged_by: 'admin_manual',
    })
    await sb.from('photos')
      .update({ match_status: 'confirmed' })
      .eq('id', parsed.data.photo_id)
    await writeAudit({
      action: 'photo_deleted',
      actor: 'admin',
      target_type: 'photo_match',
      target_id: parsed.data.photo_id,
      ip_address: ip,
      details: { action: 'confirm', child_id: parsed.data.child_id },
    })
    return Response.json({ ok: true, match_status: 'confirmed' })
  }

  // reject
  await sb.from('photos').update({ match_status: 'rejected' }).eq('id', parsed.data.photo_id)
  await writeAudit({
    action: 'photo_deleted',
    actor: 'admin',
    target_type: 'photo_match',
    target_id: parsed.data.photo_id,
    ip_address: ip,
    details: { action: 'reject' },
  })
  return Response.json({ ok: true, match_status: 'rejected' })
}
