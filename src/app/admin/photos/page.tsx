import { isAdminAuthed } from '@/lib/admin-auth'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminShell from '@/components/admin/AdminShell'
import PhotoGallery from '@/components/admin/PhotoGallery'

export const dynamic = 'force-dynamic'

export default function PhotosPage() {
  if (!isAdminAuthed()) return <AdminLogin />
  return <AdminShell><PhotoGallery /></AdminShell>
}
