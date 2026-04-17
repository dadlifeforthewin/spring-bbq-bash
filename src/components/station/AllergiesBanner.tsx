export default function AllergiesBanner({ allergies }: { allergies: string | null }) {
  if (!allergies || !allergies.trim()) return null
  return (
    <div
      data-testid="allergies-banner"
      className="w-full rounded bg-amber-400 px-4 py-3 text-base font-bold text-amber-950"
    >
      ⚠️ Allergies / medical: {allergies}
    </div>
  )
}
