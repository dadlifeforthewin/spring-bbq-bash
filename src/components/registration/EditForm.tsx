'use client'
import { useState } from 'react'
import ParentSection, { ParentValue } from './ParentSection'
import PickupList from './PickupList'

type EditableChild = {
  id: string
  first_name: string
  last_name: string
  age: number | null
  grade: string
  allergies: string
  special_instructions: string
  pickup_authorizations: { name: string; relationship?: string | null }[]
  facts_reload_permission: boolean
  facts_max_amount: number
}

export type EditInitial = {
  primary_parent: ParentValue
  secondary_parent: ParentValue | null
  children: EditableChild[]
}

export default function EditForm({ token, initial }: { token: string; initial: EditInitial }) {
  const [primary, setPrimary] = useState<ParentValue>(initial.primary_parent)
  const [secondary, setSecondary] = useState<ParentValue | null>(initial.secondary_parent)
  const [children, setChildren] = useState<EditableChild[]>(initial.children)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // UI-only toggles per child — derived from initial payload so an
  // existing filled field stays open for edit. Payload shape unchanged.
  const [yesAllergies, setYesAllergies] = useState<boolean[]>(
    () => initial.children.map((c) => c.allergies.trim().length > 0),
  )
  const [yesSpecial, setYesSpecial] = useState<boolean[]>(
    () => initial.children.map((c) => c.special_instructions.trim().length > 0),
  )

  const setChild = (idx: number, patch: Partial<EditableChild>) =>
    setChildren(children.map((c, i) => i === idx ? { ...c, ...patch } : c))

  function setYesAt(setter: typeof setYesAllergies, idx: number, v: boolean) {
    setter((prev) => prev.map((p, i) => (i === idx ? v : p)))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)
    try {
      const payload = {
        primary_parent: primary,
        secondary_parent: secondary,
        children: children.map((c) => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          age: c.age,
          grade: c.grade,
          allergies: c.allergies,
          special_instructions: c.special_instructions,
          pickup_authorizations: c.pickup_authorizations.map((p) => ({
            name: p.name,
            relationship: p.relationship ?? '',
          })),
          facts_reload_permission: c.facts_reload_permission,
          facts_max_amount: c.facts_max_amount,
        })),
      }
      const res = await fetch(`/api/register/edit/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.issues ? JSON.stringify(data.issues) : data.error)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Edit your registration</h1>
        <p className="text-slate-600">Update contact info, pickup list, or FACTS settings. Child name, age, and signed waivers are locked — contact the school admin to change those.</p>
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
            <fieldset key={c.id} className="space-y-3 rounded border border-slate-200 p-4">
              <legend className="text-lg font-bold">
                {c.first_name} {c.last_name}
                {c.age != null && <span className="ml-2 text-sm text-slate-500">(age {c.age})</span>}
              </legend>

              <label className="block">
                <span className="block text-sm">Grade</span>
                <input type="text" value={c.grade}
                  onChange={(e) => setChild(i, { grade: e.target.value })}
                  className="w-full rounded border px-3 py-2" />
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Any allergies or medical notes?</legend>
                <div className="flex gap-2" role="radiogroup" aria-label="Any allergies or medical notes?">
                  <label className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${yesAllergies[i] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'}`}>
                    <input type="radio" className="sr-only" name={`edit-allergies-${c.id}`} checked={yesAllergies[i] === true}
                      onChange={() => setYesAt(setYesAllergies, i, true)} />
                    Yes
                  </label>
                  <label className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${!yesAllergies[i] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'}`}>
                    <input type="radio" className="sr-only" name={`edit-allergies-${c.id}`} checked={yesAllergies[i] === false}
                      onChange={() => { setYesAt(setYesAllergies, i, false); setChild(i, { allergies: '' }) }} />
                    No
                  </label>
                </div>
                {yesAllergies[i] && (
                  <label className="block">
                    <span className="block text-xs text-slate-500">Tell volunteers what to watch for.</span>
                    <textarea value={c.allergies} rows={2}
                      onChange={(e) => setChild(i, { allergies: e.target.value })}
                      aria-label="Allergies or medical notes"
                      className="w-full rounded border px-3 py-2" />
                  </label>
                )}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Anything else volunteers should know?</legend>
                <div className="flex gap-2" role="radiogroup" aria-label="Anything else volunteers should know?">
                  <label className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${yesSpecial[i] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'}`}>
                    <input type="radio" className="sr-only" name={`edit-special-${c.id}`} checked={yesSpecial[i] === true}
                      onChange={() => setYesAt(setYesSpecial, i, true)} />
                    Yes
                  </label>
                  <label className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${!yesSpecial[i] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'}`}>
                    <input type="radio" className="sr-only" name={`edit-special-${c.id}`} checked={yesSpecial[i] === false}
                      onChange={() => { setYesAt(setYesSpecial, i, false); setChild(i, { special_instructions: '' }) }} />
                    No
                  </label>
                </div>
                {yesSpecial[i] && (
                  <label className="block">
                    <span className="block text-xs text-slate-500">Pickup quirks, meltdowns to avoid, special requests.</span>
                    <textarea value={c.special_instructions} rows={2}
                      onChange={(e) => setChild(i, { special_instructions: e.target.value })}
                      aria-label="Special instructions"
                      className="w-full rounded border px-3 py-2" />
                  </label>
                )}
              </fieldset>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Approved pickup list</h3>
                <PickupList
                  value={c.pickup_authorizations.map((p) => ({ name: p.name, relationship: p.relationship ?? '' }))}
                  onChange={(v) => setChild(i, { pickup_authorizations: v })} />
              </div>

              <div className="space-y-2 rounded bg-slate-50 p-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox"
                    checked={c.facts_reload_permission}
                    onChange={(e) => {
                      const next = e.target.checked
                      setChild(i, {
                        facts_reload_permission: next,
                        facts_max_amount: next ? (c.facts_max_amount || 10) : 0,
                      })
                    }}
                    aria-label="FACTS reload permission" />
                  <span className="text-sm">FACTS reload permission</span>
                </label>
                <label className="block">
                  <span className="block text-sm">FACTS max amount ($0–$10)</span>
                  <input type="number" min={0} max={10}
                    value={c.facts_max_amount}
                    disabled={!c.facts_reload_permission}
                    onChange={(e) => setChild(i, {
                      facts_max_amount: Math.max(0, Math.min(10, Number(e.target.value) || 0)),
                    })}
                    aria-label="FACTS max amount"
                    className="w-32 rounded border px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400" />
                </label>
              </div>
            </fieldset>
          ))}
        </div>

        {error && <p className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded bg-green-50 border border-green-200 p-3 text-sm text-green-700">Saved — your changes are live.</p>}

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-fuchsia-600 text-white py-3 font-bold disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}
