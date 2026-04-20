import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminChrome from '@/components/admin/AdminChrome'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminChrome>{children}</AdminChrome>
}
