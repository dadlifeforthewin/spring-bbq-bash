import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import CheckOutStation from '@/components/station/CheckOutStation'

export const dynamic = 'force-dynamic'

export default function CheckOutPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <CheckOutStation />
}
