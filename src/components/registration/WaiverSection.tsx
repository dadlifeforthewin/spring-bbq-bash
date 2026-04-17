'use client'

// TODO(plan Phase 2): replace placeholder copy with the final LCA paper-slip waiver text.
const WAIVER_TEXT = `
In consideration of my child's participation in the LCA Spring BBQ Glow Party Bash
on April 25, 2026, I, as parent or legal guardian, acknowledge and agree to the
following:

1. I understand that my child will participate in activities including, but not
   limited to, games, food service, outdoor play, and supervised group events on
   LCA property and its designated event grounds.

2. I voluntarily assume all risks associated with my child's participation,
   including risk of minor injury, food allergens, weather exposure, and the
   ordinary risks of active play and social interaction with other children.

3. I release and hold harmless LCA, its staff, volunteers, and affiliated
   organizations from any claims, demands, or liability arising from my child's
   participation, except in cases of gross negligence or willful misconduct.

4. I authorize LCA staff and volunteers to obtain emergency medical care for my
   child if, in their judgment, such care is necessary and I cannot be reached in
   time.

5. I certify that the information I am providing on this permission slip —
   including allergies, contact numbers, and authorized pickup persons — is
   accurate to the best of my knowledge, and I agree to update it if it changes
   before the event.

By typing my full name below and checking the acknowledgment box, I am providing
my electronic signature for this permission slip and confirming that I have
authority to sign on behalf of the child(ren) listed on this form.
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
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">Permission &amp; Liability Waiver</legend>

      <div
        data-testid="waiver-text"
        className="max-h-64 overflow-y-auto whitespace-pre-line rounded border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed"
      >
        {WAIVER_TEXT}
      </div>

      <label className="block">
        <span className="block text-sm">Type your full name to sign</span>
        <input
          type="text"
          required
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          aria-label="Type your full name"
          className="w-full rounded border px-3 py-2"
        />
      </label>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          aria-label="I acknowledge this electronic signature"
          className="mt-1"
        />
        <span className="text-sm">
          I acknowledge that typing my name above constitutes a legally binding
          electronic signature on this permission slip.
        </span>
      </label>
    </fieldset>
  )
}
