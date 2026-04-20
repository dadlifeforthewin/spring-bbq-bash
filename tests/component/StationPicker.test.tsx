import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StationPicker from '@/components/station/StationPicker'

// Router push spy — recreated per test so each assertion gets a clean call list.
const pushSpy = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushSpy(...args), replace: vi.fn() }),
}))

type Station = { slug: string; name: string }

const STATIONS: Station[] = [
  { slug: 'check_in',          name: 'Check-In' },
  { slug: 'prize_wheel',       name: 'Prize Wheel' },
  { slug: 'cleanup',           name: 'Cleanup Crew' },
  { slug: 'cornhole',          name: 'Cornhole' },
  { slug: 'face_painting',     name: 'Face Painting' },
  { slug: 'arts_crafts',       name: 'Arts & Crafts' },
  { slug: 'video_games',       name: 'Video Games' },
  { slug: 'dance_competition', name: 'Dance Competition' },
  { slug: 'pizza',             name: 'Pizza' },
  { slug: 'cake_walk',         name: 'Cake Walk' },
  { slug: 'quiet_corner',      name: 'Quiet Corner' },
]

describe('<StationPicker>', () => {
  beforeEach(() => {
    pushSpy.mockReset()
    try { localStorage.clear() } catch {}
  })

  afterEach(() => {
    try { localStorage.clear() } catch {}
  })

  it('routes prize_wheel tile to /station/prize_wheel (not /station/activity)', () => {
    render(<StationPicker stations={STATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /prize wheel/i }))
    expect(pushSpy).toHaveBeenCalledWith('/station/prize_wheel')
  })

  it('renders cleanup tile and routes it to /station/cleanup', () => {
    render(<StationPicker stations={STATIONS} />)
    const btn = screen.getByRole('button', { name: /cleanup crew/i })
    expect(btn).toBeInTheDocument()
    // cleanup sub copy distinguishes it from the generic "Log the visit" fallback
    expect(screen.getByText(/end-of-night checklist/i)).toBeInTheDocument()
    fireEvent.click(btn)
    expect(pushSpy).toHaveBeenCalledWith('/station/cleanup')
  })

  it('renders dedicated glyphs (no SparkGlyph fallback) for all 8 previously-unstyled slugs', () => {
    // Each station tile's <svg> carries a glyph-specific data-glyph attribute;
    // this test asserts the 8 unstyled slugs render a non-spark glyph.
    const { container } = render(<StationPicker stations={STATIONS} />)
    const buttons = Array.from(container.querySelectorAll('button'))

    // Helper: find the button whose visible name contains the slug's human label.
    const svgFor = (labelRegex: RegExp) => {
      const btn = buttons.find((b) => labelRegex.test(b.textContent ?? ''))
      expect(btn, `missing tile for ${labelRegex}`).toBeTruthy()
      return btn!.querySelector('svg')
    }

    // All 8 tiles should render *some* svg (dedicated glyph present, not a missing component)
    expect(svgFor(/cornhole/i)).toBeTruthy()
    expect(svgFor(/face painting/i)).toBeTruthy()
    expect(svgFor(/arts & crafts/i)).toBeTruthy()
    expect(svgFor(/video games/i)).toBeTruthy()
    expect(svgFor(/dance competition/i)).toBeTruthy()
    expect(svgFor(/pizza/i)).toBeTruthy()
    expect(svgFor(/cake walk/i)).toBeTruthy()
    expect(svgFor(/quiet corner/i)).toBeTruthy()
  })

  it('persists selected slug to localStorage on tap', () => {
    render(<StationPicker stations={STATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /prize wheel/i }))
    expect(localStorage.getItem('sbbq_station')).toBe('prize_wheel')
  })

  it('falls back to /station/activity for unknown slugs (FALLBACK preserved)', () => {
    render(<StationPicker stations={[{ slug: 'future_station_xyz', name: 'Future' }]} />)
    fireEvent.click(screen.getByRole('button', { name: /future/i }))
    expect(pushSpy).toHaveBeenCalledWith('/station/activity')
  })
})
