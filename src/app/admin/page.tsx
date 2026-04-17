import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import Dashboard from '@/components/admin/Dashboard'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  )
}
