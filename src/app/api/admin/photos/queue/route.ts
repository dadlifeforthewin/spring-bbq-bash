import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

const SIGNED_URL_TTL = 60 * 60

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending_review'

  const sb = serverClient()
  const { data: photos } = await sb
    .from('photos')
    .select('id, storage_path, taken_at, match_status, match_confidence, vision_summary, capture_mode')
    .eq('match_status', status)
    .order('taken_at', { ascending: false })
    .limit(100)

  const results = []
  for (const p of photos ?? []) {
    const { data: signed } = await sb.storage.from('photos').createSignedUrl(p.storage_path, SIGNED_URL_TTL)
    const summary = (p.vision_summary as { match_candidates?: { child_id: string; first_name: string; confidence: number; reasoning: string }[] } | null) ?? null
    results.push({
      id: p.id,
      signed_url: signed?.signedUrl ?? null,
      taken_at: p.taken_at,
      match_status: p.match_status,
      match_confidence: p.match_confidence,
      candidates: summary?.match_candidates ?? [],
    })
  }
  return Response.json({ photos: results })
}
