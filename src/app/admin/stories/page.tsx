import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import StoriesList from '@/components/admin/StoriesList'

export const dynamic = 'force-dynamic'

export default function StoriesPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><StoriesList /></AdminShell>
}
