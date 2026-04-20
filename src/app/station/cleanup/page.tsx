import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import CleanupStation from '@/components/station/CleanupStation'

export const dynamic = 'force-dynamic'

export default function CleanupPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <CleanupStation />
}
