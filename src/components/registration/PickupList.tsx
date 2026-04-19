'use client'
import s from './registration.module.css'

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
    <div className={s.pickupList}>
      <p className={s.fieldHint} style={{ margin: 0 }}>
        Besides yourselves, who else can pick up your child? Primary and secondary
        parents are auto-approved — you don&apos;t need to list them.
      </p>
      {value.length === 0 && (
        <p className={s.fieldHint} style={{ margin: 0 }}>
          No extra pickup people yet. Add one if grandparents, aunts, or friends might collect your child.
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {value.map((row, i) => (
          <li key={i} className={s.pickupRow}>
            <input
              className={s.input}
              placeholder="Name"
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <input
              className={s.input}
              placeholder="Relationship (optional)"
              value={row.relationship ?? ''}
              onChange={(e) => update(i, { relationship: e.target.value })}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`remove-${i}`}
              className={s.removeBtn}
              style={{ justifySelf: 'start', padding: '8px 10px' }}
            >
              ✕ Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className={s.addBtn}
        style={{ marginTop: 4 }}
      >
        + Add another person
      </button>
    </div>
  )
}
