'use client'
import { clsx } from '@/components/glow/clsx'

type Item = { name: string; relationship?: string }

export default function PickupList({
  value,
  onChange,
}: { value: Item[]; onChange: (v: Item[]) => void }) {
  const add = () => onChange([...value, { name: '', relationship: '' }])
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<Item>) =>
    onChange(value.map((row, idx) => idx === i ? { ...row, ...patch } : row))

  return (
    <div className="space-y-2">
      <p className="text-sm text-mist">
        Besides yourselves, who else can pick up your child? Primary and secondary
        parents are auto-approved — you don&apos;t need to list them.
      </p>
      {value.length === 0 && (
        <p className="text-xs text-faint">No extra pickup people yet. Add one if grandparents, aunts, or friends might collect your child.</p>
      )}
      <ul className="space-y-2">
        {value.map((row, i) => (
          <li key={i} className="flex flex-wrap gap-2">
            <input
              className={pickupFieldClass}
              placeholder="Name"
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <input
              className={clsx(pickupFieldClass, 'sm:w-48')}
              placeholder="Relationship (optional)"
              value={row.relationship ?? ''}
              onChange={(e) => update(i, { relationship: e.target.value })}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`remove-${i}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-ink-hair bg-ink-2 px-3 text-sm text-faint transition hover:border-danger/60 hover:text-danger"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-sm font-semibold text-neon-cyan hover:text-glow-cyan transition"
      >
        + Add another person
      </button>
    </div>
  )
}

const pickupFieldClass =
  'flex-1 min-w-[180px] rounded-xl border border-ink-hair bg-ink-2/70 px-4 py-2.5 text-base text-paper placeholder:text-faint outline-none transition focus:border-neon-cyan/70 focus:ring-4 focus:ring-neon-cyan/20'
