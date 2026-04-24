import { isVolunteerAuthed } from '@/lib/volunteer-auth'
import VolunteerLogin from '@/components/station/VolunteerLogin'
import StationPicker from '@/components/station/StationPicker'

// Page is dynamic only because of the cookie check — no DB query happens
// here anymore. The stations list is fetched client-side from /api/stations
// (edge-cached + localStorage-cached) so subsequent "Back to stations"
// navs render instantly from cache while a background refresh runs.
export const dynamic = 'force-dynamic'

export default function StationPage() {
  if (!isVolunteerAuthed()) {
    return <VolunteerLogin />
  }
  return <StationPicker />
}
