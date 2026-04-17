import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import StoryEditor from '@/components/admin/StoryEditor'

export const dynamic = 'force-dynamic'

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><StoryEditor id={params.id} /></AdminShell>
}
