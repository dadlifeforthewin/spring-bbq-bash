'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ParentSection, { ParentValue } from '@/components/registration/ParentSection'
import ChildBlock, { ChildInput, emptyChild } from '@/components/registration/ChildBlock'
import WaiverSection from '@/components/registration/WaiverSection'
import PhotoConsentSection, { PhotoConsent } from '@/components/registration/PhotoConsentSection'

export default function RegisterPage({ qrOverride }: { qrOverride?: string }) {
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
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">LCA Spring BBQ Glow Party Bash</h1>
        <p className="text-slate-600">April 25, 2026 · Permission Slip &amp; Registration</p>
      </header>
      <form onSubmit={onSubmit} className="space-y-8">
        <ParentSection label="Primary Parent / Guardian" value={primary} onChange={setPrimary} />
        {secondary
          ? <ParentSection label="Secondary Parent" value={secondary} onChange={setSecondary} optional />
          : <button type="button" onClick={() => setSecondary({ name: '', phone: '', email: '' })}
              className="text-blue-600 text-sm">+ Add secondary parent</button>}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Children</h2>
          {children.map((c, i) => (
            <ChildBlock key={i} value={c}
              onChange={(v) => setChildren(children.map((x, idx) => idx === i ? v : x))}
              onRemove={children.length > 1 ? () => setChildren(children.filter((_, idx) => idx !== i)) : undefined} />
          ))}
          <button type="button" onClick={() => setChildren([...children, emptyChild()])}
            className="text-blue-600">+ Add another child</button>
        </div>

        <WaiverSection typedName={waiverName} setTypedName={setWaiverName} ack={waiverAck} setAck={setWaiverAck} />
        <PhotoConsentSection value={photoConsent} onChange={setPhotoConsent} />

        <p className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          ✨ A special surprise will land in your inbox the morning after the event. Keep an eye out!
        </p>

        {error && <p className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full rounded bg-fuchsia-600 text-white py-3 font-bold disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Permission Slip'}
        </button>
      </form>
    </main>
  )
}
