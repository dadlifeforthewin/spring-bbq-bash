'use client'
import s from './registration.module.css'

const AI_DISCLOSURE_TEXT = `
The Glow Party Edition uses AI tools (provided by Anthropic, makers of Claude) to power some of the event experience. By signing below, I acknowledge:

1. What AI is used for. Photos uploaded during the event may be analyzed by AI to help organize and tag them. AI also generates personalized post-event content for families.

2. Who sees the AI output. Personalized post-event content about my child is delivered only to my family's email on file. LCA staff or volunteers may briefly review AI output internally for accuracy and tone before it's sent. The output is NOT shared with other families, displayed publicly, or used in marketing material.

3. What data is sent. Photos and basic event details (my child's first name, station visits, allergies, and special instructions) may be transmitted over an encrypted connection to Anthropic's commercial API for processing.

4. No model training. Anthropic does not use data submitted via its commercial API to train its AI models.

5. Retention. Face-matching descriptions are deleted 30 days after the event. Photos, post-event content, and child profiles are deleted 90 days after the event. Permission slip records are retained per Lincoln Christian Academy's records-retention policy.

6. Your choice. The OPT IN / OPT OUT choice below is mine to make. If I OPT OUT, my child can still attend the event — but no AI processing of their data will occur, no personalized post-event content will be generated for them, and they will not appear in any AI-tagged photos. AI-powered face matching is a separate opt-in above (Step 4).

7. Questions or removal. Email Lincoln Christian Academy or Attn: To Detail (brian@attntodetail.ai) anytime to ask about my data or request early removal.

By making my choice below, typing my full name, and checking the acknowledgment box, I confirm I have read this AI and data use disclosure and made my decision on behalf of the child(ren) listed above.
`.trim()

export default function AISection({
  typedName,
  setTypedName,
  ack,
  setAck,
  consent,
  setConsent,
}: {
  typedName: string
  setTypedName: (v: string) => void
  ack: boolean
  setAck: (v: boolean) => void
  consent: boolean | null
  setConsent: (v: boolean) => void
}) {
  return (
    <section className={`${s.card} ${s.cardAccentYellow}`}>
      <header className={s.cardHead}>
        <span className={s.cardEyebrow}>Step 5 / 5 · Disclosure</span>
        <h2 className={s.cardTitle}>AI &amp; data use</h2>
        <span className={s.cardSub}>One last read — then make your choice.</span>
      </header>

      <div data-testid="ai-disclosure-text" className={s.disclosure} tabIndex={0}>
        {AI_DISCLOSURE_TEXT}
      </div>

      <fieldset className={s.consentChoice} style={{ marginTop: 18 }}>
        <legend className={s.fieldLabel} style={{ marginBottom: 10 }}>
          My choice <span className={s.fieldRequired} aria-hidden>*</span>
        </legend>

        <div className={s.consentChoiceGrid}>
          <label
            className={`${s.consentOption} ${s.consentOptionIn} ${consent === true ? s.consentOptionActive : ''}`}
          >
            <input
              type="radio"
              name="ai_consent_choice"
              className={s.consentRadio}
              aria-label="Opt in to AI processing"
              checked={consent === true}
              onChange={() => setConsent(true)}
            />
            <span className={s.consentOptionHead}>
              <span className={s.consentOptionTitle}>OPT IN</span>
              <span className={s.consentOptionBadge}>Recommended</span>
            </span>
            <span className={s.consentOptionBody}>
              Process my child&apos;s data with AI as described above. My family
              gets the full Glow Party Edition experience, including the
              personalized post-event content.
            </span>
          </label>

          <label
            className={`${s.consentOption} ${s.consentOptionOut} ${consent === false ? s.consentOptionActive : ''}`}
          >
            <input
              type="radio"
              name="ai_consent_choice"
              className={s.consentRadio}
              aria-label="Opt out of AI processing"
              checked={consent === false}
              onChange={() => setConsent(false)}
            />
            <span className={s.consentOptionHead}>
              <span className={s.consentOptionTitle}>OPT OUT</span>
            </span>
            <span className={s.consentOptionBody}>
              No AI processing of my child&apos;s data. My child can still
              attend the event — but they won&apos;t appear in AI-tagged photos
              and we won&apos;t receive the personalized post-event content.
            </span>
          </label>
        </div>
      </fieldset>

      <label className={s.field} style={{ marginTop: 16 }}>
        <span className={s.fieldLabel}>
          Type your full name to sign this AI disclosure <span className={s.fieldRequired} aria-hidden>*</span>
        </span>
        <input
          className={s.input}
          type="text"
          aria-label="Type your full name to sign this AI disclosure"
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
          aria-label="I electronically sign this AI and data use disclosure"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span className={s.ackBox}>
          <svg className={s.ackCheck} viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>I acknowledge that typing my name above constitutes a legally binding electronic signature on this AI and data use disclosure, including the OPT IN / OPT OUT choice I made above.</span>
      </label>
    </section>
  )
}
