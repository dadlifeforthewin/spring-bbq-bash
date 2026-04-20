import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import PrizeWheelStation from '@/components/station/PrizeWheelStation'

export const dynamic = 'force-dynamic'

export default function PrizeWheelPage() {
  if (!isVolunteerAuthed()) return <VolunteerLogin />
  return <PrizeWheelStation />
}
