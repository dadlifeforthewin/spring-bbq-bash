import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import CatalogEditor from '@/components/admin/CatalogEditor'

export const dynamic = 'force-dynamic'

export default function StationsPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><CatalogEditor /></AdminShell>
}
