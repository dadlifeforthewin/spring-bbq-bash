'use client'
import PickupList from './PickupList'
import WristbandPreview from './WristbandPreview'
import s from './registration.module.css'

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
    // FACTS billing is not parent-facing in the glow-party edition.
    // Kept on the payload for back-compat + admin override; default off.
    facts_reload_permission: false,
    facts_max_amount: 0,
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
    <div className={`${s.card} ${s.cardAccentPink}`}>
      <header className={s.cardHead} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className={s.cardEyebrow}>
            Child{typeof index === 'number' ? ` #${index + 1}` : ''}
          </span>
          <span className={s.cardTitle}>{displayName || 'New child'}</span>
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} className={s.removeBtn}>
            Remove child
          </button>
        )}
      </header>

      <WristbandPreview
        firstName={value.first_name}
        lastName={value.last_name}
        grade={value.grade}
        hasAllergies={value.allergies.trim().length > 0}
      />

      <div className={`${s.fieldRow} ${s.cols2}`}>
        <label className={s.field}>
          <span className={s.fieldLabel}>First name <span className={s.fieldRequired} aria-hidden>*</span></span>
          <input
            className={s.input}
            type="text"
            required
            aria-label="First name"
            value={value.first_name}
            onChange={(e) => set('first_name', e.target.value)}
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Last name <span className={s.fieldRequired} aria-hidden>*</span></span>
          <input
            className={s.input}
            type="text"
            required
            aria-label="Last name"
            value={value.last_name}
            onChange={(e) => set('last_name', e.target.value)}
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Age</span>
          <input
            className={s.input}
            type="number"
            min={1}
            max={25}
            aria-label="Age"
            value={value.age ?? ''}
            onChange={(e) =>
              set('age', e.target.value === '' ? null : Math.max(1, Math.min(25, Number(e.target.value))))
            }
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Grade</span>
          <input
            className={s.input}
            type="text"
            aria-label="Grade"
            value={value.grade}
            placeholder="e.g. 2nd"
            onChange={(e) => set('grade', e.target.value)}
          />
        </label>
      </div>

      <label className={s.field} style={{ marginTop: 14 }}>
        <span className={s.fieldLabel}>Allergies or medical notes</span>
        <textarea
          className={s.textarea}
          rows={2}
          value={value.allergies}
          onChange={(e) => set('allergies', e.target.value)}
        />
        <span className={s.fieldHint}>Optional. Leave blank if none.</span>
      </label>

      <label className={s.field} style={{ marginTop: 14 }}>
        <span className={s.fieldLabel}>Special instructions</span>
        <textarea
          className={s.textarea}
          rows={2}
          value={value.special_instructions}
          onChange={(e) => set('special_instructions', e.target.value)}
        />
        <span className={s.fieldHint}>Optional. Anything the volunteers should know.</span>
      </label>

      <section style={{ marginTop: 18 }}>
        <span className={s.fieldLabel} style={{ display: 'block', marginBottom: 8 }}>Approved pickup list</span>
        <PickupList
          value={value.pickup_authorizations}
          onChange={(v) => set('pickup_authorizations', v)}
        />
      </section>

      <section className={s.perksStrip}>
        <header className={s.perksStripHead}>
          <span className={s.perksStripLabel}>Included at the party</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--glow-cyan)' }}>2 DRINKS</span>
          <span style={{ color: 'var(--ink-dim)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--glow-pink)' }}>3 JAIL / PASS</span>
          <span style={{ color: 'var(--ink-dim)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--glow-yellow)' }}>1 PRIZE SPIN</span>
          <span style={{ color: 'var(--ink-dim)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--glow-purple)' }}>1 DJ SHOUTOUT</span>
        </header>
        <p className={s.perksStripCopy}>
          Every kid arrives with the full Glow Party Edition perks. You don&apos;t
          need to pick or preload anything — volunteers will track it all on the
          wristband.
        </p>
      </section>
    </div>
  )
}
