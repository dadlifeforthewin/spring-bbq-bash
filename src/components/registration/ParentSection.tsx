'use client'
import { ChangeEvent } from 'react'

export type ParentValue = { name: string; phone: string; email: string }

export default function ParentSection({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string
  value: ParentValue
  onChange: (v: ParentValue) => void
  optional?: boolean
}) {
  const update = (field: keyof ParentValue) => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [field]: e.target.value })
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">{label}{optional && <span className="ml-2 text-sm text-slate-400">(optional)</span>}</legend>
      <label className="block">
        <span className="block text-sm">Name</span>
        <input type="text" required={!optional} value={value.name} onChange={update('name')}
          className="w-full rounded border px-3 py-2" />
      </label>
      <label className="block">
        <span className="block text-sm">Phone</span>
        <input type="tel" required={!optional} value={value.phone} onChange={update('phone')}
          className="w-full rounded border px-3 py-2" />
      </label>
      <label className="block">
        <span className="block text-sm">Email {!optional && '(required — your keepsake email will come here)'}</span>
        <input type="email" required={!optional} value={value.email} onChange={update('email')}
          className="w-full rounded border px-3 py-2" />
      </label>
    </fieldset>
  )
}
