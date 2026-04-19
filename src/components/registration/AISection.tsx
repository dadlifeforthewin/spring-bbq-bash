'use client'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'
import { Input, Checkbox } from '@/components/glow/Input'

const AI_DISCLOSURE_TEXT = `
The Glow Party Edition uses AI tools (provided by Anthropic, makers of Claude) to power some of the event experience. By signing below, I acknowledge:

1. What AI is used for. Photos uploaded during the event may be analyzed by AI to help organize and tag them. AI also generates personalized post-event content for families.

2. Who sees the AI output. Personalized post-event content about my child is delivered only to my family's email on file. LCA staff or volunteers may briefly review AI output internally for accuracy and tone before it's sent. The output is NOT shared with other families, displayed publicly, or used in marketing material.

3. What data is sent. Photos and basic event details (my child's first name, station visits, allergies, and special instructions) may be transmitted over an encrypted connection to Anthropic's commercial API for processing.

4. No model training. Anthropic does not use data submitted via its commercial API to train its AI models.

5. Retention. Face-matching descriptions are deleted 30 days after the event. Photos, post-event content, and child profiles are deleted 90 days after the event. Permission slip records are retained per Lincoln Christian Academy's records-retention policy.

6. Opt-out. AI-powered face matching is opt-in above (Step 4). Other AI features are part of the standard event experience offered to all attending families.

7. Questions or removal. Email Lincoln Christian Academy or Attn: To Detail (brian@attntodetail.ai) anytime to ask about my data or request early removal.

By typing my full name below and checking the acknowledgment box, I confirm I have read this AI and data use disclosure and consent on behalf of the child(ren) listed above.
`.trim()

export default function AISection({
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
        <CardEyebrow>Step 5</CardEyebrow>
        <CardTitle>AI &amp; data use</CardTitle>
      </div>

      <div
        data-testid="ai-disclosure-text"
        className="max-h-64 overflow-y-auto whitespace-pre-line rounded-xl border border-ink-hair bg-ink/50 p-4 text-sm leading-relaxed text-mist"
      >
        {AI_DISCLOSURE_TEXT}
      </div>

      <Input
        label="Type your full name to sign this AI disclosure"
        aria-label="Type your full name to sign this AI disclosure"
        placeholder="e.g. Jane Carter"
        required
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
      />

      <Checkbox
        aria-label="I electronically sign this AI and data use disclosure"
        checked={ack}
        onChange={(e) => setAck(e.target.checked)}
        label="I acknowledge that typing my name above constitutes a legally binding electronic signature on this AI and data use disclosure."
      />
    </Card>
  )
}
