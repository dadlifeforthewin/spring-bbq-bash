'use client'

import { useEffect, useRef } from 'react'

/**
 * Aurora background — slowly drifting neon clouds rendered on a <canvas>.
 * Uses real gradient blurs, not a static image, so the light shifts subtly
 * over time (key to the "who made this?" feel).
 *
 * Falls back to a static CSS radial if the user prefers reduced motion.
 */
export function Aurora({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      // One static paint, no loop.
      paint(ctx, canvas, 0)
      return
    }

    let raf = 0
    let start = performance.now()
    let running = true

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        start = performance.now() - 0
        tick()
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()

    const tick = () => {
      if (!running) return
      const t = (performance.now() - start) / 1000
      paint(ctx, canvas, t)
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}

type Blob = {
  color: [number, number, number]
  x: number
  y: number
  r: number
  speed: number
  phase: number
}

const BLOBS: Blob[] = [
  { color: [155, 92, 255],  x: 0.5, y: 0.0,  r: 0.55, speed: 0.045, phase: 0.1 },
  { color: [255, 46, 147],  x: 0.85, y: 1.0, r: 0.45, speed: 0.038, phase: 1.3 },
  { color: [0, 230, 247],   x: 0.15, y: 0.85, r: 0.4, speed: 0.052, phase: 2.9 },
  { color: [255, 225, 71],  x: 0.35, y: 0.45, r: 0.22, speed: 0.033, phase: 0.7 },
]

function paint(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.width / dpr
  const h = canvas.height / dpr
  ctx.clearRect(0, 0, w, h)

  for (const b of BLOBS) {
    const drift = Math.sin(t * b.speed * 2 * Math.PI + b.phase) * 0.08
    const cx = (b.x + drift) * w
    const cy = (b.y + Math.cos(t * b.speed * 1.4 * Math.PI + b.phase) * 0.06) * h
    const radius = Math.max(w, h) * b.r
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    const [r, g, bl] = b.color
    grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, 0.30)`)
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${bl}, 0.10)`)
    grad.addColorStop(1, `rgba(${r}, ${g}, ${bl}, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  // Light vignette so content stays legible
  const vign = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8)
  vign.addColorStop(0, 'rgba(11,10,31,0)')
  vign.addColorStop(1, 'rgba(11,10,31,0.55)')
  ctx.fillStyle = vign
  ctx.fillRect(0, 0, w, h)
}
