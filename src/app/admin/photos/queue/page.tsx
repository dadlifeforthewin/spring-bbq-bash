import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import PhotoQueue from '@/components/admin/PhotoQueue'

export const dynamic = 'force-dynamic'

export default function PhotoQueuePage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><PhotoQueue /></AdminShell>
}
