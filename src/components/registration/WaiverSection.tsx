'use client'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'
import { Input, Checkbox } from '@/components/glow/Input'

const WAIVER_TEXT = `
I give my permission for my child to take part in the Spring BBQ Bash. If it should become necessary for my child to receive medical treatment for any reason during any of these activities, I authorize school personnel or another appointed advisor to seek and consent to emergency medical attention for my child as needed; and I further agree to be liable for and to pay all costs incurred in connection with such medical attention.

I hereby release Lincoln Christian Academy, its employees, agents, and volunteers, from any and all liability, claims, demands, causes of action, and possible causes of action whatsoever arising out of or related to any loss, damage, or injury (including death) that may be sustained by my child while participating in school activities. Furthermore, I take full responsibility for my child's actions and will pay for any damages caused by my child.
`.trim()

export default function WaiverSection({
  typedName,
  setTypedName,
  ack,
  setAck,
}: {
  typedName: string
  setTypedName: (v: string) => void
  ack: boolean
  setAck: (v: boolean) => void
}) {
  return (
    <Card tone="default" padded className="space-y-4">
      <div className="space-y-1">
        <CardEyebrow>Step 3</CardEyebrow>
        <CardTitle>Permission &amp; liability waiver</CardTitle>
      </div>

      <div
        data-testid="waiver-text"
        className="max-h-64 overflow-y-auto whitespace-pre-line rounded-xl border border-ink-hair bg-ink/50 p-4 text-sm leading-relaxed text-mist"
      >
        {WAIVER_TEXT}
      </div>

      <Input
        label="Type your full name to sign"
        aria-label="Type your full name to sign"
        placeholder="e.g. Jane Carter"
        required
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
      />

      <Checkbox
        aria-label="I electronically sign this permission slip"
        checked={ack}
        onChange={(e) => setAck(e.target.checked)}
        label="I acknowledge that typing my name above constitutes a legally binding electronic signature on this permission slip."
      />
    </Card>
  )
}
