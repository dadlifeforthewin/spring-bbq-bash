'use client'
import { HTMLAttributes } from 'react'
import QRScanner from '../QRScanner'
import { clsx } from './clsx'

type Tone = 'magenta' | 'cyan' | 'uv' | 'gold' | 'mint'
type Aspect = 'square' | 'portrait'

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone
  aspect?: Aspect
  hint?: React.ReactNode
  scanning?: boolean
  /**
   * When provided, the frame activates a live camera QR scanner and calls
   * onScan(decodedText) on each decode. Children still render (stacked below
   * the camera) and serve as a manual-entry fallback when camera access is
   * denied or the decode fails. Omit to keep the frame purely decorative.
   */
  onScan?: (decodedText: string) => void
}

const cornerToneClasses: Record<Tone, string> = {
  magenta: 'border-neon-magenta shadow-glow-magenta',
  cyan:    'border-neon-cyan    shadow-glow-cyan',
  uv:      'border-neon-uv      shadow-glow-uv',
  gold:    'border-neon-gold    shadow-glow-gold',
  mint:    'border-neon-mint    shadow-glow-mint',
}

const beamToneClasses: Record<Tone, string> = {
  magenta: 'bg-gradient-to-b from-transparent via-neon-magenta/60 to-transparent',
  cyan:    'bg-gradient-to-b from-transparent via-neon-cyan/60    to-transparent',
  uv:      'bg-gradient-to-b from-transparent via-neon-uv/60      to-transparent',
  gold:    'bg-gradient-to-b from-transparent via-neon-gold/60    to-transparent',
  mint:    'bg-gradient-to-b from-transparent via-neon-mint/60    to-transparent',
}

const aspectClasses: Record<Aspect, string> = {
  square:   'aspect-square',
  portrait: 'aspect-[3/4]',
}

export function NeonScanner({ tone = 'cyan', aspect = 'portrait', hint, scanning = true, onScan, className, children, ...rest }: Props) {
  const cornerBase = 'absolute h-8 w-8 border-2'
  const stackCamera = !!onScan
  return (
    <div
      {...rest}
      className={clsx(
        'relative w-full overflow-hidden rounded-[14px] bg-ink-2/70 border border-ink-hair',
        aspectClasses[aspect],
        className,
      )}
    >
      <span data-role="corner" className={clsx(cornerBase, 'top-3 left-3 border-t-2 border-l-2 border-b-0 border-r-0 rounded-tl-[6px]', cornerToneClasses[tone])} />
      <span data-role="corner" className={clsx(cornerBase, 'top-3 right-3 border-t-2 border-r-2 border-b-0 border-l-0 rounded-tr-[6px]', cornerToneClasses[tone])} />
      <span data-role="corner" className={clsx(cornerBase, 'bottom-3 left-3 border-b-2 border-l-2 border-t-0 border-r-0 rounded-bl-[6px]', cornerToneClasses[tone])} />
      <span data-role="corner" className={clsx(cornerBase, 'bottom-3 right-3 border-b-2 border-r-2 border-t-0 border-l-0 rounded-br-[6px]', cornerToneClasses[tone])} />
      <div className={clsx(
        'absolute inset-3 flex items-center justify-center',
        stackCamera && 'flex-col gap-3',
      )}>
        {stackCamera && (
          <div className="flex w-full flex-1 items-center justify-center min-h-0">
            <QRScanner onScan={onScan!} />
          </div>
        )}
        {children}
      </div>
      {scanning && (
        <span
          data-role="beam"
          aria-hidden
          className={clsx(
            'absolute inset-x-3 h-[20%] motion-safe:animate-beam-sweep',
            beamToneClasses[tone],
          )}
        />
      )}
      {hint && (
        <span
          className={clsx(
            'absolute inset-x-0 bottom-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em]',
            '[font-family:var(--font-mono),JetBrains_Mono,monospace]',
            'text-mist',
          )}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
