import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import LookupStation from '@/components/station/LookupStation'

export const dynamic = 'force-dynamic'

export default function LookupPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <LookupStation />
}
