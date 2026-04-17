import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isAdminAuthed } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'all'

  const sb = serverClient()
  let q = sb
    .from('ai_stories')
    .select('id, child_id, status, generated_at, word_count, auto_check_score, photo_count, updated_at:generated_at, children(first_name, last_name, age, grade)')
    .order('generated_at', { ascending: false, nullsFirst: true })
    .limit(500)
  if (status !== 'all') q = q.eq('status', status)

  const { data, error } = await q
  if (error) return Response.json({ error: 'db error', details: error.message }, { status: 500 })

  return Response.json({ stories: data ?? [] })
}
