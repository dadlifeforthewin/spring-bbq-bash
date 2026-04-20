import ChildEditor from '@/components/admin/ChildEditor'

export default function ChildDetailPage({ params }: { params: { id: string } }) {
  return <ChildEditor id={params.id} />
}
