import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import ActivityStation from '@/components/station/ActivityStation'

export const dynamic = 'force-dynamic'

export default function ActivityPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <ActivityStation />
}
