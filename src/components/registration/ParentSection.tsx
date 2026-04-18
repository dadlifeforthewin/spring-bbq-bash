'use client'
import { Input } from '@/components/glow/Input'
import { clsx } from '@/components/glow/clsx'

export type ParentValue = { name: string; phone: string; email: string }

export default function ParentSection({
  label,
  value,
  onChange,
  optional = false,
  eyebrow,
}: {
  label: string
  value: ParentValue
  onChange: (v: ParentValue) => void
  optional?: boolean
  eyebrow?: string
}) {
  const set = (field: keyof ParentValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value })

  return (
    <fieldset
      className={clsx(
        'space-y-4 rounded-2xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm p-5',
      )}
    >
      <legend className="mb-2 space-y-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-mist">
          {eyebrow ?? (optional ? 'Optional' : 'Parents')}
        </span>
        <span className="block font-display tracking-display text-lg text-paper">
          {label}
          {optional && <span className="ml-2 text-sm font-sans font-normal text-faint">(optional)</span>}
        </span>
      </legend>

      <Input
        label="Name"
        aria-label="Name"
        required={!optional}
        value={value.name}
        onChange={set('name')}
        placeholder="Jane Carter"
      />
      <Input
        label="Phone"
        aria-label="Phone"
        type="tel"
        required={!optional}
        value={value.phone}
        onChange={set('phone')}
        placeholder="555-111-2222"
      />
      <Input
        label="Email"
        aria-label="Email"
        type="email"
        required={!optional}
        hint={!optional ? 'Your keepsake email lands here the morning after the event.' : undefined}
        value={value.email}
        onChange={set('email')}
        placeholder="you@example.com"
      />
    </fieldset>
  )
}
