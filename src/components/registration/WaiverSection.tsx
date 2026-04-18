'use client'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'
import { Input, Checkbox } from '@/components/glow/Input'

// TODO(plan Phase 2): swap in the final LCA paper-slip waiver text before the event.
const WAIVER_TEXT = `
In consideration of my child's participation in the LCA Spring BBQ Bash
— Glow Party Edition on April 25, 2026, I, as parent or legal guardian,
acknowledge and agree to the following:

1. I understand that my child will participate in activities including games,
   food service, supervised group events, a DJ and dance floor, and a
   themed "jail" photo station inside Lincoln Christian Academy's campus.

2. I voluntarily assume all risks associated with my child's participation,
   including risk of minor injury, food allergens, and the ordinary risks of
   active play and social interaction with other children.

3. I release and hold harmless LCA, its staff, volunteers, and affiliated
   organizations from any claims arising from my child's participation, except
   in cases of gross negligence or willful misconduct.

4. I authorize LCA staff and volunteers to obtain emergency medical care for
   my child if, in their judgment, such care is necessary and I cannot be
   reached in time.

5. I certify that the information I am providing on this permission slip —
   including allergies, contact numbers, and authorized pickup persons — is
   accurate to the best of my knowledge, and I agree to update it if it
   changes before the event.

By typing my full name below and checking the acknowledgment box, I am
providing my electronic signature for this permission slip and confirming
that I have the authority to sign on behalf of the child(ren) listed above.
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
