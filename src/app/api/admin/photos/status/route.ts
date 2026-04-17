import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { isAdminAuthed } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!isVolunteerAuthed() && !isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const photoId = searchParams.get('photo_id')
  if (!photoId) return Response.json({ error: 'photo_id required' }, { status: 400 })

  const sb = serverClient()
  const { data: photo } = await sb
    .from('photos')
    .select('id, match_status, match_confidence, capture_mode')
    .eq('id', photoId)
    .maybeSingle()
  if (!photo) return Response.json({ error: 'not found' }, { status: 404 })

  let matched_name: string | null = null
  if (photo.match_status === 'auto') {
    const { data: tag } = await sb
      .from('photo_tags')
      .select('children(first_name, last_name)')
      .eq('photo_id', photoId)
      .eq('tagged_by', 'vision_auto')
      .limit(1)
      .maybeSingle()
    const c = tag?.children as unknown as { first_name: string; last_name: string } | null
    if (c) matched_name = `${c.first_name} ${c.last_name}`
  }

  return Response.json({
    photo_id: photo.id,
    match_status: photo.match_status,
    match_confidence: photo.match_confidence,
    capture_mode: photo.capture_mode,
    matched_name,
  })
}
