import { NextRequest } from 'next/server'
import { z } from 'zod'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { isAdminAuthed } from '@/lib/admin-auth'
import { loadPhotoAsBase64, scoreMatch, classifyConfidence, FeatureVector } from '@/lib/face-matching'

const schema = z.object({ photo_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  // Either a volunteer/admin cookie OR an internal-key header lets this run.
  const internalKey = req.headers.get('x-internal-key')
  const validInternal = !!internalKey && internalKey === (process.env.MAGIC_LINK_SECRET ?? '')
  if (!validInternal && !isVolunteerAuthed() && !isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 400 })
  }

  const sb = serverClient()

  const { data: photo } = await sb
    .from('photos')
    .select('id, storage_path, capture_mode, match_status')
    .eq('id', parsed.data.photo_id)
    .maybeSingle()
  if (!photo) return Response.json({ error: 'photo not found' }, { status: 404 })
  if (photo.capture_mode !== 'roaming_vision') {
    return Response.json({ error: 'match pipeline only runs on roaming_vision photos' }, { status: 400 })
  }

  // Candidate kids: checked in, vision_matching_consent=true, have a face reference
  const { data: candidates } = await sb
    .from('children')
    .select('id, first_name, vision_matching_consent, checked_in_at, checked_out_at')
    .eq('vision_matching_consent', true)
    .not('checked_in_at', 'is', null)
    .is('checked_out_at', null)
  const activeKids = (candidates ?? []).filter((c) => c.checked_in_at && !c.checked_out_at)

  if (activeKids.length === 0) {
    await sb.from('photos').update({ match_status: 'unmatched' }).eq('id', photo.id)
    return Response.json({ ok: true, match_status: 'unmatched', reason: 'no eligible candidates' })
  }

  const { data: refs } = await sb
    .from('face_references')
    .select('child_id, embedding_data')
    .in('child_id', activeKids.map((c) => c.id))

  const refByChild = new Map<string, FeatureVector>()
  for (const r of refs ?? []) {
    refByChild.set(r.child_id, (r.embedding_data as FeatureVector) ?? {})
  }

  const { data: photoBytes } = await sb.storage.from('photos').download(photo.storage_path)
  if (!photoBytes) {
    await sb.from('photos').update({ match_status: 'unmatched' }).eq('id', photo.id)
    return Response.json({ error: 'photo download failed' }, { status: 500 })
  }
  const { data: base64, mediaType } = await loadPhotoAsBase64(photo.storage_path)

  type Scored = { child_id: string; first_name: string; confidence: number; reasoning: string }
  const scored: Scored[] = []

  for (const kid of activeKids) {
    const features = refByChild.get(kid.id)
    if (!features) continue
    try {
      const outcome = await scoreMatch(base64, mediaType, features, kid.first_name)
      if (outcome) {
        scored.push({
          child_id: kid.id,
          first_name: kid.first_name,
          confidence: Math.max(0, Math.min(1, outcome.confidence)),
          reasoning: outcome.reasoning,
        })
      }
    } catch (e) {
      console.error(`[photos/match] scoreMatch failed for ${kid.id}`, e)
    }
  }

  scored.sort((a, b) => b.confidence - a.confidence)
  const best = scored[0]

  if (!best) {
    await sb.from('photos').update({ match_status: 'unmatched' }).eq('id', photo.id)
    return Response.json({ ok: true, match_status: 'unmatched', reason: 'no vision scores returned' })
  }

  const bucket = classifyConfidence(best.confidence)

  if (bucket === 'auto') {
    await sb.from('photo_tags').insert({
      photo_id: photo.id,
      child_id: best.child_id,
      tagged_by: 'vision_auto',
    })
    await sb.from('photos')
      .update({ match_status: 'auto', match_confidence: best.confidence })
      .eq('id', photo.id)
    return Response.json({ ok: true, match_status: 'auto', match: best })
  }

  if (bucket === 'pending_review') {
    await sb.from('photos')
      .update({
        match_status: 'pending_review',
        match_confidence: best.confidence,
        vision_summary: { match_candidates: scored.slice(0, 3) },
      })
      .eq('id', photo.id)
    return Response.json({ ok: true, match_status: 'pending_review', candidates: scored.slice(0, 3) })
  }

  await sb.from('photos')
    .update({
      match_status: 'unmatched',
      match_confidence: best.confidence,
      vision_summary: { match_candidates: scored.slice(0, 3) },
    })
    .eq('id', photo.id)
  return Response.json({ ok: true, match_status: 'unmatched', best })
}
