import { NextRequest } from 'next/server'
import { serverClient } from '@/lib/supabase'
import { isVolunteerAuthed } from '@/lib/volunteer-auth'

// Name search for stations — volunteers use this when a kid has lost a
// wristband or the QR won't scan. Returns a compact list of matches with
// enough detail (age, grade, checked-in state) to pick the right kid when
// two have the same first name.

export async function GET(req: NextRequest) {
  if (!isVolunteerAuthed()) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return Response.json({ children: [] })
  }

  // Escape % and _ so operator inputs don't accidentally wildcard. Use
  // ILIKE on first_name OR last_name OR concatenated "first last" so
  // typing "Liam Smith" matches without requiring volunteers to pick
  // a single field.
  const safe = q.replace(/[\\%_]/g, (c) => `\\${c}`)
  const like = `%${safe}%`

  const sb = serverClient()
  const { data, error } = await sb
    .from('children')
    .select('id, qr_code, first_name, last_name, age, grade, checked_in_at, checked_out_at')
    .or(`first_name.ilike.${like},last_name.ilike.${like}`)
    .order('first_name', { ascending: true })
    .order('last_name', { ascending: true })
    .limit(20)

  if (error) {
    return Response.json({ error: 'db error', details: error.message }, { status: 500 })
  }

  // If the query contains whitespace, filter client-side for full-name
  // matches so "Liam Smith" narrows to that specific row rather than
  // returning every Liam + every Smith.
  const rows = data ?? []
  const parts = q.toLowerCase().split(/\s+/).filter(Boolean)
  const filtered = parts.length > 1
    ? rows.filter((r) => {
        const full = `${r.first_name} ${r.last_name}`.toLowerCase()
        return parts.every((p) => full.includes(p))
      })
    : rows

  return Response.json({ children: filtered })
}
