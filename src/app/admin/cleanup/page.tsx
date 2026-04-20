import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import CleanupEditor from '@/components/admin/CleanupEditor'

export const dynamic = 'force-dynamic'

export default function CleanupAdminPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return (
    <AdminShell>
      <CleanupEditor />
    </AdminShell>
  )
}
