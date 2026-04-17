import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import CheckInStation from '@/components/station/CheckInStation'

export const dynamic = 'force-dynamic'

export default function CheckInPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <CheckInStation />
}
