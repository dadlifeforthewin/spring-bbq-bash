import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import ReloadStation from '@/components/station/ReloadStation'

export const dynamic = 'force-dynamic'

export default function ReloadPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <ReloadStation />
}
