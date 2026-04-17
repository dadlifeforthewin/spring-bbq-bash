import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { describeFace, summarizeVision } from '@/lib/face-matching'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_CAPTURE = new Set(['station_scan', 'roaming_vision'])

export async function POST(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'invalid multipart body' }, { status: 400 })
  }

  const file = form.get('photo')
  const childIdsRaw = form.get('child_ids')
  const station = form.get('station')
  const captureMode = form.get('capture_mode')
  const volunteerName = form.get('volunteer_name')

  if (!(file instanceof Blob)) {
    return Response.json({ error: 'photo is required' }, { status: 400 })
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json({ error: `unsupported type ${file.type}` }, { status: 415 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: `file too large (max ${MAX_BYTES})` }, { status: 413 })
  }
  if (typeof station !== 'string' || !station) {
    return Response.json({ error: 'station is required' }, { status: 400 })
  }
  if (typeof captureMode !== 'string' || !ALLOWED_CAPTURE.has(captureMode)) {
    return Response.json({ error: 'capture_mode must be station_scan or roaming_vision' }, { status: 400 })
  }
  let childIds: string[]
  try {
    childIds = JSON.parse(typeof childIdsRaw === 'string' ? childIdsRaw : '[]')
  } catch {
    return Response.json({ error: 'child_ids must be JSON array' }, { status: 400 })
  }
  if (!Array.isArray(childIds)) {
    return Response.json({ error: 'child_ids must be JSON array' }, { status: 400 })
  }
  // Roaming photos upload with empty child_ids (face matching fills them in); station scans require ≥1.
  if (captureMode === 'station_scan' && childIds.length === 0) {
    return Response.json({ error: 'at least one child_id required for station_scan' }, { status: 400 })
  }

  const sb = serverClient()

  let childRows: { id: string; photo_consent_app: boolean; first_name: string; vision_matching_consent: boolean }[] = []
  if (childIds.length > 0) {
    const { data, error: childErr } = await sb
      .from('children')
      .select('id, photo_consent_app, first_name, vision_matching_consent')
      .in('id', childIds)
    if (childErr) return Response.json({ error: 'db error', details: childErr.message }, { status: 500 })
    if (!data || data.length !== childIds.length) {
      return Response.json({ error: 'one or more child_ids not found' }, { status: 404 })
    }
    childRows = data

    // Consent hard-block applies to station_scan flows (roaming has no known kids yet)
    const blockedIds = data.filter((c) => !c.photo_consent_app).map((c) => c.id)
    if (blockedIds.length > 0) {
      return Response.json({ error: 'photo consent missing for child(ren)', blocked: blockedIds }, { status: 403 })
    }
  }

  // Upload to Storage: photos/<yyyy>/<mm>/<uuid>.<ext>
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const storagePath = `${yyyy}/${mm}/${uuid}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: upErr } = await sb.storage
    .from('photos')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })
  if (upErr) {
    return Response.json({ error: 'storage upload failed', details: upErr.message }, { status: 500 })
  }

  // New roaming uploads start unmatched; the /api/photos/match pipeline updates this.
  const initialMatchStatus =
    captureMode === 'station_scan' ? 'confirmed' : 'unmatched'

  const { data: photoRow, error: photoErr } = await sb
    .from('photos')
    .insert({
      storage_path: storagePath,
      capture_mode: captureMode,
      volunteer_name: typeof volunteerName === 'string' && volunteerName ? volunteerName : null,
      match_status: initialMatchStatus,
    })
    .select('id')
    .single()
  if (photoErr || !photoRow) {
    return Response.json({ error: 'photos insert failed', details: photoErr?.message }, { status: 500 })
  }

  if (childIds.length > 0) {
    const tagRows = childIds.map((id) => ({
      photo_id: photoRow.id,
      child_id: id,
      tagged_by: captureMode === 'station_scan' ? 'scan' : 'vision_auto',
    }))
    const { error: tagErr } = await sb.from('photo_tags').insert(tagRows)
    if (tagErr) {
      return Response.json({ error: 'photo_tags insert failed', details: tagErr.message }, { status: 500 })
    }

    const eventRows = childIds.map((id) => ({
      child_id: id,
      station,
      event_type: 'photo_taken',
      volunteer_name: typeof volunteerName === 'string' && volunteerName ? volunteerName : null,
    }))
    await sb.from('station_events').insert(eventRows)
  }

  // Fire-and-forget vision work. We don't block the upload response.
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mediaType: 'image/jpeg' | 'image/png' = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

  void runVisionBackground({
    photoId: photoRow.id,
    station,
    captureMode,
    base64,
    mediaType,
    childRows,
  }).catch((e) => console.error('[photos/upload] vision background failed', e))

  return Response.json({
    ok: true,
    photo_id: photoRow.id,
    storage_path: storagePath,
    tagged_child_ids: childIds,
  })
}

async function runVisionBackground(opts: {
  photoId: string
  station: string
  captureMode: string
  base64: string
  mediaType: 'image/jpeg' | 'image/png'
  childRows: { id: string; photo_consent_app: boolean; first_name: string; vision_matching_consent: boolean }[]
}) {
  if (!process.env.ANTHROPIC_API_KEY) return // no-op in envs without a key

  const sb = serverClient()

  // Summarize every photo for richer story generation later
  try {
    const summary = await summarizeVision(opts.base64, opts.mediaType)
    if (summary) {
      await sb.from('photos').update({ vision_summary: summary }).eq('id', opts.photoId)
    }
  } catch (e) {
    console.error('[photos/upload] summarize failed', e)
  }

  // Jail mugshot + vision_matching_consent → extract face reference feature vector
  if (opts.captureMode === 'station_scan' && opts.station === 'jail') {
    for (const child of opts.childRows) {
      if (!child.vision_matching_consent) continue
      try {
        const features = await describeFace(opts.base64, opts.mediaType, child.first_name)
        if (features) {
          await sb.from('face_references').insert({
            child_id: child.id,
            reference_photo_id: opts.photoId,
            embedding_data: features,
          })
        }
      } catch (e) {
        console.error('[photos/upload] describeFace failed', e)
      }
    }
  }

  // Roaming mode → kick off the match pipeline for this photo
  if (opts.captureMode === 'roaming_vision') {
    const url = process.env.NEXT_PUBLIC_SITE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    if (!url) return
    try {
      // Uses the service role via internal route; no cookie needed server-side.
      await fetch(`${url}/api/photos/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.MAGIC_LINK_SECRET ?? '' },
        body: JSON.stringify({ photo_id: opts.photoId }),
      })
    } catch (e) {
      console.error('[photos/upload] match kick-off failed', e)
    }
  }
}
