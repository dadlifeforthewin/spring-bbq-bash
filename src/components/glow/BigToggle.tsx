import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  disabled?: boolean
}

const onToneClasses: Record<Tone, string> = {
  magenta: 'bg-neon-magenta/25 border-neon-magenta shadow-glow-magenta',
  cyan:    'bg-neon-cyan/25    border-neon-cyan    shadow-glow-cyan',
  uv:      'bg-neon-uv/25      border-neon-uv      shadow-glow-uv',
  gold:    'bg-neon-gold/25    border-neon-gold    shadow-glow-gold',
  mint:    'bg-neon-mint/25    border-neon-mint    shadow-glow-mint',
}

const nubToneClasses: Record<Tone, string> = {
  magenta: 'bg-neon-magenta',
  cyan:    'bg-neon-cyan',
  uv:      'bg-neon-uv',
  gold:    'bg-neon-gold',
  mint:    'bg-neon-mint',
}

export function BigToggle({ checked, onChange, label, sub, tone = 'mint', disabled }: Props) {
  return (
    <label
      className={clsx(
        'flex items-center gap-4 rounded-xl border border-ink-hair bg-ink-2/70 px-4 py-3 cursor-pointer',
        'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-ink focus-within:ring-paper/50',
        checked && onToneClasses[tone],
        disabled && 'opacity-40 cursor-not-allowed',
        'transition-[background-color,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)]',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={clsx(
          'relative inline-block h-[30px] w-[56px] rounded-full border border-ink-hair bg-ink-3/60',
          checked && nubToneClasses[tone].replace('bg-', 'border-'),
        )}
      >
        <span
          className={clsx(
            'absolute top-[3px] h-[22px] w-[22px] rounded-full shadow-card',
            'transition-[left,background-color] duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)]',
            checked ? `left-[30px] ${nubToneClasses[tone]}` : 'left-[3px] bg-faint',
          )}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-display text-sm font-semibold text-paper">{label}</span>
        {sub && <span className="block text-xs text-mist mt-0.5">{sub}</span>}
      </span>
    </label>
  )
}
