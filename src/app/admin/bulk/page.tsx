import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import BulkBalance from '@/components/admin/BulkBalance'

export const dynamic = 'force-dynamic'

export default function BulkPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><BulkBalance /></AdminShell>
}
