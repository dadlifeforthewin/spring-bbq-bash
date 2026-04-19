'use client'
import s from './registration.module.css'

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
    <section className={`${s.card} ${s.cardAccentPurple}`}>
      <header className={s.cardHead}>
        <span className={s.cardEyebrow}>Step 3 / 5 · Permission</span>
        <h2 className={s.cardTitle}>Permission &amp; liability waiver</h2>
      </header>

      <div data-testid="waiver-text" className={s.disclosure} tabIndex={0}>
        {WAIVER_TEXT}
      </div>

      <label className={s.field} style={{ marginTop: 16 }}>
        <span className={s.fieldLabel}>
          Type your full name to sign <span className={s.fieldRequired} aria-hidden>*</span>
        </span>
        <input
          className={s.input}
          type="text"
          aria-label="Type your full name to sign"
          placeholder="e.g. Jane Carter"
          required
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
        />
      </label>

      <label className={s.ack} style={{ marginTop: 14 }}>
        <input
          type="checkbox"
          className={s.ackInput}
          aria-label="I electronically sign this permission slip"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span className={s.ackBox}>
          <svg className={s.ackCheck} viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>I acknowledge that typing my name above constitutes a legally binding electronic signature on this permission slip.</span>
      </label>
    </section>
  )
}
