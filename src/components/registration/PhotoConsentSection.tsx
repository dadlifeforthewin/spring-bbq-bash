'use client'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'
import { Input, Checkbox } from '@/components/glow/Input'

export type PhotoConsent = {
  photo_consent_app: boolean
  photo_consent_promo: boolean
  vision_matching_consent: boolean
  photo_signature_name: string
}

export default function PhotoConsentSection({
  value,
  onChange,
}: {
  value: PhotoConsent
  onChange: (v: PhotoConsent) => void
}) {
  const set = <K extends keyof PhotoConsent>(field: K, v: PhotoConsent[K]) =>
    onChange({ ...value, [field]: v })

  return (
    <Card tone="default" padded className="space-y-4">
      <div className="space-y-1">
        <CardEyebrow>Step 4</CardEyebrow>
        <CardTitle>Photo permissions</CardTitle>
        <p className="text-sm text-mist">
          Each permission stands on its own — opt in only to what you&apos;re
          comfortable with.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block rounded-xl border border-ink-hair bg-ink-2/60 p-4 cursor-pointer hover:border-neon-cyan/40 transition">
          <Checkbox
            checked={value.photo_consent_app}
            onChange={(e) => set('photo_consent_app', e.target.checked)}
            aria-label="Include my child in photo memories"
            label={
              <span className="space-y-1">
                <span className="block font-semibold text-paper">Include my child in photo memories</span>
                <span className="block text-xs text-mist leading-relaxed">
                  Allow volunteers and our event photographer to photograph my
                  child during the party.
                </span>
              </span>
            }
          />
        </label>

        <label className="block rounded-xl border border-ink-hair bg-ink-2/60 p-4 cursor-pointer hover:border-neon-uv/40 transition">
          <Checkbox
            checked={value.photo_consent_promo}
            onChange={(e) => set('photo_consent_promo', e.target.checked)}
            aria-label="Include my child's photos for LCA promotional or social media use"
            label={
              <span className="space-y-1">
                <span className="block font-semibold text-paper">Allow promotional &amp; social use</span>
                <span className="block text-xs text-mist leading-relaxed">
                  I also give permission for photos or videos of my child to be
                  used for LCA promotional or social media purposes.
                </span>
              </span>
            }
          />
        </label>

        <label className="block rounded-xl border border-neon-uv/30 bg-gradient-to-br from-ink-3/70 to-ink-2/40 p-4 cursor-pointer hover:border-neon-uv/60 transition shadow-glow-uv/30">
          <Checkbox
            checked={value.vision_matching_consent}
            onChange={(e) => set('vision_matching_consent', e.target.checked)}
            aria-label="Allow roaming photographer to auto-identify my child in photos"
            label={
              <span className="space-y-1">
                <span className="block font-semibold text-paper">Enable vision matching <span className="text-neon-uv text-xs uppercase tracking-wider ml-1">Optional · opt-in</span></span>
                <span className="block text-xs text-mist leading-relaxed">
                  Allow our roaming photographer to auto-identify your child in
                  photos using face recognition — so staff don&apos;t have to
                  stop them to scan their wristband every time. Face data stays
                  on our servers and is deleted 30 days after the event.
                </span>
              </span>
            }
          />
        </label>
      </div>

      <Input
        label="Type your full name to sign these photo consents"
        aria-label="Photo consent signature"
        required
        value={value.photo_signature_name}
        onChange={(e) => set('photo_signature_name', e.target.value)}
      />
    </Card>
  )
}
