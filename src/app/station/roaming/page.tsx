import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import RoamingStation from '@/components/station/RoamingStation'

export const dynamic = 'force-dynamic'

export default function RoamingPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <RoamingStation />
}
