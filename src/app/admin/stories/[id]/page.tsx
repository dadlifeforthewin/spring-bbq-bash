import StoryEditor from '@/components/admin/StoryEditor'

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  return <StoryEditor id={params.id} />
}
