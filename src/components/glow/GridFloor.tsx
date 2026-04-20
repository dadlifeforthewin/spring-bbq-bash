import { clsx } from './clsx'

/**
 * Perspective grid floor at the bottom of a hero/section.
 * Pure CSS — two gradients (vertical lines + horizontal lines) on a
 * perspective-transformed plane. Composes with <Aurora /> in layout files.
 */
export function GridFloor({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        'pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] overflow-hidden',
        '[perspective:800px]',
        className,
      )}
    >
      <div
        className={clsx(
          'absolute inset-x-[-10%] bottom-[-20%] h-[80vh] [transform-origin:center_top] [transform:rotateX(62deg)]',
          '[background-image:repeating-linear-gradient(to_right,rgba(155,92,255,.18)_0,rgba(155,92,255,.18)_1px,transparent_1px,transparent_60px)]',
        )}
      />
      <div
        className={clsx(
          'absolute inset-x-[-10%] bottom-[-20%] h-[80vh] [transform-origin:center_top] [transform:rotateX(62deg)]',
          '[background-image:repeating-linear-gradient(to_bottom,rgba(0,230,247,.16)_0,rgba(0,230,247,.16)_1px,transparent_1px,transparent_60px)]',
          '[mask-image:linear-gradient(to_top,black,transparent_70%)]',
        )}
      />
    </div>
  )
}
