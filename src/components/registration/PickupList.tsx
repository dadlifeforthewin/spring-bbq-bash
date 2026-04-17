'use client'

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
      <p className="text-sm text-slate-500">
        Who besides the parents can pick up your child? (Primary + secondary parent are auto-included.)
      </p>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Name"
            value={row.name} onChange={(e) => update(i, { name: e.target.value })} />
          <input className="w-40 rounded border px-3 py-2" placeholder="Relationship (optional)"
            value={row.relationship ?? ''} onChange={(e) => update(i, { relationship: e.target.value })} />
          <button type="button" onClick={() => remove(i)} aria-label={`remove-${i}`}
            className="px-3 py-2 rounded bg-slate-200">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-blue-600">
        + Add another person
      </button>
    </div>
  )
}
