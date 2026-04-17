import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import Settings from '@/components/admin/Settings'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><Settings /></AdminShell>
}
