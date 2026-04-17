import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const SIGNED_URL_TTL = 60 * 60 // 1 hour

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')
  const captureMode = searchParams.get('capture_mode')
  const limit = Math.min(Number(searchParams.get('limit') ?? '60') || 60, 200)

  const sb = serverClient()

  if (childId) {
    const { data: tags } = await sb
      .from('photo_tags')
      .select('photo_id, photos(id, storage_path, taken_at, volunteer_name, capture_mode)')
      .eq('child_id', childId)
      .order('photo_id', { ascending: false })
      .limit(limit)
    const photos = (tags ?? [])
      .map((t) => t.photos as unknown as { id: string; storage_path: string; taken_at: string; volunteer_name: string | null; capture_mode: string } | null)
      .filter((p): p is NonNullable<typeof p> => !!p)
    const signed = await signAll(sb, photos)
    return Response.json({ photos: signed })
  }

  let q = sb
    .from('photos')
    .select('id, storage_path, taken_at, volunteer_name, capture_mode')
    .order('taken_at', { ascending: false })
    .limit(limit)
  if (captureMode) q = q.eq('capture_mode', captureMode)

  const { data, error } = await q
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  const signed = await signAll(sb, data ?? [])
  return Response.json({ photos: signed })
}

async function signAll(sb: ReturnType<typeof serverClient>, photos: { id: string; storage_path: string; taken_at: string; volunteer_name: string | null; capture_mode: string }[]) {
  const result: {
    id: string
    storage_path: string
    signed_url: string | null
    taken_at: string
    volunteer_name: string | null
    capture_mode: string
  }[] = []
  for (const p of photos) {
    const { data } = await sb.storage.from('photos').createSignedUrl(p.storage_path, SIGNED_URL_TTL)
    result.push({ ...p, signed_url: data?.signedUrl ?? null })
  }
  return result
}
