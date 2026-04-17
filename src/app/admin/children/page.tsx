import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import ChildrenList from '@/components/admin/ChildrenList'

export const dynamic = 'force-dynamic'

export default function ChildrenListPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><ChildrenList /></AdminShell>
}
