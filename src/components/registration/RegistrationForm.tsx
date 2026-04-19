'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ParentSection, { ParentValue } from './ParentSection'
import ChildBlock, { ChildInput, emptyChild } from './ChildBlock'
import WaiverSection from './WaiverSection'
import PhotoConsentSection, { PhotoConsent } from './PhotoConsentSection'
import AISection from './AISection'
import s from './registration.module.css'

type FormError = { title: string; items: string[] }

const FIELD_LABELS: Record<string, string> = {
  primary_parent: 'Primary parent',
  secondary_parent: 'Secondary parent',
  children: 'Children',
  waiver_signature: 'Waiver signature',
  photo_signature: 'Photo consent signature',
  ai_consent_signature: 'AI disclosure signature',
  photo_consent_app: 'Photo consent · event memories',
  photo_consent_promo: 'Photo consent · promotional use',
  vision_matching_consent: 'Vision matching consent',
  qr_code: 'Wristband code',
}

// Translate a raw Zod issue into something a parent can act on.
function humanizeMessage(field: string, raw: string): string {
  // Empty required string under children → almost always a missing first/last name.
  if (field === 'children' && /Too small.*expected.*string/i.test(raw)) {
    return 'At least one child is missing a first or last name.'
  }
  // Generic "Too small" string fallback
  if (/Too small.*expected.*string/i.test(raw)) return 'This field is required.'
  return raw
}

function formatRegistrationError(data: unknown): FormError {
  const fallback: FormError = { title: 'Something went wrong. Please try again.', items: [] }
  if (!data || typeof data !== 'object') return fallback
  const d = data as { error?: string; issues?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } }
  const items: string[] = []
  if (d.issues) {
    for (const e of d.issues.formErrors ?? []) items.push(e)
    for (const [field, msgs] of Object.entries(d.issues.fieldErrors ?? {})) {
      const label = FIELD_LABELS[field] ?? field
      for (const m of msgs) items.push(`${label}: ${humanizeMessage(field, m)}`)
    }
  }
  if (items.length === 0 && d.error) items.push(d.error)
  return {
    title: items.length
      ? 'A few things need your attention before we can submit:'
      : 'Something went wrong. Please try again.',
    items,
  }
}

/** sessionStorage key + payload shape consumed by /register/confirm.
 *  Keep these stable — both ends read the same key. */
export const REGISTRATION_RESULT_KEY = 'sbbq_register_result'
export type RegistrationResultPayload = {
  ok: true
  created: { child_id: string; qr_code: string }[]
  edit_token: string
  primary_email: string
  family_name: string
  children_meta: {
    qr_code: string
    first_name: string
    last_name: string
    grade: string
    allergies: string
  }[]
}

export default function RegistrationForm({ qrOverride }: { qrOverride?: string }) {
  const router = useRouter()
  const [primary, setPrimary] = useState<ParentValue>({ name: '', phone: '', email: '' })
  const [secondary, setSecondary] = useState<ParentValue | null>(null)
  const [children, setChildren] = useState<ChildInput[]>([emptyChild()])
  const [waiverName, setWaiverName] = useState('')
  const [waiverAck, setWaiverAck] = useState(false)
  const [photoConsent, setPhotoConsent] = useState<PhotoConsent>({
    photo_consent_app: false,
    photo_consent_promo: false,
    vision_matching_consent: false,
    photo_signature_name: '',
  })
  const [aiName, setAiName] = useState('')
  const [aiAck, setAiAck] = useState(false)
  const [aiConsent, setAiConsent] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<FormError | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        primary_parent: primary,
        secondary_parent: secondary,
        children: children.map((c) => ({
          first_name: c.first_name, last_name: c.last_name, age: c.age, grade: c.grade,
          allergies: c.allergies, special_instructions: c.special_instructions,
          pickup_authorizations: c.pickup_authorizations,
          facts_reload_permission: c.facts_reload_permission,
          facts_max_amount: c.facts_max_amount,
        })),
        waiver_signature: { typed_name: waiverName },
        photo_consent_app: photoConsent.photo_consent_app,
        photo_consent_promo: photoConsent.photo_consent_promo,
        vision_matching_consent: photoConsent.vision_matching_consent,
        photo_signature: { typed_name: photoConsent.photo_signature_name },
        ai_consent_signature: { typed_name: aiName },
        ai_consent_granted: aiConsent === true,
        ...(qrOverride ? { qr_code: qrOverride } : {}),
      }
      const res = await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(formatRegistrationError(data))
        return
      }

      // Stash the registration result for the marquee confirm screen.
      // The API returns child_id + qr_code per kid; we add the
      // parent-side metadata (names, allergies, primary email, family
      // name) so /register/confirm can render the gate-pass without
      // re-fetching anything from the DB.
      try {
        const familyName =
          children[0]?.last_name?.trim() ||
          primary.name.trim().split(/\s+/).slice(-1)[0] ||
          'Family'
        const stash: RegistrationResultPayload = {
          ok: true,
          created: data.created,
          edit_token: data.edit_token,
          primary_email: primary.email.trim(),
          family_name: familyName,
          children_meta: children.map((c, i) => ({
            qr_code: data.created[i]?.qr_code ?? '',
            first_name: c.first_name.trim(),
            last_name: c.last_name.trim(),
            grade: c.grade.trim(),
            allergies: c.allergies.trim(),
          })),
        }
        sessionStorage.setItem(REGISTRATION_RESULT_KEY, JSON.stringify(stash))
      } catch {
        // sessionStorage can throw in private mode / quota — confirm
        // page has a graceful fallback so we just swallow the error.
      }

      router.push('/register/confirm')
    } catch (e) {
      setError({
        title: 'Something went wrong. Please try again.',
        items: e instanceof Error && e.message ? [e.message] : [],
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Step counter shown in the topbar — purely informational.
  // Submit button stays enabled per the existing waiver/AI ack rules.
  const currentStep = (() => {
    if (aiAck && waiverAck && photoConsent.photo_signature_name) return 5
    if (waiverAck) return 4
    if (children.some((c) => c.first_name && c.last_name)) return 3
    if (primary.name && primary.email && primary.phone) return 2
    return 1
  })()

  return (
    <div className={s.shell}>
      {/* Atmosphere backdrop */}
      <div className={s.backdrop} aria-hidden>
        <div className={s.floor} />
        <div className={s.noise} />
      </div>

      <main className={s.main}>
        <div className={s.topbar}>
          <span className={s.crestPill}>
            <span className={s.crestSeal}>LCA</span>
            <span className={s.crestText}>Spring Bash &apos;26</span>
          </span>
          <span className={s.stepCounter}>Step {currentStep} / 5</span>
        </div>

        <header className={s.hero}>
          <span className={s.heroEyebrow}>Permission Slip · Lincoln Christian Academy</span>
          <h1 className={s.heroTitle}>
            SPRING BBQ BASH
            <span className="accent" style={{ display: 'block', color: 'var(--glow-yellow)', textShadow: '0 0 12px color-mix(in oklab, var(--glow-yellow) 70%, transparent)' }}>
              GLOW PARTY EDITION
            </span>
          </h1>
          <p className={s.heroSub}>
            Saturday, April 25, 2026 · 5:00 – 8:00 PM. Fill this out once per family. Every kid arrives with the full
            Glow Party Edition perks — you just tell us who&apos;s coming and sign the waiver.
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <ParentSection
            label="Primary Parent / Guardian"
            eyebrow="Step 1 / 5 · Parents"
            value={primary}
            onChange={setPrimary}
          />

          {secondary ? (
            <div style={{ marginTop: 18 }}>
              <ParentSection
                label="Secondary Parent"
                eyebrow="Step 1b · Optional"
                value={secondary}
                onChange={setSecondary}
                optional
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSecondary({ name: '', phone: '', email: '' })}
              className={s.addBtn}
              style={{ marginTop: 18 }}
            >
              + Add a secondary parent
            </button>
          )}

          <div className={s.kicker} style={{ marginTop: 32 }}>
            <span className={s.kickerLabel}>Step 2 / 5 · Children</span>
            <h2 className={s.kickerTitle}>BUILD EACH WRISTBAND</h2>
            <span className={s.kickerSub}>
              Each slot lights up as you load it. What you pick is what their wristband does at the gate.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {children.map((c, i) => (
              <ChildBlock
                key={i}
                index={i}
                value={c}
                onChange={(v) => setChildren(children.map((x, idx) => idx === i ? v : x))}
                onRemove={children.length > 1 ? () => setChildren(children.filter((_, idx) => idx !== i)) : undefined}
              />
            ))}
            <button
              type="button"
              onClick={() => setChildren([...children, emptyChild()])}
              className={s.addBtn}
            >
              + Add another child
            </button>
          </div>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <WaiverSection
              typedName={waiverName}
              setTypedName={setWaiverName}
              ack={waiverAck}
              setAck={setWaiverAck}
            />
            <PhotoConsentSection value={photoConsent} onChange={setPhotoConsent} />
            <AISection
              typedName={aiName}
              setTypedName={setAiName}
              ack={aiAck}
              setAck={setAiAck}
              consent={aiConsent}
              setConsent={setAiConsent}
            />
          </div>

          {/* Tiny morning-after teaser — preserves the keepsake surprise
              by talking around it. No "AI story" / "keepsake email" reveal. */}
          <div
            className={s.card}
            style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}
          >
            <div style={{ fontSize: 22 }} aria-hidden>✨</div>
            <div>
              <div className={s.cardEyebrow} style={{ color: 'var(--glow-yellow)' }}>One more thing…</div>
              <div className={s.cardSub} style={{ color: 'var(--ink)' }}>
                A little something is landing in your inbox the morning after the party. Watch for it — we think you&apos;ll like it.
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className={s.errorPill}>
              <div className={s.errorTitle}>{error.title}</div>
              {error.items.length > 0 && (
                <ul className={s.errorList}>
                  {error.items.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="submit"
              className={s.submit}
              disabled={!waiverAck || !aiAck || aiConsent === null || submitting}
              aria-disabled={!waiverAck || !aiAck || aiConsent === null || submitting}
            >
              {submitting ? 'SUBMITTING…' : 'SUBMIT PERMISSION SLIP →'}
            </button>
            <p className={s.metaLine}>
              Auto-saved · You can change any of these later
            </p>
            <p className={s.credit}>
              Built with love by{' '}
              <a href="https://attntodetail.ai">Attn: To Detail</a>
              {' '}for Lincoln Christian Academy.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
