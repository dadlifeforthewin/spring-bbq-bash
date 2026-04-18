import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'
import { clsx } from './clsx'

type FieldWrapperProps = {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function Field({ label, hint, error, required, children, className }: FieldWrapperProps) {
  return (
    <label className={clsx('block space-y-1.5', className)}>
      {label && (
        <span className="block text-xs font-medium uppercase tracking-wider text-mist">
          {label}
          {required && <span className="ml-1 text-neon-magenta">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-faint">{hint}</span>}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </label>
  )
}

const baseField =
  'w-full rounded-xl border border-ink-hair bg-ink-2/70 backdrop-blur-sm px-4 py-3 text-base text-paper placeholder:text-faint ' +
  'transition outline-none ' +
  'hover:border-ink-hair/80 ' +
  'focus:border-neon-cyan/70 focus:ring-4 focus:ring-neon-cyan/20 focus:shadow-[0_0_18px_rgba(0,230,247,.25)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, ...rest },
  ref,
) {
  const inner = (
    <input
      ref={ref}
      required={required}
      aria-invalid={!!error || undefined}
      className={clsx(baseField, error && 'border-danger/60 focus:border-danger/70 focus:ring-danger/20', className)}
      {...rest}
    />
  )
  if (!label && !hint && !error) return inner
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {inner}
    </Field>
  )
})

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, ...rest },
  ref,
) {
  const inner = (
    <textarea
      ref={ref}
      required={required}
      aria-invalid={!!error || undefined}
      className={clsx(baseField, 'resize-y min-h-[88px]', error && 'border-danger/60 focus:border-danger/70 focus:ring-danger/20', className)}
      {...rest}
    />
  )
  if (!label && !hint && !error) return inner
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {inner}
    </Field>
  )
})

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, children, ...rest },
  ref,
) {
  const inner = (
    <select
      ref={ref}
      required={required}
      aria-invalid={!!error || undefined}
      className={clsx(baseField, 'appearance-none pr-10 bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27><path fill=%27%23B6B3D9%27 d=%27M6 8L0 0h12z%27/></svg>")] bg-no-repeat bg-[right_1rem_center]', className)}
      {...rest}
    >
      {children}
    </select>
  )
  if (!label && !hint && !error) return inner
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {inner}
    </Field>
  )
})

export function Checkbox({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative inline-flex mt-0.5">
        <input type="checkbox" {...rest}
          className="peer appearance-none h-5 w-5 rounded-md border border-ink-hair bg-ink-2 transition checked:border-neon-magenta checked:bg-neon-magenta/20 checked:shadow-[0_0_14px_rgba(255,46,147,.45)] focus:outline-none focus:ring-4 focus:ring-neon-magenta/20" />
        <svg viewBox="0 0 12 12" className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-neon-magenta opacity-0 peer-checked:opacity-100 transition">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-6" />
        </svg>
      </span>
      <span className="text-sm text-paper leading-5">{label}</span>
    </label>
  )
}

export function Radio({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative inline-flex mt-0.5">
        <input type="radio" {...rest}
          className="peer appearance-none h-5 w-5 rounded-full border border-ink-hair bg-ink-2 transition checked:border-neon-cyan focus:outline-none focus:ring-4 focus:ring-neon-cyan/20" />
        <span className="pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 rounded-full scale-0 peer-checked:scale-100 bg-neon-cyan shadow-[0_0_12px_rgba(0,230,247,.6)] transition" />
      </span>
      <span className="text-sm text-paper leading-5">{label}</span>
    </label>
  )
}
