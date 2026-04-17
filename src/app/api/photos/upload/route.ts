import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

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
  if (!Array.isArray(childIds) || childIds.length === 0) {
    return Response.json({ error: 'at least one child_id required' }, { status: 400 })
  }

  const sb = serverClient()

  // Hard-block if any child has photo_consent_app = false (station flow only)
  const { data: childRows, error: childErr } = await sb
    .from('children')
    .select('id, photo_consent_app')
    .in('id', childIds)
  if (childErr) return Response.json({ error: 'db error', details: childErr.message }, { status: 500 })
  if (!childRows || childRows.length !== childIds.length) {
    return Response.json({ error: 'one or more child_ids not found' }, { status: 404 })
  }
  const blocked = childRows.filter((c) => !c.photo_consent_app).map((c) => c.id)
  if (blocked.length > 0) {
    return Response.json({ error: 'photo consent missing for child(ren)', blocked }, { status: 403 })
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

  const { data: photoRow, error: photoErr } = await sb
    .from('photos')
    .insert({
      storage_path: storagePath,
      capture_mode: captureMode,
      volunteer_name: typeof volunteerName === 'string' && volunteerName ? volunteerName : null,
      match_status: captureMode === 'station_scan' ? 'confirmed' : 'pending_review',
    })
    .select('id')
    .single()
  if (photoErr || !photoRow) {
    return Response.json({ error: 'photos insert failed', details: photoErr?.message }, { status: 500 })
  }

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

  return Response.json({
    ok: true,
    photo_id: photoRow.id,
    storage_path: storagePath,
    tagged_child_ids: childIds,
  })
}
