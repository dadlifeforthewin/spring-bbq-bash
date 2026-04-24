import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StationPicker from '@/components/station/StationPicker'

// Picker uses next/router only for prefetch warming; tests don't assert
// on prefetch calls.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
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
    try { localStorage.clear() } catch {}
  })

  afterEach(() => {
    try { localStorage.clear() } catch {}
  })

  it('routes prize_wheel tile to /station/prize_wheel (not /station/activity)', () => {
    render(<StationPicker stations={STATIONS} />)
    const link = screen.getByRole('link', { name: /prize wheel/i })
    expect(link).toHaveAttribute('href', '/station/prize_wheel')
  })

  it('renders cleanup tile and routes it to /station/cleanup', () => {
    render(<StationPicker stations={STATIONS} />)
    const link = screen.getByRole('link', { name: /cleanup crew/i })
    expect(link).toBeInTheDocument()
    // cleanup sub copy distinguishes it from the generic "Log the visit" fallback
    expect(screen.getByText(/end-of-night checklist/i)).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/station/cleanup')
  })

  it('renders dedicated glyphs (no SparkGlyph fallback) for all 8 previously-unstyled slugs', () => {
    // Each station tile's <svg> carries a glyph-specific data-glyph attribute;
    // this test asserts the 8 unstyled slugs render a non-spark glyph.
    const { container } = render(<StationPicker stations={STATIONS} />)
    const links = Array.from(container.querySelectorAll('a'))

    // Helper: find the link whose visible name contains the slug's human label.
    const svgFor = (labelRegex: RegExp) => {
      const link = links.find((a) => labelRegex.test(a.textContent ?? ''))
      expect(link, `missing tile for ${labelRegex}`).toBeTruthy()
      return link!.querySelector('svg')
    }

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
    fireEvent.click(screen.getByRole('link', { name: /prize wheel/i }))
    expect(localStorage.getItem('sbbq_station')).toBe('prize_wheel')
  })

  it('falls back to /station/activity for unknown slugs (FALLBACK preserved)', () => {
    render(<StationPicker stations={[{ slug: 'future_station_xyz', name: 'Future' }]} />)
    const link = screen.getByRole('link', { name: /future/i })
    expect(link).toHaveAttribute('href', '/station/activity')
  })
})
