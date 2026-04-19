'use client'
import s from './registration.module.css'
import BigToggle from './BigToggle'

export type PhotoConsent = {
  photo_consent_app: boolean
  photo_consent_promo: boolean
  vision_matching_consent: boolean
  photo_signature_name: string
}

const PROMO_RELEASE = `I grant permission for photos or videos of my child taken during the Glow Party Bash to be used for promotional or social media purposes.

I agree to hold LCA, its employees, agents, successors, licensees, and assignees harmless against any liability, loss, or damage resulting from the use of my child's likeness, and I hereby release and discharge any claims whatsoever in connection with such use of my child's likeness.`

export default function PhotoConsentSection({
  value,
  onChange,
}: {
  value: PhotoConsent
  onChange: (v: PhotoConsent) => void
}) {
  const set = <K extends keyof PhotoConsent>(field: K, v: PhotoConsent[K]) =>
    onChange({ ...value, [field]: v })

  const onCount =
    (value.photo_consent_app ? 1 : 0) +
    (value.photo_consent_promo ? 1 : 0) +
    (value.vision_matching_consent ? 1 : 0)

  return (
    <section className={`${s.card} ${s.cardAccentPurple}`}>
      {/* Backstage Pass hero */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <span className={s.bpEyebrowPill}>
          <span className={s.bpEyebrowDot} aria-hidden />
          <span className={s.bpEyebrowText}>Backstage Pass · Step 4 / 5</span>
        </span>
      </div>
      <div className={s.bpHero}>
        <span className={s.bpHeroLine}>YOUR CALL.</span>
        <span className={`${s.bpHeroLine} ${s.accent}`}>NO PRESSURE.</span>
        <p className={s.bpHeroSub}>
          Each permission stands on its own — opt in only to what you&apos;re
          comfortable with. You can change any of these later.
        </p>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <BigToggle
          on={value.photo_consent_app}
          onChange={(next) => set('photo_consent_app', next)}
          color="cyan"
          icon={<span aria-hidden>📷</span>}
          title="INCLUDE MY CHILD IN PHOTO MEMORIES"
          sub="Allow volunteers and our event photographer to photograph my child during the party."
          ariaLabel="Include my child in photo memories"
        />

        <BigToggle
          on={value.photo_consent_promo}
          onChange={(next) => set('photo_consent_promo', next)}
          color="pink"
          icon={<span aria-hidden>✨</span>}
          title="ALLOW PROMOTIONAL & SOCIAL USE"
          sub="I also give permission for photos or videos of my child to be used for LCA promotional or social media purposes."
          ariaLabel="Include my child's photos for LCA promotional or social media use"
        >
          <details className={s.legalDetails}>
            <summary className={s.legalSummary}>Read full Photo/Video Release</summary>
            <div className={s.legalBody}>{PROMO_RELEASE}</div>
          </details>
        </BigToggle>

        <BigToggle
          on={value.vision_matching_consent}
          onChange={(next) => set('vision_matching_consent', next)}
          color="purple"
          icon={<span aria-hidden>👁</span>}
          title="ENABLE VISION MATCHING"
          sub="Allow our roaming photographer to auto-identify your child in photos using face recognition — so staff don't have to stop them to scan their wristband every time. Face data stays on our servers and is deleted 30 days after the event."
          ariaLabel="Allow roaming photographer to auto-identify my child in photos"
        />
      </div>

      {/* Status pill */}
      <div className={s.bpStatusWrap}>
        <span className={s.bpStatusPill} aria-live="polite">
          <span className={s.bpStatusDot} aria-hidden />
          {onCount} of 3 · You&apos;re on the list
        </span>
      </div>

      {/* Signature */}
      <label className={s.field} style={{ marginTop: 18 }}>
        <span className={s.fieldLabel}>
          Type your full name to sign these photo consents <span className={s.fieldRequired} aria-hidden>*</span>
        </span>
        <input
          className={s.input}
          type="text"
          aria-label="Photo consent signature"
          required
          value={value.photo_signature_name}
          onChange={(e) => set('photo_signature_name', e.target.value)}
        />
      </label>
    </section>
  )
}
