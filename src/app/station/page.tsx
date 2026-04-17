import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import { serverClient } from '@/lib/supabase'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import StationPicker from '@/components/station/StationPicker'

export const dynamic = 'force-dynamic'

export default async function StationPage() {
  if (!isVolunteerAuthed()) {
    return <VolunteerLogin />
  }

  const sb = serverClient()
  const { data: stations } = await sb
    .from('stations')
    .select('slug, name, sort_order')
    .order('sort_order', { ascending: true })

  return <StationPicker stations={(stations ?? []).map((s) => ({ slug: s.slug, name: s.name }))} />
}
