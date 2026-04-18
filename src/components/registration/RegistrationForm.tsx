'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ParentSection, { ParentValue } from './ParentSection'
import ChildBlock, { ChildInput, emptyChild } from './ChildBlock'
import WaiverSection from './WaiverSection'
import PhotoConsentSection, { PhotoConsent } from './PhotoConsentSection'
import { Aurora } from '@/components/glow/Aurora'
import { Button } from '@/components/glow/Button'
import { GlowCross } from '@/components/glow/GlowCross'
import { Heading, Eyebrow } from '@/components/glow/Heading'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        ...(qrOverride ? { qr_code: qrOverride } : {}),
      }
      const res = await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.issues ? JSON.stringify(data.issues) : data.error)
      router.push('/register/confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <Aurora className="fixed inset-0 z-0" />

      <main className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-14 sm:pt-20">
        <header className="relative mb-12 text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <GlowCross size={72} tone="cyan" />
          </div>
          <div className="space-y-3">
            <Eyebrow tone="magenta">Permission Slip · Lincoln Christian Academy</Eyebrow>
            <Heading level={1} tone="wordmark" size="2xl" className="px-2">
              Spring BBQ Bash
            </Heading>
            <p className="font-display text-neon-gold text-glow-gold text-lg tracking-wide">
              Glow Party Edition
            </p>
            <p className="text-mist text-sm">
              Saturday, April 25, 2026 · 5:00–8:00 PM
            </p>
          </div>
          <p className="mx-auto max-w-md text-sm text-paper/80 leading-relaxed">
            Fill this out once per family. Every kid gets the full Glow Party
            Edition perks — you just tell us who&apos;s coming and sign the
            waiver.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          <ParentSection
            label="Primary Parent / Guardian"
            eyebrow="Step 1 · Parents"
            value={primary}
            onChange={setPrimary}
          />

          {secondary ? (
            <ParentSection
              label="Secondary Parent"
              eyebrow="Step 1b · Optional"
              value={secondary}
              onChange={setSecondary}
              optional
            />
          ) : (
            <button
              type="button"
              onClick={() => setSecondary({ name: '', phone: '', email: '' })}
              className="w-full rounded-xl border border-dashed border-ink-hair bg-ink-2/40 px-4 py-3 text-sm font-semibold text-neon-cyan hover:border-neon-cyan/50 hover:bg-ink-2 transition"
            >
              + Add a secondary parent
            </button>
          )}

          <section className="space-y-4 pt-2">
            <header className="space-y-1">
              <Eyebrow tone="cyan">Step 2 · Children</Eyebrow>
              <Heading level={2} size="md">Who&apos;s coming?</Heading>
            </header>
            <div className="space-y-4">
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
                className="w-full rounded-xl border border-dashed border-ink-hair bg-ink-2/40 px-4 py-3 text-sm font-semibold text-neon-cyan hover:border-neon-cyan/50 hover:bg-ink-2 transition"
              >
                + Add another child
              </button>
            </div>
          </section>

          <WaiverSection
            typedName={waiverName}
            setTypedName={setWaiverName}
            ack={waiverAck}
            setAck={setWaiverAck}
          />
          <PhotoConsentSection value={photoConsent} onChange={setPhotoConsent} />

          <Card tone="glow-gold" padded className="flex items-start gap-3">
            <div className="text-2xl animate-sparkle" aria-hidden>✨</div>
            <div>
              <CardEyebrow className="text-neon-gold">One more thing…</CardEyebrow>
              <CardTitle className="font-sans font-normal text-base text-paper">
                A little something is landing in your inbox the morning after
                the party. Watch for it — we think you&apos;ll like it.
              </CardTitle>
            </div>
          </Card>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              tone="magenta"
              size="xl"
              fullWidth
              loading={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit permission slip'}
            </Button>
            <p className="text-center text-xs text-faint">
              Built with love by{' '}
              <a href="https://attntodetail.ai" className="text-neon-cyan hover:text-glow-cyan">
                Attn: To Detail
              </a>
              {' '}for Lincoln Christian Academy.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
