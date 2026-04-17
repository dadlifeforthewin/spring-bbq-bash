'use client'
import { ChangeEvent } from 'react'
import PickupList from './PickupList'

export type ChildInput = {
  first_name: string
  last_name: string
  age: number | null
  grade: string
  allergies: string
  special_instructions: string
  pickup_authorizations: { name: string; relationship?: string }[]
  facts_reload_permission: boolean
  facts_max_amount: number
}

export function emptyChild(): ChildInput {
  return {
    first_name: '',
    last_name: '',
    age: null,
    grade: '',
    allergies: '',
    special_instructions: '',
    pickup_authorizations: [],
    facts_reload_permission: true,
    facts_max_amount: 10,
  }
}

export default function ChildBlock({
  value,
  onChange,
  onRemove,
}: {
  value: ChildInput
  onChange: (v: ChildInput) => void
  onRemove?: () => void
}) {
  const set = <K extends keyof ChildInput>(field: K, v: ChildInput[K]) =>
    onChange({ ...value, [field]: v })

  const onText = (field: keyof ChildInput) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(field, e.target.value as never)

  const onAge = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    set('age', raw === '' ? null : Math.max(1, Math.min(25, Number(raw))))
  }

  const onFactsToggle = () => {
    const next = !value.facts_reload_permission
    onChange({
      ...value,
      facts_reload_permission: next,
      facts_max_amount: next ? (value.facts_max_amount || 10) : 0,
    })
  }

  const onFactsAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Math.max(0, Math.min(10, Number(e.target.value) || 0))
    set('facts_max_amount', n)
  }

  return (
    <fieldset className="space-y-3 rounded border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <legend className="text-lg font-bold">Child</legend>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-red-600">Remove</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm">First name</span>
          <input type="text" required value={value.first_name} onChange={onText('first_name')}
            className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="block text-sm">Last name</span>
          <input type="text" required value={value.last_name} onChange={onText('last_name')}
            className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="block text-sm">Age</span>
          <input type="number" min={1} max={25} value={value.age ?? ''} onChange={onAge}
            className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="block text-sm">Grade</span>
          <input type="text" value={value.grade} onChange={onText('grade')}
            className="w-full rounded border px-3 py-2" />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm">Allergies or medical conditions (optional)</span>
        <textarea value={value.allergies} onChange={onText('allergies')}
          rows={2} className="w-full rounded border px-3 py-2" />
      </label>

      <label className="block">
        <span className="block text-sm">Special instructions (optional)</span>
        <textarea value={value.special_instructions} onChange={onText('special_instructions')}
          rows={2} className="w-full rounded border px-3 py-2" />
      </label>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Approved pickup list</h3>
        <PickupList value={value.pickup_authorizations}
          onChange={(v) => set('pickup_authorizations', v)} />
      </div>

      <div className="space-y-2 rounded bg-slate-50 p-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={value.facts_reload_permission}
            onChange={onFactsToggle} aria-label="FACTS reload permission" />
          <span className="text-sm">FACTS reload permission (allow ticket refills up to cap)</span>
        </label>
        <label className="block">
          <span className="block text-sm">FACTS max amount (per reload, $0–$10)</span>
          <input type="number" min={0} max={10} value={value.facts_max_amount}
            disabled={!value.facts_reload_permission}
            onChange={onFactsAmount}
            aria-label="FACTS max amount"
            className="w-32 rounded border px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400" />
        </label>
      </div>
    </fieldset>
  )
}
