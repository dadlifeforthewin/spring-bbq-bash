'use client'
import s from './registration.module.css'

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

  const titleId = `parent-title-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  return (
    <section className={s.card} role="group" aria-labelledby={titleId}>
      <div className={s.cardHead}>
        <span className={s.cardEyebrow}>
          {eyebrow ?? (optional ? 'Optional' : 'Step 1 · Parents')}
        </span>
        <span className={s.cardTitle} id={titleId}>
          {label}
          {optional && <span style={{ marginLeft: 8, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-dim)' }}>(optional)</span>}
        </span>
      </div>

      <div className={s.fieldRow}>
        <label className={s.field}>
          <span className={s.fieldLabel}>
            Name {!optional && <span className={s.fieldRequired} aria-hidden>*</span>}
          </span>
          <input
            className={s.input}
            type="text"
            aria-label="Name"
            required={!optional}
            value={value.name}
            onChange={set('name')}
            placeholder="Jane Carter"
          />
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>
            Phone {!optional && <span className={s.fieldRequired} aria-hidden>*</span>}
          </span>
          <input
            className={s.input}
            type="tel"
            aria-label="Phone"
            required={!optional}
            value={value.phone}
            onChange={set('phone')}
            placeholder="555-111-2222"
          />
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>
            Email {!optional && <span className={s.fieldRequired} aria-hidden>*</span>}
          </span>
          <input
            className={s.input}
            type="email"
            aria-label="Email"
            required={!optional}
            value={value.email}
            onChange={set('email')}
            placeholder="you@example.com"
          />
          {!optional && (
            <span className={s.fieldHint}>
              Your confirmation and edit link will land here.
            </span>
          )}
        </label>
      </div>
    </section>
  )
}
