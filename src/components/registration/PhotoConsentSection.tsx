'use client'

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
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold">Photo Permissions</legend>

      <label className="flex items-start gap-3 rounded border border-slate-200 p-3">
        <input
          type="checkbox"
          checked={value.photo_consent_app}
          onChange={(e) => set('photo_consent_app', e.target.checked)}
          aria-label="Include my child in photo memories"
          className="mt-1"
        />
        <span className="text-sm">
          <strong>Include my child in photo memories.</strong>{' '}
          Photos taken at the event will be included in the keepsake email the
          next morning.
        </span>
      </label>

      <label className="flex items-start gap-3 rounded border border-slate-200 p-3">
        <input
          type="checkbox"
          checked={value.photo_consent_promo}
          onChange={(e) => set('photo_consent_promo', e.target.checked)}
          aria-label="Include my child's photos for LCA promotional or social media use"
          className="mt-1"
        />
        <span className="text-sm">
          <strong>Allow promotional use.</strong>{' '}
          I also give permission for photos or videos of my child to be used for
          LCA promotional or social media purposes.
        </span>
      </label>

      <label className="flex items-start gap-3 rounded border border-fuchsia-200 bg-fuchsia-50 p-3">
        <input
          type="checkbox"
          checked={value.vision_matching_consent}
          onChange={(e) => set('vision_matching_consent', e.target.checked)}
          aria-label="Allow roaming photographer to auto-identify my child in photos"
          className="mt-1"
        />
        <span className="text-sm">
          <strong>Enable vision matching (optional, opt-in).</strong>{' '}
          Allow our roaming photographer to auto-identify my child in photos
          using face recognition. This means more candid shots of your child in
          the keepsake email without staff stopping them to scan their
          wristband. Face data stays on our servers and is deleted 30 days after
          the event.
        </span>
      </label>

      <label className="block">
        <span className="block text-sm">Type your full name to sign these photo consents</span>
        <input
          type="text"
          required
          value={value.photo_signature_name}
          onChange={(e) => set('photo_signature_name', e.target.value)}
          aria-label="Photo consent signature"
          className="w-full rounded border px-3 py-2"
        />
      </label>
    </fieldset>
  )
}
