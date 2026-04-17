import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import SpendStation from '@/components/station/SpendStation'

export const dynamic = 'force-dynamic'

export default function SpendPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <SpendStation />
}
