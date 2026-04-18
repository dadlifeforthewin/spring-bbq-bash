'use client'
import PickupList from './PickupList'
import { Card, CardEyebrow, CardTitle } from '@/components/glow/Card'
import { Input, Textarea, Checkbox } from '@/components/glow/Input'
import { Chip } from '@/components/glow/Chip'

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
  index,
}: {
  value: ChildInput
  onChange: (v: ChildInput) => void
  onRemove?: () => void
  index?: number
}) {
  const set = <K extends keyof ChildInput>(field: K, v: ChildInput[K]) =>
    onChange({ ...value, [field]: v })

  const displayName = [value.first_name, value.last_name].filter(Boolean).join(' ')

  return (
    <Card tone="raised" padded className="space-y-5 animate-rise">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardEyebrow>
            Child{typeof index === 'number' ? ` #${index + 1}` : ''}
          </CardEyebrow>
          <CardTitle>{displayName || 'New child'}</CardTitle>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold uppercase tracking-wider text-faint hover:text-danger transition"
          >
            Remove child
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="First name"
          required
          aria-label="First name"
          value={value.first_name}
          onChange={(e) => set('first_name', e.target.value)}
        />
        <Input
          label="Last name"
          required
          aria-label="Last name"
          value={value.last_name}
          onChange={(e) => set('last_name', e.target.value)}
        />
        <Input
          label="Age"
          type="number"
          min={1}
          max={25}
          aria-label="Age"
          value={value.age ?? ''}
          onChange={(e) =>
            set('age', e.target.value === '' ? null : Math.max(1, Math.min(25, Number(e.target.value))))
          }
        />
        <Input
          label="Grade"
          aria-label="Grade"
          value={value.grade}
          placeholder="e.g. 2nd"
          onChange={(e) => set('grade', e.target.value)}
        />
      </div>

      <Textarea
        label="Allergies or medical notes"
        hint="Optional. Leave blank if none."
        rows={2}
        value={value.allergies}
        onChange={(e) => set('allergies', e.target.value)}
      />

      <Textarea
        label="Special instructions"
        hint="Optional. Anything the volunteers should know."
        rows={2}
        value={value.special_instructions}
        onChange={(e) => set('special_instructions', e.target.value)}
      />

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">Approved pickup list</h3>
        <PickupList
          value={value.pickup_authorizations}
          onChange={(v) => set('pickup_authorizations', v)}
        />
      </section>

      <section className="rounded-xl border border-ink-hair bg-ink-3/40 p-4 space-y-3">
        <header className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">Included at the party</h3>
          <Chip tone="magenta" glow>2 drinks</Chip>
          <Chip tone="cyan" glow>3 jail / pass</Chip>
          <Chip tone="gold" glow>1 prize spin</Chip>
          <Chip tone="uv" glow>1 DJ shoutout</Chip>
        </header>
        <p className="text-xs text-faint">
          Every kid arrives with the full Glow Party Edition perks. You don&apos;t
          need to pick or preload anything — volunteers will track it all on the
          wristband.
        </p>
      </section>

      <section className="rounded-xl border border-ink-hair bg-ink-2/60 p-4 space-y-3">
        <header>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            Extra drinks via FACTS
            <span className="ml-2 text-faint font-normal normal-case tracking-normal">(optional)</span>
          </h3>
          <p className="text-xs text-faint mt-1">
            Allow volunteers to bill extra drink tickets to your FACTS account
            if your child asks for more during the night.
          </p>
        </header>
        <Checkbox
          label="Yes, allow FACTS billing for extra drinks"
          aria-label="FACTS reload permission"
          checked={value.facts_reload_permission}
          onChange={(e) => {
            const next = e.target.checked
            onChange({
              ...value,
              facts_reload_permission: next,
              facts_max_amount: next ? (value.facts_max_amount || 10) : 0,
            })
          }}
        />
        <Input
          label="Max additional amount ($0–$10)"
          type="number"
          min={0}
          max={10}
          aria-label="FACTS max amount"
          value={value.facts_max_amount}
          disabled={!value.facts_reload_permission}
          onChange={(e) => {
            const n = Math.max(0, Math.min(10, Number(e.target.value) || 0))
            set('facts_max_amount', n)
          }}
          className="max-w-[140px]"
        />
      </section>
    </Card>
  )
}
