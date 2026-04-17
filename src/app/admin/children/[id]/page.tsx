import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import ChildEditor from '@/components/admin/ChildEditor'

export const dynamic = 'force-dynamic'

export default function ChildDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><ChildEditor id={params.id} /></AdminShell>
}
