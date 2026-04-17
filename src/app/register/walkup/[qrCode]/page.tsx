import RegistrationForm from '@/components/registration/RegistrationForm'

export default function WalkupPage({ params }: { params: { qrCode: string } }) {
  return <RegistrationForm qrOverride={params.qrCode} />
}
