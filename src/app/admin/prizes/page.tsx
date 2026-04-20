import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import PrizesEditor from '@/components/admin/PrizesEditor'

export const dynamic = 'force-dynamic'

export default function PrizesAdminPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return (
    <AdminShell>
      <PrizesEditor />
    </AdminShell>
  )
}
